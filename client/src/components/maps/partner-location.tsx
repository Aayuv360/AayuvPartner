import { useEffect, useState } from 'react';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PartnerLocationProps {
  showFullAddress?: boolean;
  enableLocationUpdate?: boolean;
}

export default function PartnerLocation({ 
  showFullAddress = true, 
  enableLocationUpdate = true 
}: PartnerLocationProps) {
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const { latitude, longitude, error, isLoading } = useGeolocation();
  const { toast } = useToast();

  const updateLocationMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      return apiRequest('/api/partner/location', 'POST', {
        latitude: lat.toString(),
        longitude: lng.toString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Your location has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Failed to update location:', error);
    },
  });

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    if (!window.google?.maps) {
      console.warn('Google Maps API not loaded');
      return;
    }

    setIsLoadingAddress(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results && response.results[0]) {
        const formattedAddress = response.results[0].formatted_address;
        setAddress(formattedAddress);
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress('Unable to get address');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Update location when coordinates change
  useEffect(() => {
    if (latitude && longitude && enableLocationUpdate) {
      updateLocationMutation.mutate({ lat: latitude, lng: longitude });
      getAddressFromCoordinates(latitude, longitude);
    }
  }, [latitude, longitude, enableLocationUpdate]);

  const handleRefreshLocation = () => {
    if (latitude && longitude) {
      getAddressFromCoordinates(latitude, longitude);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-red-700">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Location Error</span>
        </div>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-red-600 underline mt-1"
        >
          Enable location access
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-blue-700">
          <Navigation className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">Getting your location...</span>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Location not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-700">Current Location</span>
            <button
              onClick={handleRefreshLocation}
              disabled={isLoadingAddress}
              className="text-green-600 hover:text-green-700"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingAddress ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {showFullAddress && (
            <div className="mt-1">
              {isLoadingAddress ? (
                <div className="animate-pulse">
                  <div className="h-3 bg-green-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-green-200 rounded w-1/2"></div>
                </div>
              ) : address ? (
                <p className="text-xs text-green-600 leading-relaxed">{address}</p>
              ) : (
                <p className="text-xs text-green-600">Getting address...</p>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
            <span>Lat: {latitude.toFixed(6)}</span>
            <span>Lng: {longitude.toFixed(6)}</span>
          </div>
        </div>
      </div>
      
      {updateLocationMutation.isPending && (
        <div className="mt-2 text-xs text-green-600">
          Updating location...
        </div>
      )}
    </div>
  );
}