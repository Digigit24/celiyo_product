// src/pages/Pharmacy.tsx
import React, { useState, useMemo } from 'react';
import { usePharmacy } from '@/hooks/usePharmacy';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { ProductFormDrawer } from '@/components/pharmacy/ProductFormDrawer';
import { DrawerMode } from '@/components/SideDrawer';
import { PharmacyProduct } from '@/types/pharmacy';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
;

export const PharmacyPage: React.FC = () => {
  const { usePharmacyProducts, deleteProduct } = usePharmacy();
  const {
    data: pharmacyProductsData,
    isLoading: productsLoading,
    error: productsError,
  } = usePharmacyProducts();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedProduct, setSelectedProduct] = useState<PharmacyProduct | undefined>(undefined);

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
      accessor: (row) => row.category.name,
      sortable: true,
      filterable: true,
      cell: (row) => row.category.name,
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
       
        <div className="flex-1 overflow-auto">
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
                                <div className="text-sm text-muted-foreground">{row.category.name}</div>
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
        </div>

      <ProductFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        product={selectedProduct}
      />
    </div>
  );
};

export default PharmacyPage;
