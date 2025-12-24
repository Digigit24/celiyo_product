// src/components/pharmacy/CategorySideDrawer.tsx

import React, { useState, useEffect } from 'react';
import { SideDrawer, DrawerMode } from '@/components/SideDrawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';
import { ProductCategory, ProductCategoryPayload, CategoryType } from '@/types/pharmacy.types';
import { productCategoryService } from '@/services/pharmacy.service';
import { toast } from 'sonner';

interface CategorySideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  category?: ProductCategory | null;
  onSuccess?: () => void;
}

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'healthcare_product', label: 'Healthcare Product' },
  { value: 'medical_equipment', label: 'Medical Equipment' },
];

export function CategorySideDrawer({
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: CategorySideDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ProductCategoryPayload>({
    name: '',
    description: '',
    type: 'medicine',
    is_active: true,
  });

  // Load category data when in edit/view mode
  useEffect(() => {
    if (category && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: category.name,
        description: category.description || '',
        type: category.type,
        is_active: category.is_active,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        type: 'medicine',
        is_active: true,
      });
    }
  }, [category, mode, open]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        await productCategoryService.create(formData);
        toast.success('Category created successfully');
      } else if (mode === 'edit' && category) {
        await productCategoryService.update(category.id, formData);
        toast.success('Category updated successfully');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error?.response?.data?.message || 'Failed to save category');
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
        return 'Create Category';
      case 'edit':
        return 'Edit Category';
      case 'view':
        return 'Category Details';
      default:
        return 'Category';
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
      label: mode === 'create' ? 'Create' : 'Save Changes',
      onClick: handleSubmit,
      variant: 'default' as const,
      loading: isSaving,
      icon: Save,
    },
  ];

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={getTitle()}
      mode={mode}
      size="md"
      isLoading={isLoading}
      footerButtons={footerButtons}
      showBackButton={true}
    >
      <div className="space-y-6">
        {/* Category Name */}
        <div className="space-y-2">
          <Label htmlFor="category-name">
            Category Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category-name"
            placeholder="Enter category name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={mode === 'view'}
            required
          />
        </div>

        {/* Category Type */}
        <div className="space-y-2">
          <Label htmlFor="category-type">
            Category Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value: CategoryType) =>
              setFormData({ ...formData, type: value })
            }
            disabled={mode === 'view'}
          >
            <SelectTrigger id="category-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            placeholder="Enter category description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={mode === 'view'}
            rows={4}
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="category-active" className="text-base">
              Active Status
            </Label>
            <p className="text-sm text-muted-foreground">
              {formData.is_active
                ? 'Category is active and visible'
                : 'Category is inactive and hidden'}
            </p>
          </div>
          <Switch
            id="category-active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
            disabled={mode === 'view'}
          />
        </div>

        {/* View Mode: Show Created/Updated Info */}
        {mode === 'view' && category && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {new Date(category.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">
                {new Date(category.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
