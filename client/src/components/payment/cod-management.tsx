import React, { useState } from 'react';
import { Banknote, Calculator, CheckCircle, AlertCircle, Camera, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CODOrder {
  orderId: string;
  customerName: string;
  totalAmount: number;
  deliveryFee: number;
  itemsValue: number;
  paymentStatus: 'pending' | 'collected' | 'verified';
  collectedAmount?: number;
  changeGiven?: number;
  receiptPhoto?: string;
}

interface CODManagementProps {
  order: CODOrder;
  onComplete: () => void;
}

export default function CODManagement({ order, onComplete }: CODManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCODDialog, setShowCODDialog] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState<string>('');
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const changeAmount = collectedAmount ? parseFloat(collectedAmount) - order.totalAmount : 0;

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      orderId: string;
      collectedAmount: number;
      changeGiven: number;
      receiptPhoto?: File;
    }) => {
      const formData = new FormData();
      formData.append('orderId', data.orderId);
      formData.append('collectedAmount', data.collectedAmount.toString());
      formData.append('changeGiven', data.changeGiven.toString());
      
      if (data.receiptPhoto) {
        formData.append('receiptPhoto', data.receiptPhoto);
      }
      
      const response = await fetch('/api/orders/cod/collect', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Collected",
        description: "COD payment has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/active'] });
      setShowCODDialog(false);
      onComplete();
    },
    onError: () => {
      toast({
        title: "Collection Failed",
        description: "Failed to record COD payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCollectPayment = () => {
    setShowCODDialog(true);
    setCollectedAmount(order.totalAmount.toString());
  };

  const handleConfirmCollection = () => {
    const collected = parseFloat(collectedAmount);
    
    if (!collected || collected < order.totalAmount) {
      toast({
        title: "Invalid Amount",
        description: "Collected amount must be at least the order total.",
        variant: "destructive",
      });
      return;
    }

    const change = collected - order.totalAmount;
    
    updatePaymentMutation.mutate({
      orderId: order.orderId,
      collectedAmount: collected,
      changeGiven: change,
      receiptPhoto: receiptPhoto || undefined,
    });
  };

  const handlePhotoCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setReceiptPhoto(file);
        toast({
          title: "Photo Captured",
          description: "Receipt photo has been attached.",
        });
      }
    };
    input.click();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(0)}`;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Payment Pending</Badge>;
      case 'collected':
        return <Badge variant="outline">Amount Collected</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Payment Verified</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <span>Cash on Delivery</span>
            </div>
            {getPaymentStatusBadge(order.paymentStatus)}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items Value:</span>
              <span>{formatCurrency(order.itemsValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Collection Status */}
          {order.paymentStatus === 'pending' && (
            <Button
              onClick={handleCollectPayment}
              className="w-full"
              size="lg"
            >
              <Banknote className="h-5 w-5 mr-2" />
              Collect Cash Payment
            </Button>
          )}

          {order.paymentStatus === 'collected' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Payment Collected</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Collected:</span>
                    <span className="font-medium">{formatCurrency(order.collectedAmount || 0)}</span>
                  </div>
                  {(order.changeGiven || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Change Given:</span>
                      <span className="font-medium">{formatCurrency(order.changeGiven || 0)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsVerifying(true)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                View Collection Details
              </Button>
            </div>
          )}

          {order.paymentStatus === 'verified' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Payment Verified & Processed</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                COD amount has been verified and added to your earnings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* COD Collection Dialog */}
      <Dialog open={showCODDialog} onOpenChange={setShowCODDialog}>
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Collect Cash Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Amount Due</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(order.totalAmount)}
              </div>
            </div>

            <div>
              <Label htmlFor="collected-amount">Amount Collected</Label>
              <Input
                id="collected-amount"
                type="number"
                placeholder="Enter collected amount"
                value={collectedAmount}
                onChange={(e) => setCollectedAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {changeAmount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Change to Return</span>
                </div>
                <div className="text-lg font-bold text-amber-900">
                  {formatCurrency(changeAmount)}
                </div>
              </div>
            )}

            <div>
              <Label>Receipt Photo (Optional)</Label>
              <div className="flex items-center gap-3 mt-2">
                {receiptPhoto ? (
                  <div className="flex items-center gap-2 flex-1 p-2 bg-gray-50 rounded">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">{receiptPhoto.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 flex-1">No photo captured</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePhotoCapture}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCODDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCollection}
                disabled={!collectedAmount || parseFloat(collectedAmount) < order.totalAmount || updatePaymentMutation.isPending}
                className="flex-1"
              >
                {updatePaymentMutation.isPending ? "Recording..." : "Confirm Collection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={isVerifying} onOpenChange={setIsVerifying}>
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>Collection Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Order Total</span>
                <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Collected</span>
                <div className="font-medium">{formatCurrency(order.collectedAmount || 0)}</div>
              </div>
              {(order.changeGiven || 0) > 0 && (
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">Change Given</span>
                  <div className="font-medium">{formatCurrency(order.changeGiven || 0)}</div>
                </div>
              )}
            </div>

            {order.receiptPhoto && (
              <div>
                <span className="text-sm text-gray-600">Receipt Photo</span>
                <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">Receipt captured</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setIsVerifying(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}