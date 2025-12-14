// src/pages/CartList.tsx
import React, { useState, useMemo } from 'react';
import { usePharmacy } from '@/hooks/usePharmacy';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { DrawerMode } from '@/components/SideDrawer';
import { CartItem, PharmacyOrder } from '@/types/pharmacy.types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { OrderDetailsDrawer } from '@/components/pharmacy/OrderDetailsDrawer';
import { CreateOrderDrawer } from '@/components/pharmacy/CreateOrderDrawer';

export const CartListPage: React.FC = () => {
  const { 
    useCart, 
    usePharmacyOrders,
    updateCartItem,
    removeItemFromCart,
    clearCart,
  } = usePharmacy();

  const { data: cart, isLoading: cartLoading, mutate: refreshCart } = useCart();
  const { data: ordersData, isLoading: ordersLoading, mutate: refreshOrders } = usePharmacyOrders();

  const [orderDetailsDrawerOpen, setOrderDetailsDrawerOpen] = useState(false);
  const [createOrderDrawerOpen, setCreateOrderDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PharmacyOrder | undefined>(undefined);

  const handleViewOrder = (order: PharmacyOrder) => {
    setSelectedOrder(order);
    setOrderDetailsDrawerOpen(true);
  };

  const cartItems = cart?.items || [];
  const orders = ordersData?.results || [];

  const cartColumns = useMemo((): DataTableColumn<CartItem>[] => [
    {
      header: 'Product',
      key: 'product',
      cell: (item) => item.product.product_name,
    },
    {
      header: 'Price',
      key: 'price',
      cell: (item) => `₹${item.price}`,
    },
    {
      header: 'Quantity',
      key: 'quantity',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateCartItem.mutate({ cart_item_id: item.id, quantity: item.quantity - 1 })}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span>{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateCartItem.mutate({ cart_item_id: item.id, quantity: item.quantity + 1 })}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      header: 'Total',
      key: 'total',
      cell: (item) => `₹${item.total_price}`,
    },
  ], [updateCartItem]);

  const ordersColumns = useMemo((): DataTableColumn<PharmacyOrder>[] => [
    {
      header: 'Order ID',
      key: 'order_id',
      cell: (order) => <div className="font-mono">{order.order_id}</div>,
    },
    {
      header: 'Patient',
      key: 'patient',
      cell: (order) => order.patient_name,
    },
    {
      header: 'Status',
      key: 'status',
      cell: (order) => <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>{order.status}</Badge>,
    },
    {
      header: 'Total',
      key: 'total',
      cell: (order) => `₹${order.total_price}`,
    },
    {
      header: 'Date',
      key: 'date',
      cell: (order) => format(new Date(order.created_at), 'PPpp'),
    },
  ], []);

  return (
    <div className="flex flex-col h-full p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cart & Orders</h1>
      </div>

      <Tabs defaultValue="cart">
        <TabsList>
          <TabsTrigger value="cart">Cart ({cartItems.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="cart" className="mt-4">
            <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" onClick={() => clearCart.mutate()} disabled={cartItems.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4"/> Clear Cart
                </Button>
                <Button onClick={() => setCreateOrderDrawerOpen(true)} disabled={cartItems.length === 0}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </div>
            <DataTable
                rows={cartItems}
                columns={cartColumns}
                isLoading={cartLoading}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.product.product_name}
                onDelete={(row) => removeItemFromCart.mutate({ cart_item_id: row.id })}
                emptyTitle="Your cart is empty"
                emptySubtitle="Add products to your cart to get started."
                renderMobileCard={(row) => <div>{row.product.product_name}</div>}
            />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
            <DataTable
                rows={orders}
                columns={ordersColumns}
                isLoading={ordersLoading}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.order_id}
                onView={handleViewOrder}
                emptyTitle="No orders found"
                emptySubtitle="You haven't placed any orders yet."
                renderMobileCard={(row) => <div>{row.order_id}</div>}
            />
        </TabsContent>
      </Tabs>
      
      {selectedOrder && (
        <OrderDetailsDrawer 
            open={orderDetailsDrawerOpen}
            onOpenChange={setOrderDetailsDrawerOpen}
            order={selectedOrder}
        />
      )}

      <CreateOrderDrawer
        open={createOrderDrawerOpen}
        onOpenChange={setCreateOrderDrawerOpen}
        cart={cart}
      />
    </div>
  );
};

export default CartListPage;