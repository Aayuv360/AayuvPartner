import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI";

interface GoogleMapProps {
  height?: string;
  showCurrentLocation?: boolean;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

export default function GoogleMap({ 
  height = "400px", 
  showCurrentLocation = true, 
  deliveryLocation,
  onLocationUpdate 
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<google.maps.Marker | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { latitude, longitude, error: gpsError, isLoading: gpsLoading } = useGeolocation();

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        await loader.load();

        if (!mapRef.current) return;

        // Default to Delhi center if no GPS location
        const defaultCenter = { lat: 28.6139, lng: 77.2090 };
        const center = (latitude && longitude) 
          ? { lat: latitude, lng: longitude } 
          : defaultCenter;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#2563eb",
            strokeWeight: 4,
          }
        });

        directionsRendererInstance.setMap(mapInstance);

        setMap(mapInstance);
        setDirectionsService(directionsServiceInstance);
        setDirectionsRenderer(directionsRendererInstance);
        setIsLoading(false);

      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    initMap();
  }, [latitude, longitude]);

  // Update current location marker
  useEffect(() => {
    if (!map || !latitude || !longitude) return;

    // Remove existing marker
    if (currentLocationMarker) {
      currentLocationMarker.setMap(null);
    }

    // Create new marker for current location
    const marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285f4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    setCurrentLocationMarker(marker);

    // Center map on current location
    map.setCenter({ lat: latitude, lng: longitude });

    // Call location update callback
    if (onLocationUpdate) {
      onLocationUpdate(latitude, longitude);
    }

  }, [map, latitude, longitude, onLocationUpdate]);

  // Update delivery location marker and route
  useEffect(() => {
    if (!map || !deliveryLocation) return;

    // Remove existing delivery marker
    if (deliveryMarker) {
      deliveryMarker.setMap(null);
    }

    // Create delivery location marker
    const marker = new google.maps.Marker({
      position: { 
        lat: deliveryLocation.latitude, 
        lng: deliveryLocation.longitude 
      },
      map,
      title: deliveryLocation.address,
      icon: {
        url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32),
      },
    });

    setDeliveryMarker(marker);

    // Calculate and display route if current location is available
    if (directionsService && directionsRenderer && latitude && longitude) {
      directionsService.route({
        origin: { lat: latitude, lng: longitude },
        destination: { 
          lat: deliveryLocation.latitude, 
          lng: deliveryLocation.longitude 
        },
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      });
    }

  }, [map, deliveryLocation, directionsService, directionsRenderer, latitude, longitude]);

  const centerOnCurrentLocation = () => {
    if (map && latitude && longitude) {
      map.setCenter({ lat: latitude, lng: longitude });
      map.setZoom(16);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Control buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {showCurrentLocation && (
          <Button
            size="sm"
            variant="secondary"
            onClick={centerOnCurrentLocation}
            disabled={!latitude || !longitude}
            className="bg-white hover:bg-gray-50 shadow-md"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* GPS status indicator */}
      {gpsError && (
        <div className="absolute bottom-4 left-4 bg-red-100 border border-red-300 rounded-lg p-2">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>GPS unavailable</span>
          </div>
        </div>
      )}

      {gpsLoading && (
        <div className="absolute bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-2">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <MapPin className="h-4 w-4" />
            <span>Getting location...</span>
          </div>
        </div>
      )}
    </div>
  );
}