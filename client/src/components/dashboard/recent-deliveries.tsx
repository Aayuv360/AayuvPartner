import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Order, Customer } from '@shared/schema';

export default function RecentDeliveries() {
  const { data: orders, isLoading } = useQuery<(Order & { customer?: Customer })[]>({
    queryKey: ['/api/orders/history'],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </section>
    );
  }

  const recentDeliveries = orders?.slice(0, 3) || [];

  if (recentDeliveries.length === 0) {
    return (
      <section className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Deliveries</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No recent deliveries</p>
        </div>
      </section>
    );
  }

  const renderStars = (rating: number | null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i}
          className={`w-4 h-4 ${rating && i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const formatDeliveryTime = (timestamp: Date | null) => {
    if (!timestamp) return 'Recently delivered';
    
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <section className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
        <button className="text-primary text-sm font-medium">View all</button>
      </div>
      
      <div className="space-y-3">
        {recentDeliveries.map((delivery) => (
          <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge className="bg-secondary/10 text-secondary">
                    {delivery.status === 'delivered' ? 'Delivered' : delivery.status}
                  </Badge>
                  <span className="text-gray-500 text-sm">#{delivery.orderNumber}</span>
                </div>
                <h3 className="font-medium text-gray-900">
                  {delivery.customer?.name || 'Customer'}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDeliveryTime(delivery.actualDeliveryTime)}
                </p>
                <div className="flex items-center mt-2">
                  {renderStars(delivery.partnerRating)}
                  <span className="text-sm text-gray-500 ml-2">
                    {delivery.partnerRating ? delivery.partnerRating.toFixed(1) : 'Not rated'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">₹{delivery.amount}</p>
                <p className="text-sm text-secondary">+₹{delivery.deliveryFee}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
