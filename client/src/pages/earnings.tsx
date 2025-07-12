import { Wallet, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import BottomNavigation from '@/components/layout/bottom-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import type { Earning } from '@shared/schema';
import { formatDateIST, formatDateTimeIST } from '@shared/timezone';

export default function Earnings() {
  const { partner } = useAuth();
  
  const { data: todayStats, isLoading: isLoadingToday } = useQuery({
    queryKey: ['/api/earnings/today'],
  });

  const { data: earningsHistory, isLoading: isLoadingHistory } = useQuery<Earning[]>({
    queryKey: ['/api/earnings/history'],
  });

  const formatCurrency = (amount: string | number) => {
    return `₹${parseFloat(amount.toString()).toFixed(0)}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return formatDateIST(date);
  };

  const groupEarningsByDate = (earnings: Earning[]) => {
    const grouped = earnings.reduce((acc, earning) => {
      const date = earning.date ? new Date(earning.date).toDateString() : 'Unknown';
      if (!acc[date]) {
        acc[date] = { date, earnings: [], total: 0 };
      }
      acc[date].earnings.push(earning);
      acc[date].total += parseFloat(earning.amount);
      return acc;
    }, {} as Record<string, { date: string; earnings: Earning[]; total: number }>);

    return Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      
      <main className="pb-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings</h1>
          
          {/* Today's Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-5 h-5 text-secondary" />
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                {isLoadingToday ? (
                  <Skeleton className="h-8 w-20 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todayStats?.todayEarnings || 0)}
                  </p>
                )}
                <p className="text-sm text-gray-500">Earnings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(partner?.totalEarnings || 0)}
                </p>
                <p className="text-sm text-gray-500">All Time</p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Deliveries</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {partner?.totalDeliveries || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average per Delivery</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {partner?.totalDeliveries ? 
                      formatCurrency(parseFloat(partner.totalEarnings) / partner.totalDeliveries) : 
                      '₹0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Earnings History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : earningsHistory && earningsHistory.length > 0 ? (
                <div className="space-y-3">
                  {groupEarningsByDate(earningsHistory).map((group, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          {formatDate(new Date(group.date))}
                        </p>
                        <p className="font-semibold text-secondary">
                          {formatCurrency(group.total)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {group.earnings.length} delivery{group.earnings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No earnings history</p>
                  <p className="text-sm text-gray-400 mt-1">Complete deliveries to see your earnings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
