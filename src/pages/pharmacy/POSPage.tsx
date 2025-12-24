// src/pages/pharmacy/POSPage.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  MapPin,
  CreditCard,
  X,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { PharmacyProduct, Cart, CartItem } from '@/types/pharmacy.types';
import { pharmacyProductService, cartService, pharmacyOrderService } from '@/services/pharmacy.service';
import { toast } from 'sonner';

export default function POSPage() {
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PharmacyProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Checkout dialog state
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Load products
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await pharmacyProductService.list({ is_active: true, in_stock: true });
      setProducts(response.results || []);
      setFilteredProducts(response.results || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Helper function to ensure cart data consistency
  const normalizeCart = (cartData: Cart | null): Cart | null => {
    if (!cartData) return null;
    // Ensure cart_items is always an array
    if (!cartData.cart_items) {
      cartData.cart_items = [];
    }
    return cartData;
  };

  // Load cart
  const loadCart = async () => {
    setIsLoadingCart(true);
    try {
      const cartData = await cartService.getCart();
      setCart(normalizeCart(cartData));
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Cart might not exist yet, which is fine
      setCart(null);
    } finally {
      setIsLoadingCart(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  // Search products
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(query) ||
          p.company?.toLowerCase().includes(query) ||
          p.batch_no?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Add to cart
  const handleAddToCart = async (product: PharmacyProduct) => {
    try {
      const updatedCart = await cartService.addItem({
        product_id: product.id,
        quantity: 1,
      });
      setCart(normalizeCart(updatedCart));
      toast.success(`${product.product_name} added to cart`);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      toast.error(error?.response?.data?.error || 'Failed to add to cart');
    }
  };

  // Update cart item quantity
  const handleUpdateQuantity = async (cartItem: CartItem, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItem);
      return;
    }

    try {
      const updatedCart = await cartService.updateItem({
        cart_item_id: cartItem.id,
        quantity: newQuantity,
      });
      setCart(normalizeCart(updatedCart));
    } catch (error: any) {
      console.error('Failed to update quantity:', error);
      toast.error(error?.response?.data?.error || 'Failed to update quantity');
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (cartItem: CartItem) => {
    try {
      const updatedCart = await cartService.removeItem({
        cart_item_id: cartItem.id,
      });
      setCart(normalizeCart(updatedCart));
      toast.success('Item removed from cart');
    } catch (error: any) {
      console.error('Failed to remove item:', error);
      toast.error(error?.response?.data?.error || 'Failed to remove item');
    }
  };

  // Clear cart
  const handleClearCart = async () => {
    try {
      const clearedCart = await cartService.clearCart();
      setCart(normalizeCart(clearedCart));
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  // Open checkout
  const handleOpenCheckout = () => {
    if (!cart || cart.total_items === 0) {
      toast.error('Cart is empty');
      return;
    }
    setCheckoutDialogOpen(true);
  };

  // Create order
  const handleCreateOrder = async () => {
    if (!shippingAddress.trim()) {
      toast.error('Shipping address is required');
      return;
    }

    const finalBillingAddress = sameAsShipping ? shippingAddress : billingAddress;
    if (!finalBillingAddress.trim()) {
      toast.error('Billing address is required');
      return;
    }

    setIsCreatingOrder(true);
    try {
      await pharmacyOrderService.create({
        shipping_address: shippingAddress,
        billing_address: finalBillingAddress,
      });

      toast.success('Order created successfully');
      setCheckoutDialogOpen(false);
      setShippingAddress('');
      setBillingAddress('');
      setSameAsShipping(true);
      loadCart(); // Reload cart (should be empty now)
    } catch (error: any) {
      console.error('Failed to create order:', error);
      toast.error(error?.response?.data?.error || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const cartItemsCount = cart?.total_items || 0;
  const cartTotal = Number(cart?.total_amount || 0);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Pharmacy POS</h1>
              <p className="text-sm text-muted-foreground">Point of Sale System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base px-3 py-1">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
          {/* Products Section - Left 2/3 */}
          <div className="lg:col-span-2 border-r flex flex-col h-full">
            {/* Search Bar */}
            <div className="flex-shrink-0 p-4 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, company, or batch number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-auto p-4">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 mb-4">
                      <svg
                        className="animate-spin h-8 w-8 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">Loading products...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      No products found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Try adjusting your search' : 'No products available'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.quantity <= product.minimum_stock_level;
                    const isExpired =
                      product.expiry_date && new Date(product.expiry_date) < new Date();

                    return (
                      <Card
                        key={product.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleAddToCart(product)}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">
                                {product.product_name}
                              </h3>
                              {product.company && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.company}
                                </p>
                              )}
                            </div>
                            {(isLowStock || isExpired) && (
                              <AlertTriangle
                                className={`h-4 w-4 flex-shrink-0 ml-2 ${
                                  isExpired ? 'text-destructive' : 'text-orange-500'
                                }`}
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            {product.category && (
                              <Badge variant="outline" className="text-xs font-normal">
                                {product.category.name}
                              </Badge>
                            )}
                            <Badge
                              variant={product.quantity === 0 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {product.quantity} in stock
                            </Badge>
                          </div>

                          <div className="mt-auto pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold">
                                  ₹{Number(product.selling_price || product.mrp).toFixed(2)}
                                </p>
                                {product.selling_price &&
                                  Number(product.selling_price) < Number(product.mrp) && (
                                    <p className="text-xs text-muted-foreground line-through">
                                      ₹{Number(product.mrp).toFixed(2)}
                                    </p>
                                  )}
                              </div>
                              <Button size="sm" variant="default">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section - Right 1/3 */}
          <div className="lg:col-span-1 flex flex-col h-full bg-muted/30">
            {/* Cart Header */}
            <div className="flex-shrink-0 p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Current Order</h2>
                {cartItemsCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearCart}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {!cart || !cart.cart_items || cart.cart_items.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-foreground mb-1">Cart is empty</h3>
                    <p className="text-sm text-muted-foreground">
                      Add products to start an order
                    </p>
                  </div>
                </div>
              ) : (
                cart.cart_items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.product.product_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ₹{Number(item.price_at_time).toFixed(2)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleRemoveItem(item)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                          disabled={item.quantity >= item.product.quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold">
                        ₹{Number(item.total_price).toFixed(2)}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart && cart.cart_items && cart.cart_items.length > 0 && (
              <div className="flex-shrink-0 border-t bg-background p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleOpenCheckout}
                  disabled={isLoadingCart}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Complete Order
            </DialogTitle>
            <DialogDescription>
              Enter customer and payment details to complete the order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Order Summary */}
            <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Order Summary
              </h3>
              <div className="space-y-2">
                {cart?.cart_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.product_name} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{Number(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="text-lg text-primary">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <Label htmlFor="shipping-address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="shipping-address"
                placeholder="Enter shipping address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Billing Address */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="same-as-shipping"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="same-as-shipping" className="text-sm font-normal cursor-pointer">
                  Billing address same as shipping
                </Label>
              </div>

              {!sameAsShipping && (
                <div className="space-y-2">
                  <Label htmlFor="billing-address" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Billing Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="billing-address"
                    placeholder="Enter billing address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckoutDialogOpen(false)}
              disabled={isCreatingOrder}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={isCreatingOrder}>
              {isCreatingOrder ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Order...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
