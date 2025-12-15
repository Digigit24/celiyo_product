import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, addItemToCart, updateCartItem, removeItemFromCart, clearCart } from "@/hooks/usePharmacy";
import { toast } from "sonner";
import { CreateOrderDrawer } from "./CreateOrderDrawer";

interface FloatingCartProps {
  className?: string;
}

export function FloatingCart({ className }: FloatingCartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  const { data: cart, isLoading, mutate: refreshCart } = useCart();
  const updateItem = updateCartItem(refreshCart);
  const removeItem = removeItemFromCart(refreshCart);
  const clearCartMutation = clearCart(refreshCart);

  const cartItemsCount = cart?.items?.length || 0;
  const cartTotal = cart?.total_cart_price || "0.00";

  const handleUpdateQuantity = async (itemId: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      return;
    }

    try {
      await updateItem.mutateAsync({
        cart_item_id: itemId,
        quantity: newQuantity,
      });
    } catch (error) {
      console.error("Failed to update cart item:", error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem.mutateAsync({
        cart_item_id: itemId,
      });
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear all items from the cart?")) {
      return;
    }

    try {
      await clearCartMutation.mutateAsync();
      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const handleCreateOrder = () => {
    if (cartItemsCount === 0) {
      toast.error("Cart is empty. Add items to create an order.");
      return;
    }
    setIsCreateOrderOpen(true);
  };

  // Collapse cart when it's empty
  useEffect(() => {
    if (cartItemsCount === 0 && isExpanded) {
      setIsExpanded(false);
    }
  }, [cartItemsCount]);

  return (
    <>
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          isExpanded ? "right-4 top-4 bottom-4 w-96" : "right-4 bottom-4 w-80",
          className
        )}
      >
        <Card className="h-full flex flex-col shadow-2xl border-2">
          {/* Header */}
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <Badge variant="default" className="rounded-full">
                    {cartItemsCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isExpanded && cartItemsCount > 0 && (
                  <div className="flex items-center text-sm font-semibold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    <span>{parseFloat(cartTotal).toFixed(2)}</span>
                  </div>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardTitle>
          </CardHeader>

          {/* Expanded Content */}
          {isExpanded && (
            <>
              <Separator />

              {/* Cart Items */}
              <CardContent className="flex-1 p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : cartItemsCount === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Package className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add products to get started
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {cart?.items?.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                {item.product.product_name}
                              </h4>
                              {item.product.company && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                  {item.product.company}
                                </p>
                              )}

                              {/* Price */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center text-sm font-semibold text-primary">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>{parseFloat(item.price).toFixed(2)}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                                <div className="flex items-center text-sm font-bold ml-auto">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>{parseFloat(item.total_price).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                  disabled={item.quantity <= 1 || updateItem.isPending}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-semibold text-sm min-w-[1.5rem] text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                  disabled={
                                    item.quantity >= item.product.quantity || updateItem.isPending
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>

                                {/* Stock info */}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {item.product.quantity} in stock
                                </span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItem.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>

              {/* Footer with Total and Actions */}
              {cartItemsCount > 0 && (
                <>
                  <Separator />
                  <CardFooter className="flex-col gap-3 p-4">
                    {/* Total */}
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-lg">Total:</span>
                      <div className="flex items-center text-2xl font-bold text-primary">
                        <IndianRupee className="h-5 w-5" />
                        <span>{parseFloat(cartTotal).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCart}
                        disabled={clearCartMutation.isPending}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateOrder}
                        className="flex-1"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Order
                      </Button>
                    </div>
                  </CardFooter>
                </>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Create Order Drawer */}
      <CreateOrderDrawer
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
        cartId={cart?.id}
      />
    </>
  );
}
