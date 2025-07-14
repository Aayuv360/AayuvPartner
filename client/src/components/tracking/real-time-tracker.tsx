import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCurrentIST, formatTimeIST } from '@shared/timezone';
import type { IOrder, ICustomer } from '@shared/schema';

interface RealTimeTrackerProps {
  order: IOrder & { customer?: ICustomer };
}

export default function RealTimeTracker({ order }: RealTimeTrackerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const partnerMarkerRef = useRef<google.maps.Marker | null>(null);
  const customerMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');

  const { latitude, longitude, isLoading: isLoadingLocation } = useGeolocation();
  const { sendMessage } = useWebSocket();
  const { partner } = useAuth();

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;

      // Initialize map centered on partner location or default
      const center = latitude && longitude 
        ? { lat: parseFloat(latitude.toString()), lng: parseFloat(longitude.toString()) }
        : { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

      mapInstanceRef.current = new Map(mapRef.current!, {
        zoom: 15,
        center,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] }
        ]
      });

      // Create partner marker (delivery partner location)
      partnerMarkerRef.current = new Marker({
        position: center,
        map: mapInstanceRef.current,
        title: "Your Location",
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#fff" stroke-width="3"/>
              <path d="M15 20h10M20 15v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });

      // Create customer marker (delivery destination)
      const deliveryAddress = (order as any).deliveryAddressId;
      const hasCoordinates = (deliveryAddress?.latitude && deliveryAddress?.longitude) || 
                            (order.deliveryLatitude && order.deliveryLongitude);
      
      if (hasCoordinates) {
        const customerPosition = {
          lat: parseFloat(deliveryAddress?.latitude || order.deliveryLatitude || '0'),
          lng: parseFloat(deliveryAddress?.longitude || order.deliveryLongitude || '0')
        };

        customerMarkerRef.current = new Marker({
          position: customerPosition,
          map: mapInstanceRef.current,
          title: "Delivery Address",
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35">
                <path d="M17.5 0C11.15 0 6 5.15 6 11.5c0 8.75 11.5 23.5 11.5 23.5s11.5-14.75 11.5-23.5C29 5.15 23.85 0 17.5 0z" fill="#10B981"/>
                <circle cx="17.5" cy="11.5" r="6" fill="#fff"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(35, 35),
            anchor: new google.maps.Point(17, 35)
          }
        });

        // Initialize route renderer
        routeRendererRef.current = new DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4
          }
        });
        routeRendererRef.current.setMap(mapInstanceRef.current);

        // Calculate and display route
        updateRoute(center, customerPosition);
      }
    };

    initMap();
  }, [mapRef.current]);

  // Update partner location on map
  useEffect(() => {
    if (!latitude || !longitude || !partnerMarkerRef.current || !mapInstanceRef.current) return;

    const newPosition = { lat: parseFloat(latitude.toString()), lng: parseFloat(longitude.toString()) };
    
    // Update marker position
    partnerMarkerRef.current.setPosition(newPosition);
    
    // Center map on new position
    mapInstanceRef.current.panTo(newPosition);
    
    // Update route if customer location exists
    const deliveryAddress = (order as any).deliveryAddressId;
    const hasCoordinates = (deliveryAddress?.latitude && deliveryAddress?.longitude) || 
                          (order.deliveryLatitude && order.deliveryLongitude);
    
    if (hasCoordinates) {
      const customerPosition = {
        lat: parseFloat(deliveryAddress?.latitude || order.deliveryLatitude || '0'),
        lng: parseFloat(deliveryAddress?.longitude || order.deliveryLongitude || '0')
      };
      updateRoute(newPosition, customerPosition);
    }

    // Send location update via WebSocket
    if (partner) {
      sendMessage({
        type: 'partner_location_update',
        partnerId: partner._id,
        orderId: order._id,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        timestamp: getCurrentIST().toISO()
      });
    }

    setLastUpdateTime(formatTimeIST(new Date()));
  }, [latitude, longitude, order._id, sendMessage]);

  const updateRoute = async (start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral) => {
    if (!routeRendererRef.current) return;

    const directionsService = new google.maps.DirectionsService();
    
    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
            avoidTolls: false
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      routeRendererRef.current.setDirections(result);

      // Calculate estimated arrival time
      const route = result.routes[0];
      if (route && route.legs[0]) {
        const duration = route.legs[0].duration;
        if (duration) {
          const arrivalTime = getCurrentIST().plus({ seconds: duration.value });
          setEstimatedArrival(formatTimeIST(arrivalTime.toJSDate()));
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'picked_up': 'bg-blue-100 text-blue-800',
      'on_the_way': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Tracking Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Live Tracking</CardTitle>
            <Badge className={getStatusColor(order.status)}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Order #{order.orderNumber}</span>
            <span className="text-gray-600">₹{order.amount}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              Last Update: {lastUpdateTime || 'Updating...'}
            </div>
            {estimatedArrival && (
              <div className="text-green-600 font-medium">
                ETA: {estimatedArrival}
              </div>
            )}
          </div>

          <div className="flex items-start space-x-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
            <div>
              <p className="font-medium">{order.customer?.name}</p>
              <p className="text-gray-600">{order.deliveryAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Live Location
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-b-lg"
            style={{ minHeight: '256px' }}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => {
            if (order.customer?.phone) {
              window.open(`tel:${order.customer.phone}`, '_self');
            }
          }}
        >
          <span>Call Customer</span>
        </Button>
        <Button 
          className="flex items-center justify-center bg-green-600 hover:bg-green-700"
          onClick={() => {
            if (latitude && longitude && order.deliveryLatitude && order.deliveryLongitude) {
              const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${order.deliveryLatitude},${order.deliveryLongitude}`;
              window.open(url, '_blank');
            }
          }}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Navigate
        </Button>
      </div>
    </div>
  );
}