import { useState } from 'react';
import { Package, MapPin, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import BottomNavigation from '@/components/layout/bottom-navigation';
import BatchOrders from '@/components/batching/batch-orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { IOrder, ICustomer } from '@shared/schema';
import { formatDateTimeIST, getRelativeTimeIST } from '@shared/timezone';

export default function Orders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: availableOrders, isLoading: isLoadingAvailable } = useQuery<(IOrder & { customer?: ICustomer })[]>({
    queryKey: ['/api/orders/available'],
  });

  const { data: orderHistory, isLoading: isLoadingHistory } = useQuery<(IOrder & { customer?: ICustomer })[]>({
    queryKey: ['/api/orders/history'],
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/active'] });
      toast({
        title: "Order accepted",
        description: "You have successfully accepted the order.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept order.",
        variant: "destructive",
      });
    },
  });

  const OrderCard = ({ order, showAcceptButton = false }: { order: IOrder & { customer?: ICustomer }, showAcceptButton?: boolean }) => {
    const getStatusBadge = (status: string) => {
      const statusConfig = {
        prepared: { label: 'Available', className: 'bg-blue-100 text-blue-800' },
        assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-800' },
        picked_up: { label: 'Picked up', className: 'bg-secondary/10 text-secondary' },
        on_the_way: { label: 'On the way', className: 'bg-warning/10 text-warning' },
        delivered: { label: 'Delivered', className: 'bg-secondary/10 text-secondary' },
        cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
      };
      
      const config = statusConfig[status as keyof typeof statusConfig] || { 
        label: status, 
        className: 'bg-gray-100 text-gray-800' 
      };
      
      return (
        <Badge variant="secondary" className={config.className}>
          {config.label}
        </Badge>
      );
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              {getStatusBadge(order.status)}
              <span className="text-gray-500 text-sm">#{order.orderNumber}</span>
            </div>
            <h3 className="font-medium text-gray-900">{order.customer?.name || 'Customer'}</h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {(order as any).deliveryAddressId ? 
                  `${(order as any).deliveryAddressId.addressLine1}, ${(order as any).deliveryAddressId.city}` :
                  'Address not available'
                }
              </span>
            </p>
            {(order as any).deliveryAddressId?.latitude && (order as any).deliveryAddressId?.longitude && (
              <p className="text-xs text-gray-400 mt-1">
                📍 {(order as any).deliveryAddressId.latitude}, {(order as any).deliveryAddressId.longitude}
              </p>
            )}
            {order.estimatedDeliveryTime && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                <span>{order.estimatedDeliveryTime} mins</span>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {order.createdAt ? getRelativeTimeIST(order.createdAt) : 'Just now'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">₹{order.amount}</p>
            <p className="text-sm text-secondary">+₹{order.deliveryFee}</p>
            <p className="text-xs text-gray-500">{order.paymentMethod}</p>
          </div>
        </div>
        
        {showAcceptButton && (
          <Button
            onClick={() => acceptOrderMutation.mutate(order._id)}
            disabled={acceptOrderMutation.isPending}
            className="w-full bg-primary text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Accept Order
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      
      <main className="pb-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Orders</h1>
          
          <Tabs defaultValue="batches" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="batches">Batches</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="batches" className="space-y-4 mt-4">
              <BatchOrders />
            </TabsContent>
            
            <TabsContent value="available" className="space-y-4 mt-4">
              {isLoadingAvailable ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : availableOrders && availableOrders.length > 0 ? (
                <div>
                  {availableOrders.map((order) => (
                    <OrderCard key={`available-${order._id}`} order={order} showAcceptButton />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No available orders</p>
                  <p className="text-sm text-gray-400 mt-1">Check back later for new orders</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4 mt-4">
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orderHistory && orderHistory.length > 0 ? (
                <div>
                  {orderHistory.map((order) => (
                    <OrderCard key={`history-${order._id}`} order={order} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No order history</p>
                  <p className="text-sm text-gray-400 mt-1">Your completed orders will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
