import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GoogleMap from '@/components/maps/google-map';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  Package, 
  CheckCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  amount: string;
  deliveryFee: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  estimatedDeliveryTime?: number;
  customer?: {
    name: string;
    phone: string;
  };
}

interface DeliveryTrackingProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: string) => void;
}

export default function DeliveryTracking({ order, onStatusUpdate }: DeliveryTrackingProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const { latitude, longitude } = useGeolocation();
  const { sendMessage } = useWebSocket();
  const { partner } = useAuth();

  const deliveryLocation = order.deliveryLatitude && order.deliveryLongitude ? {
    latitude: parseFloat(order.deliveryLatitude),
    longitude: parseFloat(order.deliveryLongitude),
    address: order.deliveryAddress
  } : undefined;

  // Calculate estimated arrival time
  useEffect(() => {
    if (order.estimatedDeliveryTime) {
      const estimatedTime = new Date(Date.now() + order.estimatedDeliveryTime * 60000);
      setEstimatedArrival(estimatedTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }
  }, [order.estimatedDeliveryTime]);

  // Update partner location in real-time
  const handleLocationUpdate = async (lat: number, lng: number) => {
    try {
      await apiRequest('POST', '/api/partner/location', {
        latitude: lat.toString(),
        longitude: lng.toString()
      });

      // Send location update via WebSocket
      sendMessage({
        type: 'location_update',
        partnerId: partner?._id,
        latitude: lat.toString(),
        longitude: lng.toString(),
        orderId: order._id
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Update order status
  const updateOrderStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await apiRequest('PATCH', `/api/orders/${order._id}/status`, {
        status: newStatus
      });

      if (response.ok) {
        // Send status update via WebSocket
        sendMessage({
          type: 'order_status_update',
          orderId: order._id,
          status: newStatus,
          partnerId: partner?._id
        });

        if (onStatusUpdate) {
          onStatusUpdate(order._id, newStatus);
        }
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'assigned': return 'secondary';
      case 'picked_up': return 'default';
      case 'on_the_way': return 'default';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Package className="h-4 w-4" />;
      case 'picked_up': return <Navigation className="h-4 w-4" />;
      case 'on_the_way': return <ArrowRight className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getNextAction = () => {
    switch (order.status) {
      case 'assigned':
        return { text: 'Mark as Picked Up', action: () => updateOrderStatus('picked_up'), variant: 'default' as const };
      case 'picked_up':
        return { text: 'Start Delivery', action: () => updateOrderStatus('on_the_way'), variant: 'default' as const };
      case 'on_the_way':
        return { text: 'Mark as Delivered', action: () => updateOrderStatus('delivered'), variant: 'default' as const };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="space-y-4">
      {/* Order Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1">
              {getStatusIcon(order.status)}
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{order.customer?.name || 'Customer'}</p>
              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
            </div>
            {order.customer?.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${order.customer.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Amount</p>
              <p className="font-medium">₹{order.amount}</p>
            </div>
            <div>
              <p className="text-gray-600">Delivery Fee</p>
              <p className="font-medium">₹{order.deliveryFee}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment</p>
              <p className="font-medium capitalize">{order.paymentMethod}</p>
            </div>
            {estimatedArrival && (
              <div>
                <p className="text-gray-600">ETA</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {estimatedArrival}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {nextAction && (
            <Button 
              onClick={nextAction.action}
              disabled={isUpdatingStatus}
              variant={nextAction.variant}
              className="w-full"
            >
              {isUpdatingStatus ? 'Updating...' : nextAction.text}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleMap
            height="300px"
            showCurrentLocation={true}
            deliveryLocation={deliveryLocation}
            onLocationUpdate={handleLocationUpdate}
          />
        </CardContent>
      </Card>

      {/* GPS Status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${latitude && longitude ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>GPS Status</span>
            </div>
            <span className={latitude && longitude ? 'text-green-600' : 'text-red-600'}>
              {latitude && longitude ? 'Active' : 'Inactive'}
            </span>
          </div>
          {latitude && longitude && (
            <div className="mt-2 text-xs text-gray-500">
              Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}