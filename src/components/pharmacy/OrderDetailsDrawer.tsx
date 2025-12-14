// src/components/pharmacy/OrderDetailsDrawer.tsx
import React from 'react';
import { SideDrawer } from '@/components/SideDrawer';
import { PharmacyOrder } from '@/types/pharmacy.types';
import { usePharmacy } from '@/hooks/usePharmacy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface OrderDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PharmacyOrder;
}

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({ open, onOpenChange, order }) => {
  const { cancelPharmacyOrder } = usePharmacy();

  const handleCancelOrder = () => {
    cancelPharmacyOrder.mutate(order.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Order #${order.order_id}`}
      description={`Details for order placed on ${format(new Date(order.created_at), 'PPpp')}`}
    >
      <div className="space-y-6">
        <div>
            <h3 className="font-medium">Order Summary</h3>
            <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Patient:</span>
                    <span>{order.patient_name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Price:</span>
                    <span className="font-semibold">₹{order.total_price}</span>
                </div>
            </div>
        </div>

        <Separator />

        <div>
            <h3 className="font-medium">Items ({order.items.length})</h3>
            <ul className="mt-2 space-y-2">
                {order.items.map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p>{item.product.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                                {item.quantity} x ₹{item.price}
                            </p>
                        </div>
                        <p className="font-medium">₹{item.total_price}</p>
                    </li>
                ))}
            </ul>
        </div>
        
        {order.status === 'pending' && (
            <>
                <Separator />
                <div className="mt-6">
                    <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleCancelOrder}
                        loading={cancelPharmacyOrder.isLoading}
                    >
                        Cancel Order
                    </Button>
                </div>
            </>
        )}
      </div>
    </SideDrawer>
  );
};
