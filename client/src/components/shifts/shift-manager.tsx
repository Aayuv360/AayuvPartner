import { Clock, Calendar, Power, Settings } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  estimatedEarnings: string;
}

interface ShiftPreference {
  partnerId: string;
  preferredShifts: string[];
  isOnline: boolean;
  autoAcceptOrders: boolean;
}

export default function ShiftManager() {
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: availableShifts, isLoading } = useQuery<Shift[]>({
    queryKey: ['/api/shifts/available'],
  });

  const { data: preferences } = useQuery<ShiftPreference>({
    queryKey: ['/api/shifts/preferences'],
  });

  const { data: currentShift } = useQuery<Shift | null>({
    queryKey: ['/api/shifts/current'],
  });

  const updateShiftMutation = useMutation({
    mutationFn: async (shiftId: string | null) => {
      return apiRequest('/api/shifts/update', 'POST', { shiftId });
    },
    onSuccess: () => {
      toast({
        title: "Shift Updated",
        description: selectedShift ? "You're now online for this shift" : "You've gone offline",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/partner/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update shift",
        variant: "destructive",
      });
    },
  });

  const toggleOnlineMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      return apiRequest('/api/partner/status', 'PATCH', { isOnline });
    },
    onSuccess: (_, isOnline) => {
      toast({
        title: isOnline ? "You're Online" : "You're Offline",
        description: isOnline ? "Ready to receive orders" : "You won't receive new orders",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/partner/profile'] });
    },
  });

  const handleShiftSelect = (shiftId: string) => {
    setSelectedShift(shiftId);
    updateShiftMutation.mutate(shiftId);
  };

  const handleGoOffline = () => {
    setSelectedShift(null);
    updateShiftMutation.mutate(null);
  };

  const toggleOnlineStatus = () => {
    toggleOnlineMutation.mutate(!preferences?.isOnline);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Work Shifts</span>
        </div>
        <button
          onClick={toggleOnlineStatus}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            preferences?.isOnline
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Power className="w-3 h-3" />
          {preferences?.isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Current Shift Status */}
      {currentShift && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Active Shift</p>
              <p className="text-lg font-bold text-blue-900">{currentShift.name}</p>
              <p className="text-xs text-blue-700">
                {currentShift.startTime} - {currentShift.endTime}
              </p>
            </div>
            <button
              onClick={handleGoOffline}
              className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50"
            >
              End Shift
            </button>
          </div>
        </div>
      )}

      {/* Available Shifts */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Available Shifts</h4>
        
        {availableShifts?.map((shift) => (
          <div
            key={shift.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              currentShift?.id === shift.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => !currentShift && handleShiftSelect(shift.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{shift.name}</p>
                <p className="text-sm text-gray-600">
                  {shift.startTime} - {shift.endTime}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  Est. ₹{shift.estimatedEarnings}/day
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {shift.isActive && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    High Demand
                  </span>
                )}
                {currentShift?.id !== shift.id && !currentShift && (
                  <button
                    className="text-sm text-blue-600 font-medium hover:underline"
                    disabled={updateShiftMutation.isPending}
                  >
                    {updateShiftMutation.isPending ? 'Starting...' : 'Start'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500">Shifts This Week</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">32h</p>
            <p className="text-xs text-gray-500">Total Hours</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">₹2,450</p>
            <p className="text-xs text-gray-500">Weekly Earnings</p>
          </div>
        </div>
      </div>

      {/* Settings Link */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <Settings className="w-4 h-4" />
          Shift Preferences
        </button>
      </div>
    </div>
  );
}