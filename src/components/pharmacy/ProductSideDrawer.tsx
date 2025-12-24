// src/components/pharmacy/ProductSideDrawer.tsx

import React, { useState, useEffect } from 'react';
import { SideDrawer, DrawerMode } from '@/components/SideDrawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, AlertTriangle, Package } from 'lucide-react';
import {
  PharmacyProduct,
  PharmacyProductPayload,
  ProductCategory,
} from '@/types/pharmacy.types';
import { pharmacyProductService, productCategoryService } from '@/services/pharmacy.service';
import { toast } from 'sonner';

interface ProductSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  product?: PharmacyProduct | null;
  onSuccess?: () => void;
}

export function ProductSideDrawer({
  open,
  onOpenChange,
  mode,
  product,
  onSuccess,
}: ProductSideDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [formData, setFormData] = useState<PharmacyProductPayload>({
    product_name: '',
    category_id: undefined,
    company: '',
    batch_no: '',
    mrp: 0,
    selling_price: 0,
    quantity: 0,
    minimum_stock_level: 10,
    expiry_date: '',
    is_active: true,
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productCategoryService.list({ is_active: true });
        setCategories(response.results || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('Failed to load categories');
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Load product data when in edit/view mode
  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      setFormData({
        product_name: product.product_name,
        category_id: product.category?.id || undefined,
        company: product.company || '',
        batch_no: product.batch_no || '',
        mrp: Number(product.mrp),
        selling_price: Number(product.selling_price) || Number(product.mrp),
        quantity: product.quantity,
        minimum_stock_level: product.minimum_stock_level,
        expiry_date: product.expiry_date || '',
        is_active: product.is_active,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        product_name: '',
        category_id: undefined,
        company: '',
        batch_no: '',
        mrp: 0,
        selling_price: 0,
        quantity: 0,
        minimum_stock_level: 10,
        expiry_date: '',
        is_active: true,
      });
    }
  }, [product, mode, open]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.mrp || Number(formData.mrp) <= 0) {
      toast.error('MRP must be greater than 0');
      return;
    }

    if (formData.selling_price && Number(formData.selling_price) > Number(formData.mrp)) {
      toast.error('Selling price cannot be greater than MRP');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        mrp: Number(formData.mrp),
        selling_price: formData.selling_price ? Number(formData.selling_price) : Number(formData.mrp),
        quantity: Number(formData.quantity),
        minimum_stock_level: Number(formData.minimum_stock_level),
      };

      if (mode === 'create') {
        await pharmacyProductService.create(payload);
        toast.success('Product created successfully');
      } else if (mode === 'edit' && product) {
        await pharmacyProductService.update(product.id, payload);
        toast.success('Product updated successfully');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error?.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Add New Product';
      case 'edit':
        return 'Edit Product';
      case 'view':
        return 'Product Details';
      default:
        return 'Product';
    }
  };

  const footerButtons = mode === 'view' ? [] : [
    {
      label: 'Cancel',
      onClick: handleClose,
      variant: 'outline' as const,
      disabled: isSaving,
    },
    {
      label: mode === 'create' ? 'Create Product' : 'Save Changes',
      onClick: handleSubmit,
      variant: 'default' as const,
      loading: isSaving,
      icon: Save,
    },
  ];

  const isLowStock = product && product.quantity <= product.minimum_stock_level;
  const isExpired = product && product.expiry_date && new Date(product.expiry_date) < new Date();

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={getTitle()}
      mode={mode}
      size="lg"
      isLoading={isLoading}
      footerButtons={footerButtons}
      showBackButton={true}
    >
      <div className="space-y-6">
        {/* View Mode: Status Badges */}
        {mode === 'view' && product && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={product.is_active ? 'default' : 'secondary'}>
              {product.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={product.is_in_stock ? 'default' : 'destructive'}>
              {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
            </Badge>
            {isLowStock && (
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
        )}

        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="product-name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product-name"
            placeholder="Enter product name"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            disabled={mode === 'view'}
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id?.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, category_id: value === 'none' ? undefined : Number(value) })
            }
            disabled={mode === 'view'}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company & Batch Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Manufacturer name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={mode === 'view'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch-no">Batch Number</Label>
            <Input
              id="batch-no"
              placeholder="Batch number"
              value={formData.batch_no}
              onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
              disabled={mode === 'view'}
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pricing Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mrp">
                MRP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.mrp}
                onChange={(e) => {
                  const mrp = Number(e.target.value);
                  setFormData({
                    ...formData,
                    mrp,
                    // Auto-set selling price to MRP if not set
                    selling_price: formData.selling_price || mrp
                  });
                }}
                disabled={mode === 'view'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling-price">Selling Price</Label>
              <Input
                id="selling-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                disabled={mode === 'view'}
              />
              {formData.selling_price && Number(formData.selling_price) < Number(formData.mrp) && (
                <p className="text-xs text-muted-foreground">
                  Discount: ₹{(Number(formData.mrp) - Number(formData.selling_price)).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory Management
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                disabled={mode === 'view'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-stock">Minimum Stock Level</Label>
              <Input
                id="min-stock"
                type="number"
                min="0"
                placeholder="10"
                value={formData.minimum_stock_level}
                onChange={(e) =>
                  setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })
                }
                disabled={mode === 'view'}
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls below this level
              </p>
            </div>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="expiry-date">Expiry Date</Label>
          <Input
            id="expiry-date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            disabled={mode === 'view'}
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="product-active" className="text-base">
              Active Status
            </Label>
            <p className="text-sm text-muted-foreground">
              {formData.is_active
                ? 'Product is active and available for sale'
                : 'Product is inactive and hidden'}
            </p>
          </div>
          <Switch
            id="product-active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
            disabled={mode === 'view'}
          />
        </div>

        {/* View Mode: Show Created/Updated Info */}
        {mode === 'view' && product && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {new Date(product.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">
                {new Date(product.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
