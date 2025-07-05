import { Wallet, Download, Clock, CheckCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PayoutHistory {
  id: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  method: 'instant' | 'daily';
}

export default function DailyPayout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: todayEarnings, isLoading: isLoadingEarnings } = useQuery<number>({
    queryKey: ['/api/earnings/today'],
  });

  const { data: availableBalance } = useQuery<number>({
    queryKey: ['/api/earnings/available'],
  });

  const { data: payoutHistory } = useQuery<PayoutHistory[]>({
    queryKey: ['/api/payouts/history'],
  });

  const instantPayoutMutation = useMutation({
    mutationFn: async (amount: number) => {
      setIsProcessing(true);
      const response = await apiRequest('/api/payouts/instant', 'POST', { amount });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Instant Payout Requested",
        description: "Your earnings will be transferred within 30 minutes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/earnings/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payouts/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Payout Failed",
        description: error.message || "Unable to process instant payout",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleInstantPayout = () => {
    if (availableBalance && availableBalance >= 100) {
      instantPayoutMutation.mutate(availableBalance);
    } else {
      toast({
        title: "Minimum Amount Required",
        description: "Minimum ₹100 required for instant payout",
        variant: "destructive",
      });
    }
  };

  if (isLoadingEarnings) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-5 h-5 text-green-600" />
        <span className="font-medium text-gray-900">Daily Earnings</span>
      </div>

      {/* Today's Earnings */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Today's Total</span>
          <span className="text-2xl font-bold text-green-600">
            ₹{todayEarnings?.toFixed(2) || '0.00'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Next auto-payout: Tomorrow 6:00 AM
        </div>
      </div>

      {/* Available Balance */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Available for Instant Payout</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{availableBalance?.toFixed(2) || '0.00'}
            </p>
          </div>
          <button
            onClick={handleInstantPayout}
            disabled={!availableBalance || availableBalance < 100 || isProcessing}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              availableBalance && availableBalance >= 100 && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Instant Payout
              </>
            )}
          </button>
        </div>
        {availableBalance && availableBalance < 100 && (
          <p className="text-xs text-gray-500 mt-1">
            Minimum ₹100 required for instant payout
          </p>
        )}
      </div>

      {/* Recent Payouts */}
      {payoutHistory && payoutHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Payouts</h4>
          <div className="space-y-2">
            {payoutHistory.slice(0, 3).map((payout) => (
              <div key={payout.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  {payout.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : payout.status === 'pending' ? (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-red-100" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">₹{payout.amount}</p>
                    <p className="text-xs text-gray-500">
                      {payout.method === 'instant' ? 'Instant' : 'Daily'} • {
                        new Date(payout.requestedAt).toLocaleDateString()
                      }
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                  payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}