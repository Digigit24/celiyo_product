import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PharmacyProduct } from "@/types/pharmacy.types";
import { IndianRupee, Package, Calendar, AlertTriangle, ShoppingCart, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface PharmacyProductCardProps {
  product: PharmacyProduct;
  onAddToCart?: (product: PharmacyProduct, quantity: number) => Promise<void>;
  onViewDetails?: (product: PharmacyProduct) => void;
  showActions?: boolean;
  className?: string;
}

export function PharmacyProductCard({
  product,
  onAddToCart,
  onViewDetails,
  showActions = true,
  className,
}: PharmacyProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isExpired = new Date(product.expiry_date) < new Date();
  const isNearExpiry = !isExpired &&
    new Date(product.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const isLowStock = product.quantity <= product.minimum_stock_level && product.quantity > 0;
  const isOutOfStock = product.quantity === 0;

  const handleAddToCart = async () => {
    if (!onAddToCart) return;

    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    if (quantity > product.quantity) {
      toast.error(`Only ${product.quantity} items available in stock`);
      return;
    }

    setIsAddingToCart(true);
    try {
      await onAddToCart(product, quantity);
      setQuantity(1); // Reset quantity after adding
    } finally {
      setIsAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.quantity) {
      setQuantity(prev => prev + 1);
    } else {
      toast.warning(`Maximum available quantity is ${product.quantity}`);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200 flex flex-col h-full",
        !product.is_active && "opacity-60",
        isOutOfStock && "border-red-200",
        className
      )}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary"
              onClick={() => onViewDetails?.(product)}
            >
              {product.product_name}
            </h3>
            {product.company && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {product.company}
              </p>
            )}
          </div>

          {!product.is_active && (
            <Badge variant="secondary" className="shrink-0 text-xs h-5">
              Inactive
            </Badge>
          )}
        </div>

        {product.category && (
          <Badge variant="outline" className="w-fit mt-1.5 text-xs h-5">
            {product.category.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-2 px-3 space-y-2">
        {/* Price Section */}
        <div className="flex items-baseline gap-1.5">
          <div className="flex items-center text-lg font-bold text-primary">
            <IndianRupee className="h-4 w-4" />
            <span>{parseFloat(product.selling_price).toFixed(0)}</span>
          </div>
          {parseFloat(product.mrp) > parseFloat(product.selling_price) && (
            <div className="flex items-center text-xs text-muted-foreground line-through">
              <IndianRupee className="h-2.5 w-2.5" />
              <span>{parseFloat(product.mrp).toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Stock Section */}
        <div className="flex items-center gap-1.5 text-xs">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            "font-medium",
            isOutOfStock && "text-red-600",
            isLowStock && "text-orange-600",
            !isOutOfStock && !isLowStock && "text-green-600"
          )}>
            {product.quantity}
          </span>
          {isOutOfStock && (
            <Badge variant="destructive" className="ml-auto text-xs h-4 px-1.5">
              Out
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="ml-auto text-xs h-4 px-1.5 bg-orange-100 text-orange-700">
              Low
            </Badge>
          )}
        </div>

        {/* Expiry Section */}
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            "font-medium text-xs",
            isExpired && "text-red-600",
            isNearExpiry && "text-orange-600"
          )}>
            {format(new Date(product.expiry_date), "MMM dd, yy")}
          </span>
          {isExpired && (
            <Badge variant="destructive" className="ml-auto text-xs h-4 px-1.5">
              Expired
            </Badge>
          )}
          {isNearExpiry && !isExpired && (
            <Badge variant="secondary" className="ml-auto text-xs h-4 px-1.5 bg-yellow-100 text-yellow-700">
              Soon
            </Badge>
          )}
        </div>
      </CardContent>

      {showActions && product.is_active && !isExpired && (
        <CardFooter className="pt-0 pb-2 px-3 flex flex-col gap-1.5">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isOutOfStock}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-semibold text-sm min-w-[1.5rem] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={incrementQuantity}
                disabled={quantity >= product.quantity || isOutOfStock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            className="w-full h-8 text-xs"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart || !onAddToCart}
          >
            <ShoppingCart className="h-3 w-3 mr-1.5" />
            {isAddingToCart ? "Adding..." : "Add"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
