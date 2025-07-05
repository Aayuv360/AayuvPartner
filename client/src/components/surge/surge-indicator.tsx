import { TrendingUp, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SurgeZone {
  id: string;
  name: string;
  multiplier: number;
  latitude: number;
  longitude: number;
  radius: number;
}

export default function SurgeIndicator() {
  const { data: surgeZones, isLoading } = useQuery<SurgeZone[]>({
    queryKey: ['/api/surge/zones'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 2.0) return 'text-red-600 bg-red-50';
    if (multiplier >= 1.5) return 'text-orange-600 bg-orange-50';
    if (multiplier >= 1.2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getMultiplierText = (multiplier: number) => {
    if (multiplier >= 2.0) return 'Very High';
    if (multiplier >= 1.5) return 'High';
    if (multiplier >= 1.2) return 'Medium';
    return 'Normal';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!surgeZones || surgeZones.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">Surge Areas</span>
        </div>
        <p className="text-sm text-gray-500">No surge zones active</p>
      </div>
    );
  }

  const highestSurge = surgeZones.reduce((max, zone) => 
    zone.multiplier > max.multiplier ? zone : max, surgeZones[0]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Peak Zones</span>
        </div>
        <span className="text-xs text-gray-500">Live updates</span>
      </div>

      <div className="space-y-2">
        {surgeZones.slice(0, 3).map((zone) => (
          <div key={zone.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-700">{zone.name}</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getMultiplierColor(zone.multiplier)}`}>
              {zone.multiplier}x • {getMultiplierText(zone.multiplier)}
            </div>
          </div>
        ))}
      </div>

      {highestSurge.multiplier > 1.2 && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            🚀 Head to <span className="font-medium">{highestSurge.name}</span> for {highestSurge.multiplier}x earnings!
          </p>
        </div>
      )}
    </div>
  );
}