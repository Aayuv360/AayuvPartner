import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Clock, Fuel } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';

interface RouteNavigationProps {
  destination: {
    lat: number;
    lng: number;
    address: string;
    customerName?: string;
  };
  onRouteCalculated?: (route: RouteInfo) => void;
}

interface RouteInfo {
  distance: string;
  duration: string;
  fuelCost: string;
}

export default function RouteNavigation({ destination, onRouteCalculated }: RouteNavigationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { latitude, longitude } = useGeolocation();

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || !latitude || !longitude) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4
      }
    });

    renderer.setMap(mapInstance);
    setMap(mapInstance);
    setDirectionsRenderer(renderer);
  }, [latitude, longitude]);

  // Calculate route when destination changes
  useEffect(() => {
    if (!map || !directionsRenderer || !latitude || !longitude) return;

    calculateRoute();
  }, [map, directionsRenderer, destination, latitude, longitude]);

  const calculateRoute = async () => {
    if (!window.google?.maps || !latitude || !longitude) return;

    setIsCalculating(true);
    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: { lat: latitude, lng: longitude },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      if (result.routes && result.routes[0]) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        // Calculate fuel cost (assuming 15 km/l and ₹100/l)
        const distanceKm = leg.distance!.value / 1000;
        const fuelCost = (distanceKm / 15) * 100;

        const routeData: RouteInfo = {
          distance: leg.distance!.text,
          duration: leg.duration!.text,
          fuelCost: `₹${fuelCost.toFixed(0)}`
        };

        setRouteInfo(routeData);
        directionsRenderer?.setDirections(result);
        onRouteCalculated?.(routeData);
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${destination.lat},${destination.lng}`;
    window.open(url, '_blank');
  };

  if (!latitude || !longitude) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">Getting your location for navigation...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Map Container */}
      <div ref={mapRef} className="h-48 w-full bg-gray-100" />
      
      {/* Route Information */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Route to Customer</h3>
          <button
            onClick={openInGoogleMaps}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
          >
            <Navigation className="w-3 h-3" />
            Navigate
          </button>
        </div>

        <div className="mb-3">
          <p className="font-medium text-gray-900 text-sm">
            {destination.customerName || 'Customer'}
          </p>
          <p className="text-gray-600 text-xs flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {destination.address}
          </p>
        </div>

        {isCalculating ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : routeInfo ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center justify-center mb-1">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-600 font-medium">{routeInfo.distance}</p>
              <p className="text-xs text-gray-500">Distance</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-2">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-green-600 font-medium">{routeInfo.duration}</p>
              <p className="text-xs text-gray-500">Time</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-2">
              <div className="flex items-center justify-center mb-1">
                <Fuel className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-xs text-orange-600 font-medium">{routeInfo.fuelCost}</p>
              <p className="text-xs text-gray-500">Fuel Cost</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Calculating route...</p>
        )}
      </div>
    </div>
  );
}