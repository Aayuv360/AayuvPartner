import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { getAuthHeaders } from '@/lib/auth';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: true,
  });

  const updateLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      await apiRequest('POST', '/api/partner/location', {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        isLoading: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setState({
          latitude,
          longitude,
          error: null,
          isLoading: false,
        });
        updateLocation(latitude, longitude);
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [updateLocation]);

  useEffect(() => {
    getCurrentPosition();

    // Set up periodic location updates every 30 seconds
    const interval = setInterval(() => {
      if (!state.error) {
        getCurrentPosition();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [getCurrentPosition, state.error]);

  return {
    ...state,
    refreshLocation: getCurrentPosition,
  };
}
