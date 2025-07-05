import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Shield, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export default function SOSButton() {
  const { toast } = useToast();
  const { latitude, longitude } = useGeolocation();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [emergencyContacts] = useState<EmergencyContact[]>([
    { name: 'Police', phone: '100', relation: 'Emergency Services' },
    { name: 'Ambulance', phone: '108', relation: 'Medical Emergency' },
    { name: 'Aayuv Support', phone: '+91-9876543210', relation: 'Platform Support' },
  ]);

  const sosActivation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; type: string }) => {
      const response = await apiRequest('POST', '/api/emergency/sos', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SOS Activated",
        description: "Emergency alert sent to support team and your contacts.",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "SOS Failed",
        description: "Failed to send emergency alert. Try calling directly.",
        variant: "destructive",
      });
    },
  });

  const sendLocationUpdate = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number }) => {
      const response = await apiRequest('POST', '/api/emergency/location', data);
      return response.json();
    },
  });

  // Send location updates every 30 seconds when SOS is active
  useEffect(() => {
    if (isSOSActive && latitude && longitude) {
      const interval = setInterval(() => {
        sendLocationUpdate.mutate({ latitude, longitude });
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isSOSActive, latitude, longitude]);

  // Countdown timer for SOS activation
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && showSOSDialog) {
      handleSOSActivation();
      setShowSOSDialog(false);
    }
  }, [countdown, showSOSDialog]);

  const handleSOSPress = () => {
    if (isSOSActive) {
      // Deactivate SOS
      setIsSOSActive(false);
      setCountdown(0);
      toast({
        title: "SOS Deactivated",
        description: "Emergency alert has been cancelled.",
      });
    } else {
      // Start countdown for SOS activation
      setShowSOSDialog(true);
      setCountdown(5);
    }
  };

  const handleSOSActivation = () => {
    if (latitude && longitude) {
      setIsSOSActive(true);
      sosActivation.mutate({
        latitude,
        longitude,
        type: 'sos_emergency'
      });
    } else {
      toast({
        title: "Location Required",
        description: "Please enable location services for emergency features.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSOS = () => {
    setCountdown(0);
    setShowSOSDialog(false);
  };

  const makeEmergencyCall = (phoneNumber: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <>
      {/* SOS Button */}
      <Button
        onClick={handleSOSPress}
        className={`
          w-20 h-20 rounded-full fixed bottom-24 right-4 z-50 shadow-lg
          ${isSOSActive 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-red-500 hover:bg-red-600'
          }
          text-white font-bold text-sm
        `}
        variant="destructive"
      >
        <div className="flex flex-col items-center">
          <AlertTriangle className="h-6 w-6 mb-1" />
          <span>{isSOSActive ? 'ACTIVE' : 'SOS'}</span>
        </div>
      </Button>

      {/* SOS Status Indicator */}
      {isSOSActive && (
        <Card className="fixed top-4 left-4 right-4 z-40 bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Shield className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-medium text-red-900">SOS Active</h3>
                <p className="text-sm text-red-700">
                  Your location is being shared with emergency contacts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SOS Countdown Dialog */}
      <Dialog open={showSOSDialog} onOpenChange={setShowSOSDialog}>
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Emergency SOS
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-red-600 animate-pulse">
              {countdown}
            </div>
            
            <p className="text-gray-600">
              SOS will be activated automatically in {countdown} seconds
            </p>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                This will alert emergency contacts and share your location
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleCancelSOS}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSOSActivation}
                variant="destructive"
                className="flex-1"
              >
                Activate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Contacts Floating Action */}
      {isSOSActive && (
        <Card className="fixed bottom-40 left-4 right-4 z-40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emergencyContacts.map((contact, index) => (
              <Button
                key={index}
                onClick={() => makeEmergencyCall(contact.phone)}
                variant="outline"
                className="w-full justify-start text-left"
                size="sm"
              >
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-xs text-gray-500">{contact.phone}</div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Location Sharing Status */}
      {isSOSActive && latitude && longitude && (
        <div className="fixed bottom-6 left-4 right-24 z-40">
          <div className="bg-green-100 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location Shared</span>
              <Clock className="h-3 w-3" />
              <span className="text-xs">Updated 30s ago</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}