// src/pages/Pharmacy.tsx
import React, { useState, useMemo } from 'react';
import { usePharmacy } from '@/hooks/usePharmacy';
import { ProductFormDrawer } from '@/components/pharmacy/ProductFormDrawer';
import { PharmacyProductCard } from '@/components/pharmacy/PharmacyProductCard';
import { CartDrawer } from '@/components/pharmacy/CartDrawer';
import { DrawerMode } from '@/components/SideDrawer';
import { PharmacyProduct } from '@/types/pharmacy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, ShoppingCart, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addItemToCart, useCart } from '@/hooks/usePharmacy';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PharmacyPage: React.FC = () => {
  const { usePharmacyProducts, deleteProduct, useProductCategories } = usePharmacy();
  const {
    data: pharmacyProductsData,
    isLoading: productsLoading,
    error: productsError,
  } = usePharmacyProducts();

  const { data: categoriesData } = useProductCategories();
  const { data: cart, mutate: refreshCart } = useCart();
  const addToCartMutation = addItemToCart(refreshCart);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedProduct, setSelectedProduct] = useState<PharmacyProduct | undefined>(undefined);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleCreate = () => {
    setDrawerMode('create');
    setSelectedProduct(undefined);
    setDrawerOpen(true);
  };

  const handleEdit = (product: PharmacyProduct) => {
    setDrawerMode('edit');
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const handleView = (product: PharmacyProduct) => {
    setDrawerMode('view');
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  const handleDelete = async (product: PharmacyProduct) => {
    await deleteProduct.mutateAsync(product.id);
  };

  const handleAddToCart = async (product: PharmacyProduct, quantity: number) => {
    try {
      await addToCartMutation.mutateAsync({
        product_id: product.id,
        quantity,
      });
      toast.success(`${product.product_name} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  // Optimistic filtering
  const filteredProducts = useMemo(() => {
    let filtered = pharmacyProductsData?.results || [];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.product_name.toLowerCase().includes(query) ||
          product.company?.toLowerCase().includes(query) ||
          product.batch_no?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(
        (product) => product.category?.id === parseInt(selectedCategory)
      );
    }

    // Stock filter
    if (stockFilter !== 'all') {
      if (stockFilter === 'in-stock') {
        filtered = filtered.filter((product) => product.quantity > 0);
      } else if (stockFilter === 'out-of-stock') {
        filtered = filtered.filter((product) => product.quantity === 0);
      } else if (stockFilter === 'low-stock') {
        filtered = filtered.filter((product) => product.low_stock_warning);
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((product) => product.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((product) => !product.is_active);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter((product) => new Date(product.expiry_date) < new Date());
      }
    }

    return filtered;
  }, [pharmacyProductsData?.results, searchQuery, selectedCategory, stockFilter, statusFilter]);

  const products = pharmacyProductsData?.results || [];
  const categories = categoriesData?.results || [];
  const cartItemsCount = cart?.items?.length || 0;

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header with Cart Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Products</h2>
          <Badge variant="secondary">{filteredProducts.length} items</Badge>
        </div>
        <Button
          variant="default"
          onClick={() => setCartDrawerOpen(true)}
          className="relative"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {cartItemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {cartItemsCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Section */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Product Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-auto -mx-2">
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <PlusCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all' || statusFilter !== 'all'
                ? 'No products match your filters'
                : 'No Products Found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Click "Create Product" to add your first item.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
            {filteredProducts.map((product) => (
              <PharmacyProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={handleView}
              />
            ))}
          </div>
        )}
      </div>

      <ProductFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        product={selectedProduct}
      />

      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
      />
    </div>
  );
};

export default PharmacyPage;
