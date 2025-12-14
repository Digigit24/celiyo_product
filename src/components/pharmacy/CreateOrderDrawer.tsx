// src/components/pharmacy/CreateOrderDrawer.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SideDrawer } from '@/components/SideDrawer';
import { Cart } from '@/types/pharmacy.types';
import { usePharmacy } from '@/hooks/usePharmacy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: Cart | undefined;
}

const orderSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export const CreateOrderDrawer: React.FC<CreateOrderDrawerProps> = ({ open, onOpenChange, cart }) => {
  const { createPharmacyOrder } = usePharmacy();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const onSubmit = (data: OrderFormData) => {
    if (!cart) return;
    createPharmacyOrder.mutate({
      cart_id: cart.id,
      patient_name: data.patient_name,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Order"
      description="Create a new order from the items in your cart."
      footerButtons={[
        {
          label: 'Cancel',
          variant: 'outline',
          onClick: () => onOpenChange(false),
          disabled: createPharmacyOrder.isLoading,
        },
        {
          label: 'Create Order',
          onClick: handleSubmit(onSubmit),
          loading: createPharmacyOrder.isLoading,
        },
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="patient_name">Patient Name</Label>
          <Input
            id="patient_name"
            {...register('patient_name')}
            className="mt-1"
            autoFocus
          />
          {errors.patient_name && (
            <p className="text-sm text-destructive mt-1">{errors.patient_name.message}</p>
          )}
        </div>
        
        <div className="text-sm">
            <h3 className="font-medium">Order Summary</h3>
            <p className="text-muted-foreground">
                You are about to create an order with {cart?.items?.length || 0} item(s) totaling ₹{cart?.total_cart_price || '0.00'}.
            </p>
        </div>
      </form>
    </SideDrawer>
  );
};
