import { MapPin, Clock, Navigation, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import OrderStatusProgress from './order-status-progress';
import type { Order, Customer } from '@shared/schema';

interface ActiveOrderCardProps {
  order: Order & { customer?: Customer };
}

export default function ActiveOrderCard({ order }: ActiveOrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PATCH', `/api/orders/${order.id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/earnings/today'] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-800' },
      picked_up: { label: 'Picked up', className: 'bg-secondary/10 text-secondary' },
      on_the_way: { label: 'On the way', className: 'bg-warning/10 text-warning' },
      delivered: { label: 'Delivered', className: 'bg-secondary/10 text-secondary' },
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

  const handleNavigation = () => {
    if (order.deliveryLatitude && order.deliveryLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Navigation unavailable",
        description: "Location coordinates not available for this order.",
        variant: "destructive",
      });
    }
  };

  const handleCall = () => {
    if (order.customer?.phone) {
      window.location.href = `tel:${order.customer.phone}`;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      assigned: 'picked_up',
      picked_up: 'on_the_way',
      on_the_way: 'delivered',
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getNextActionLabel = (currentStatus: string) => {
    const labels = {
      assigned: 'Mark as Picked Up',
      picked_up: 'Mark On the Way',
      on_the_way: 'Mark as Delivered',
    };
    return labels[currentStatus as keyof typeof labels];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {getStatusBadge(order.status)}
            <span className="text-gray-500 text-sm">#{order.orderNumber}</span>
          </div>
          <h3 className="font-medium text-gray-900">{order.customer?.name || 'Customer'}</h3>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{order.deliveryAddress}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">₹{order.amount}</p>
          <p className="text-sm text-gray-500">{order.paymentMethod}</p>
        </div>
      </div>
      
      <OrderStatusProgress status={order.status} />

      {/* ETA and Distance */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            ETA: <span className="font-medium text-gray-900">
              {order.estimatedDeliveryTime ? `${order.estimatedDeliveryTime} mins` : 'Calculating...'}
            </span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">2.3 km</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex space-x-3">
          <Button 
            onClick={handleNavigation}
            className="flex-1 bg-primary text-white"
            variant="default"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Navigate
          </Button>
          <Button 
            onClick={handleCall}
            className="flex-1 bg-secondary text-white"
            variant="default"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        </div>

        {/* Status Update Buttons */}
        {order.status !== 'delivered' && (
          <div className="flex space-x-3">
            {getNextStatus(order.status) && (
              <Button
                onClick={() => updateStatusMutation.mutate(getNextStatus(order.status))}
                disabled={updateStatusMutation.isPending}
                className="flex-1 bg-secondary text-white"
                variant="default"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {getNextActionLabel(order.status)}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 border-accent text-accent hover:bg-accent/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
