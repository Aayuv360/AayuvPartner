import { Wallet, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatsGrid() {
  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['/api/earnings/today'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/10">
        <div className="flex items-center justify-between mb-2">
          <Wallet className="w-5 h-5 text-secondary" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          ₹{todayStats?.todayEarnings?.toFixed(0) || '0'}
        </p>
        <p className="text-sm text-gray-500">Earnings</p>
      </div>
      
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {todayStats?.todayDeliveries || 0}
        </p>
        <p className="text-sm text-gray-500">Deliveries</p>
      </div>
    </div>
  );
}
