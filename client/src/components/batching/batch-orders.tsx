import { Package, MapPin, Clock, Route } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  amount: string;
  distance: number;
  estimatedTime: number;
  latitude: number;
  longitude: number;
}

interface BatchRoute {
  id: string;
  orders: BatchOrder[];
  totalDistance: number;
  totalTime: number;
  totalEarnings: string;
  optimizedRoute: { lat: number; lng: number; orderId: string }[];
}

export default function BatchOrders() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: availableBatches, isLoading } = useQuery<BatchRoute[]>({
    queryKey: ['/api/orders/batches'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const acceptBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      return apiRequest(`/api/orders/batches/${batchId}/accept`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Batch Accepted",
        description: "Route optimized and ready for pickup",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/batches'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept Batch",
        description: error.message || "Unable to accept batch orders",
        variant: "destructive",
      });
    },
  });

  const handleAcceptBatch = (batchId: string) => {
    setSelectedBatch(batchId);
    acceptBatchMutation.mutate(batchId);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!availableBatches || availableBatches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Batch Orders</span>
        </div>
        <p className="text-sm text-gray-500">No batch orders available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Batch Deliveries</span>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          +40% Earnings
        </span>
      </div>

      <div className="space-y-3">
        {availableBatches.map((batch) => (
          <div
            key={batch.id}
            className="border rounded-lg p-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">
                  {batch.orders.length} Orders • {batch.totalDistance.toFixed(1)}km
                </p>
                <p className="text-sm text-gray-600">
                  Est. {Math.round(batch.totalTime)} minutes
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  ₹{batch.totalEarnings}
                </p>
                <p className="text-xs text-gray-500">Total Earnings</p>
              </div>
            </div>

            {/* Order List */}
            <div className="space-y-2 mb-3">
              {batch.orders.slice(0, 2).map((order, index) => (
                <div key={order.id} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-700 truncate flex-1">
                    {order.address}
                  </span>
                  <span className="text-gray-500">₹{order.amount}</span>
                </div>
              ))}
              {batch.orders.length > 2 && (
                <p className="text-xs text-gray-500 ml-7">
                  +{batch.orders.length - 2} more orders
                </p>
              )}
            </div>

            {/* Route Info */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Route className="w-3 h-3" />
                <span>Optimized Route</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{Math.round(batch.totalTime)} min delivery</span>
              </div>
            </div>

            {/* Accept Button */}
            <button
              onClick={() => handleAcceptBatch(batch.id)}
              disabled={acceptBatchMutation.isPending && selectedBatch === batch.id}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                acceptBatchMutation.isPending && selectedBatch === batch.id
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {acceptBatchMutation.isPending && selectedBatch === batch.id
                ? 'Accepting...'
                : `Accept Batch (+₹${(parseFloat(batch.totalEarnings) * 0.4).toFixed(0)} bonus)`
              }
            </button>
          </div>
        ))}
      </div>

      {/* Batch Benefits */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <h4 className="text-sm font-medium text-green-900 mb-1">Batch Benefits</h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• 40% bonus on total earnings</li>
          <li>• Optimized route saves time & fuel</li>
          <li>• Higher customer ratings</li>
          <li>• Priority for future batches</li>
        </ul>
      </div>
    </div>
  );
}