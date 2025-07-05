import { useState } from 'react';
import { TrendingUp, Target, Clock, Star, Award, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PerformanceMetrics {
  rating: number;
  totalDeliveries: number;
  onTimePercentage: number;
  averageDeliveryTime: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  completionRate: number;
  customerSatisfaction: number;
}

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const { data: metrics, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/partner/performance', timeRange],
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-50';
    if (rating >= 4.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <p className="text-gray-500">Performance data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Performance Dashboard</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === 'week' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === 'month' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Rating and Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg border ${getRatingColor(metrics.rating)}`}>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">Rating</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">{metrics.rating.toFixed(1)}</span>
            <span className="text-xs">/5.0</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">Deliveries</span>
          </div>
          <div className="text-lg font-bold">{metrics.totalDeliveries}</div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">On-Time Rate</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {metrics.onTimePercentage}%
          </span>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">Avg. Time</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {metrics.averageDeliveryTime}min
          </span>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">Completion</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {metrics.completionRate}%
          </span>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">Satisfaction</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {metrics.customerSatisfaction}%
          </span>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
        <h4 className="text-sm font-medium text-green-900 mb-2">
          {timeRange === 'week' ? 'Weekly' : 'Monthly'} Earnings
        </h4>
        <div className="text-xl font-bold text-green-700">
          ₹{timeRange === 'week' ? metrics.weeklyEarnings : metrics.monthlyEarnings}
        </div>
        <p className="text-xs text-green-600 mt-1">
          {timeRange === 'week' ? 'This week' : 'This month'} total
        </p>
      </div>

      {/* Performance Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Performance Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Maintain 4.5+ rating for premium order access</li>
          <li>• Complete deliveries within estimated time</li>
          <li>• Accept orders during peak hours for higher earnings</li>
        </ul>
      </div>
    </div>
  );
}