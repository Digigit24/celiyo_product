
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SideDrawer, DrawerMode } from '@/components/SideDrawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PharmacyProduct, ProductCategory } from '@/types/pharmacy.types';
import { usePharmacy } from '@/hooks/usePharmacy';
import { useToast } from '@/hooks/use-toast';

// Validation Schema
const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  category: z.number().positive('Category is required'),
  company: z.string().optional(),
  batch_no: z.string().optional(),
  mrp: z.preprocess((val) => Number(val), z.number().min(0, 'MRP must be non-negative')),
  selling_price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Selling price must be non-negative')
  ),
  quantity: z.preprocess((val) => Number(val), z.number().min(0, 'Quantity must be non-negative')),
  minimum_stock_level: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Minimum stock level must be non-negative')
  ),
  expiry_date: z.date({ required_error: 'Expiry date is required' }),
  is_active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  product?: PharmacyProduct;
}

export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  open,
  onOpenChange,
  mode,
  product,
}) => {
  const { toast } = useToast();
  const {
    useProductCategories,
    createPharmacyProduct,
    updatePharmacyProduct,
    deletePharmacyProduct,
  } = usePharmacy();
  const { data: categories, isLoading: categoriesLoading } = useProductCategories();

  const isViewMode = mode === 'view';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const isSubmitting = createPharmacyProduct.isLoading || updatePharmacyProduct.isLoading;

  useEffect(() => {
    if (open && product) {
      reset({
        ...product,
        category: product.category?.id,
        expiry_date: new Date(product.expiry_date),
      });
    } else if (open && mode === 'create') {
      reset({
        product_name: '',
        category: undefined,
        company: '',
        batch_no: '',
        mrp: 0,
        selling_price: 0,
        quantity: 0,
        minimum_stock_level: 0,
        expiry_date: undefined,
        is_active: true,
      });
    }
  }, [open, product, mode, reset]);

  const onSubmit = (data: ProductFormData) => {
    const payload = {
      ...data,
      expiry_date: format(data.expiry_date, 'yyyy-MM-dd'),
    };

    if (mode === 'create') {
      createPharmacyProduct.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    } else if (mode === 'edit' && product) {
      updatePharmacyProduct.mutate({ id: product.id, ...payload }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const handleDelete = () => {
    if (!product) return;
    deletePharmacyProduct.mutate(product.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        mode === 'create'
          ? 'Create New Product'
          : mode === 'edit'
          ? 'Edit Product'
          : 'Product Details'
      }
      description={
        mode === 'create'
          ? 'Fill in the form to add a new pharmacy product.'
          : 'View or modify the product details.'
      }
      mode={mode}
      footerButtons={[
        {
          label: 'Cancel',
          variant: 'outline',
          onClick: () => onOpenChange(false),
          disabled: isSubmitting,
        },
        ...(mode !== 'view'
          ? [
              {
                label: mode === 'create' ? 'Create Product' : 'Save Changes',
                onClick: handleSubmit(onSubmit),
                loading: isSubmitting,
              },
            ]
          : []),
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Name */}
        <div>
          <Label htmlFor="product_name">Product Name</Label>
          <Input
            id="product_name"
            {...register('product_name')}
            disabled={isViewMode}
            className="mt-1"
          />
          {errors.product_name && (
            <p className="text-sm text-destructive mt-1">{errors.product_name.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={isViewMode || categoriesLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {(categories?.results || []).map((cat: ProductCategory) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Company */}
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register('company')} disabled={isViewMode} className="mt-1" />
        </div>
        
        {/* Batch No */}
        <div>
          <Label htmlFor="batch_no">Batch No.</Label>
          <Input id="batch_no" {...register('batch_no')} disabled={isViewMode} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* MRP */}
          <div>
            <Label htmlFor="mrp">MRP (₹)</Label>
            <Input
              id="mrp"
              type="number"
              {...register('mrp')}
              disabled={isViewMode}
              className="mt-1"
            />
            {errors.mrp && (
              <p className="text-sm text-destructive mt-1">{errors.mrp.message}</p>
            )}
          </div>

          {/* Selling Price */}
          <div>
            <Label htmlFor="selling_price">Selling Price (₹)</Label>
            <Input
              id="selling_price"
              type="number"
              {...register('selling_price')}
              disabled={isViewMode}
              className="mt-1"
            />
            {errors.selling_price && (
              <p className="text-sm text-destructive mt-1">
                {errors.selling_price.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity')}
              disabled={isViewMode}
              className="mt-1"
            />
            {errors.quantity && (
              <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Minimum Stock Level */}
          <div>
            <Label htmlFor="minimum_stock_level">Min. Stock Level</Label>
            <Input
              id="minimum_stock_level"
              type="number"
              {...register('minimum_stock_level')}
              disabled={isViewMode}
              className="mt-1"
            />
            {errors.minimum_stock_level && (
              <p className="text-sm text-destructive mt-1">
                {errors.minimum_stock_level.message}
              </p>
            )}
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Controller
            name="expiry_date"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal mt-1',
                      !field.value && 'text-muted-foreground'
                    )}
                    disabled={isViewMode}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={isViewMode}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.expiry_date && (
            <p className="text-sm text-destructive mt-1">{errors.expiry_date.message}</p>
          )}
        </div>

        {/* Is Active */}
        <div className="flex items-center space-x-2">
            <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                    <Switch
                        id="is_active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isViewMode}
                    />
                )}
            />
            <Label htmlFor="is_active">Is Active</Label>
        </div>
      </form>
    </SideDrawer>
  );
};
