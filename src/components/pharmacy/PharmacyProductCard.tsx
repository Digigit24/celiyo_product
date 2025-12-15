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
        "hover:shadow-lg transition-all duration-300 flex flex-col h-full",
        !product.is_active && "opacity-60",
        isOutOfStock && "border-red-200",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-lg leading-tight line-clamp-2 cursor-pointer hover:text-primary"
              onClick={() => onViewDetails?.(product)}
            >
              {product.product_name}
            </h3>
            {product.company && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {product.company}
              </p>
            )}
          </div>

          {!product.is_active && (
            <Badge variant="secondary" className="shrink-0">
              Inactive
            </Badge>
          )}
        </div>

        {product.category && (
          <Badge variant="outline" className="w-fit mt-2">
            {product.category.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3 space-y-3">
        {/* Price Section */}
        <div className="flex items-baseline gap-2">
          <div className="flex items-center text-2xl font-bold text-primary">
            <IndianRupee className="h-5 w-5" />
            <span>{parseFloat(product.selling_price).toFixed(2)}</span>
          </div>
          {parseFloat(product.mrp) > parseFloat(product.selling_price) && (
            <div className="flex items-center text-sm text-muted-foreground line-through">
              <IndianRupee className="h-3 w-3" />
              <span>{parseFloat(product.mrp).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Stock Section */}
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Stock:</span>
          <span className={cn(
            "font-medium",
            isOutOfStock && "text-red-600",
            isLowStock && "text-orange-600",
            !isOutOfStock && !isLowStock && "text-green-600"
          )}>
            {product.quantity}
          </span>
          {isOutOfStock && (
            <Badge variant="destructive" className="ml-auto text-xs">
              Out of Stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="ml-auto text-xs bg-orange-100 text-orange-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          )}
        </div>

        {/* Expiry Section */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Expiry:</span>
          <span className={cn(
            "font-medium",
            isExpired && "text-red-600",
            isNearExpiry && "text-orange-600"
          )}>
            {format(new Date(product.expiry_date), "MMM dd, yyyy")}
          </span>
          {isExpired && (
            <Badge variant="destructive" className="ml-auto text-xs">
              Expired
            </Badge>
          )}
          {isNearExpiry && !isExpired && (
            <Badge variant="secondary" className="ml-auto text-xs bg-yellow-100 text-yellow-700">
              Expiring Soon
            </Badge>
          )}
        </div>

        {/* Batch Number */}
        {product.batch_no && (
          <div className="text-xs text-muted-foreground">
            Batch: <span className="font-mono">{product.batch_no}</span>
          </div>
        )}
      </CardContent>

      {showActions && product.is_active && !isExpired && (
        <CardFooter className="pt-0 flex flex-col gap-2">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isOutOfStock}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={incrementQuantity}
                disabled={quantity >= product.quantity || isOutOfStock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart || !onAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
