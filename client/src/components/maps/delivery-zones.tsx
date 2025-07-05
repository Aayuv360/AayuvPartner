import { useState, useEffect } from 'react';
import { Target, MapPin, TrendingUp, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/use-geolocation';

interface DeliveryZone {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  demandLevel: 'low' | 'medium' | 'high' | 'surge';
  averageEarnings: string;
  activeOrders: number;
  estimatedWaitTime: number;
  distance: number;
  surgeMultiplier?: number;
}

export default function DeliveryZones() {
  const { latitude, longitude } = useGeolocation();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const { data: zones, isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ['/api/delivery-zones', latitude, longitude],
    enabled: !!latitude && !!longitude,
  });

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'surge': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getDemandLabel = (level: string) => {
    switch (level) {
      case 'surge': return 'Surge Pricing';
      case 'high': return 'High Demand';
      case 'medium': return 'Medium Demand';
      default: return 'Low Demand';
    }
  };

  const openMapsToZone = (zone: DeliveryZone) => {
    const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${zone.centerLat},${zone.centerLng}`;
    window.open(url, '_blank');
  };

  if (!latitude || !longitude) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Delivery Zones</span>
        </div>
        <p className="text-sm text-gray-500">Getting your location...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Delivery Zones</span>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sortedZones = zones?.sort((a, b) => a.distance - b.distance) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Nearby Delivery Zones</span>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          Live Updates
        </span>
      </div>

      {sortedZones.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No delivery zones found in your area
        </p>
      ) : (
        <div className="space-y-3">
          {sortedZones.slice(0, 4).map((zone) => (
            <div
              key={zone.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedZone === zone.id ? 'border-blue-300 bg-blue-50' : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{zone.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {zone.distance.toFixed(1)} km away
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getDemandColor(zone.demandLevel)}`}>
                    {getDemandLabel(zone.demandLevel)}
                  </span>
                  {zone.surgeMultiplier && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {zone.surgeMultiplier}x pricing
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="font-medium text-green-600">{zone.averageEarnings}</p>
                  <p className="text-gray-500">Avg. Earnings</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="font-medium text-blue-600">{zone.activeOrders}</p>
                  <p className="text-gray-500">Active Orders</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-3 h-3 text-orange-600" />
                  </div>
                  <p className="font-medium text-orange-600">{zone.estimatedWaitTime}m</p>
                  <p className="text-gray-500">Wait Time</p>
                </div>
              </div>

              {selectedZone === zone.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openMapsToZone(zone);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Navigate to Zone
                  </button>
                  
                  <div className="mt-2 text-xs text-gray-600">
                    <p>• Peak hours: 12-2 PM, 7-9 PM</p>
                    <p>• Best for: Food delivery, quick commerce</p>
                    <p>• Partner rating requirement: 4.0+</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone Selection Tips */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Pro Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Choose zones with surge pricing for higher earnings</li>
          <li>• Stay near zones with consistent demand</li>
          <li>• Monitor wait times to optimize your schedule</li>
        </ul>
      </div>
    </div>
  );
}