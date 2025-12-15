// src/pages/Pharmacy.tsx
import React, { useState, useMemo } from 'react';
import { usePharmacy } from '@/hooks/usePharmacy';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { ProductFormDrawer } from '@/components/pharmacy/ProductFormDrawer';
import { PharmacyProductCard } from '@/components/pharmacy/PharmacyProductCard';
import { FloatingCart } from '@/components/pharmacy/FloatingCart';
import { DrawerMode } from '@/components/SideDrawer';
import { PharmacyProduct } from '@/types/pharmacy';
import { Button } from '@/components/ui/button';
import { PlusCircle, Grid3x3, List } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { addItemToCart, useCart } from '@/hooks/usePharmacy';
import { toast } from 'sonner';

export const PharmacyPage: React.FC = () => {
  const { usePharmacyProducts, deleteProduct } = usePharmacy();
  const {
    data: pharmacyProductsData,
    isLoading: productsLoading,
    error: productsError,
  } = usePharmacyProducts();

  const { data: cart, mutate: refreshCart } = useCart();
  const addToCartMutation = addItemToCart(refreshCart);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedProduct, setSelectedProduct] = useState<PharmacyProduct | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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

  const columns = useMemo((): DataTableColumn<PharmacyProduct>[] => [
    {
      header: 'Product Name',
      key: 'product_name',
      accessor: (row) => row.product_name,
      sortable: true,
      filterable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.product_name}</div>
          <div className="text-xs text-muted-foreground">{row.company}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      accessor: (row) => row.category?.name || 'N/A',
      sortable: true,
      filterable: true,
      cell: (row) => row.category?.name || <span className="text-muted-foreground italic">No Category</span>,
    },
    {
      header: 'Stock',
      key: 'stock',
      sortable: true,
      accessor: (row) => row.quantity,
      cell: (row) => (
        <div className="text-center">
          <div>{row.quantity}</div>
           {row.low_stock_warning && <Badge variant="destructive" className="mt-1 text-xs">Low Stock</Badge>}
        </div>
      ),
    },
    {
      header: 'Price (₹)',
      key: 'price',
      sortable: true,
      accessor: (row) => Number(row.selling_price),
      cell: (row) => (
        <div>
          <div className="font-medium">₹{row.selling_price}</div>
          <div className="text-xs text-muted-foreground line-through">₹{row.mrp}</div>
        </div>
      ),
    },
    {
      header: 'Expiry Date',
      key: 'expiry_date',
      sortable: true,
      accessor: (row) => row.expiry_date,
      cell: (row) => format(parseISO(row.expiry_date), 'MMM, yyyy'),
    },
    {
        header: 'Status',
        key: 'is_active',
        accessor: (row) => row.is_active,
        cell: (row) => (
            <Badge variant={row.is_active ? 'default' : 'secondary'}>
                {row.is_active ? 'Active' : 'Inactive'}
            </Badge>
        ),
    }
  ], []);

  const products = pharmacyProductsData?.results || [];

  return (
    <div className="flex flex-col h-full">
        {/* Debug Status Section */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm font-medium">API Status: </span>
                {productsLoading && <Badge variant="secondary">Loading...</Badge>}
                {productsError && <Badge variant="destructive">Error</Badge>}
                {!productsLoading && !productsError && <Badge variant="default" className="bg-green-600">Success</Badge>}
              </div>
              <div className="text-sm">
                <span className="font-medium">Products Fetched: </span>
                <span className="font-bold">{pharmacyProductsData?.count || 0}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Displaying: </span>
                <span className="font-bold">{products.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grid
              </Button>
            </div>
          </div>
          {productsError && (
            <div className="text-sm text-destructive mt-2">
              Error: {productsError?.message || 'Failed to fetch products'}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {viewMode === 'table' ? (
             <DataTable
                rows={products}
                columns={columns}
                isLoading={productsLoading}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.product_name}
                emptyTitle="No Products Found"
                emptySubtitle="Click 'Create Product' to add your first item."
                renderMobileCard={(row, actions) => (
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold">{row.product_name}</div>
                                <div className="text-sm text-muted-foreground">{row.category?.name || 'No Category'}</div>
                            </div>
                            {actions.dropdown}
                        </div>
                        <div className="mt-4 flex justify-between text-sm">
                            <div>
                                <div className="text-muted-foreground">Price</div>
                                <div>₹{row.selling_price}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-muted-foreground">Stock</div>
                                <div>{row.quantity}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-muted-foreground">Expiry</div>
                                <div>{format(parseISO(row.expiry_date), 'MMM yyyy')}</div>
                            </div>
                        </div>
                    </div>
                )}
            />
          ) : (
            <div className="p-4">
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <PlusCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click 'Create Product' to add your first item.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
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
          )}
        </div>

      <ProductFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        product={selectedProduct}
      />

      <FloatingCart />
    </div>
  );
};

export default PharmacyPage;
