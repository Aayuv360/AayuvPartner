import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import BottomNavigation from '@/components/layout/bottom-navigation';
import StatsGrid from '@/components/dashboard/stats-grid';
import DeliveryTracking from '@/components/delivery/delivery-tracking';
import RecentDeliveries from '@/components/dashboard/recent-deliveries';
import SurgeIndicator from '@/components/surge/surge-indicator';
import DailyPayout from '@/components/earnings/daily-payout';
import ShiftManager from '@/components/shifts/shift-manager';
import PartnerLocation from '@/components/maps/partner-location';
import { useWebSocket } from '@/hooks/use-websocket';
import { useGeolocation } from '@/hooks/use-geolocation';
import type { IOrder, ICustomer } from '@shared/schema';

export default function Home() {
  const { data: activeOrder, isLoading: isLoadingOrder } = useQuery<(IOrder & { customer?: ICustomer }) | null>({
    queryKey: ['/api/orders/active'],
  });

  // Set up real-time updates
  useWebSocket();
  useGeolocation();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      
      <main className="pb-20">
        {/* Partner Location */}
        <section className="px-4 mb-4">
          <PartnerLocation />
        </section>

        {/* Stats Dashboard */}
        <section className="p-4">
          <StatsGrid />
        </section>

        {/* Surge Zones & Daily Payout */}
        <section className="px-4 mb-6 space-y-4">
          <SurgeIndicator />
          <DailyPayout />
        </section>

        {/* Shift Management */}
        <section className="px-4 mb-6">
          <ShiftManager />
        </section>

        {/* Active Order Section */}
        <section className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Order</h2>
          
          {isLoadingOrder ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : activeOrder ? (
            <DeliveryTracking order={activeOrder} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500">No active orders</p>
              <p className="text-sm text-gray-400 mt-1">Turn on your availability to receive orders</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {activeOrder && (
          <section className="px-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <p className="font-medium text-gray-900">Mark Delivered</p>
                <p className="text-sm text-gray-500">Complete order</p>
              </button>
              
              <button className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-accent" />
                </div>
                <p className="font-medium text-gray-900">Report Issue</p>
                <p className="text-sm text-gray-500">Customer unavailable</p>
              </button>
            </div>
          </section>
        )}

        {/* Recent Deliveries */}
        <RecentDeliveries />
      </main>

      <BottomNavigation />
    </div>
  );
}
