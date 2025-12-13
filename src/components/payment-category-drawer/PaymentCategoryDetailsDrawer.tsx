// src/components/payment-category-drawer/PaymentCategoryDetailsDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

import type { PaymentCategory, PaymentCategoryCreateData, PaymentCategoryUpdateData } from '@/types/payment.types';
import { usePayment } from '@/hooks/usePayment';

import PaymentCategoryBasicInfo from './PaymentCategoryBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface PaymentCategoryBasicInfoHandle {
  getFormValues: () => Promise<PaymentCategoryCreateData | PaymentCategoryUpdateData | null>;
}

interface PaymentCategoryDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function PaymentCategoryDetailsDrawer({
  open,
  onOpenChange,
  categoryId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: PaymentCategoryDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    usePaymentCategory,
    createPaymentCategory,
    updatePaymentCategory,
    deletePaymentCategory,
  } = usePayment();

  const { data: category, isLoading: categoryLoading, mutate: revalidateCategory } = usePaymentCategory(categoryId);

  // Form ref to collect values
  const formRef = useRef<PaymentCategoryBasicInfoHandle | null>(null);

  // Sync internal mode with prop
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Reset tab when opening
  useEffect(() => {
    if (open) {
      setActiveTab('basic');
    }
  }, [open]);

  const handleSuccess = useCallback(() => {
    if (currentMode !== 'create') {
      revalidateCategory();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateCategory]);

  const handleClose = useCallback(() => {
    setActiveTab('basic');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSwitchToEdit = useCallback(() => {
    setCurrentMode('edit');
    onModeChange?.('edit');
  }, [onModeChange]);

  const handleSwitchToView = useCallback(() => {
    setCurrentMode('view');
    onModeChange?.('view');
  }, [onModeChange]);

  const handleDelete = useCallback(async () => {
    if (!categoryId) return;

    if (
      window.confirm(
        `Are you sure you want to delete category "${category?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deletePaymentCategory(categoryId);
        toast.success('Payment category deleted successfully');
        onDelete?.(categoryId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete payment category');
      }
    }
  }, [categoryId, category, deletePaymentCategory, onDelete, handleClose]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (currentMode === 'create') {
        // CREATE FLOW
        const values = await formRef.current?.getFormValues();

        if (!values) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Creating payment category with values:', values);

        await createPaymentCategory(values as PaymentCategoryCreateData);

        toast.success('Payment category created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !categoryId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating payment category with values:', values);

        await updatePaymentCategory(categoryId, values as PaymentCategoryUpdateData);

        toast.success('Payment category updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save payment category'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, categoryId, createPaymentCategory, updatePaymentCategory, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create Payment Category'
      : category
      ? category.name
      : 'Payment Category Details';

  const drawerDescription =
    currentMode === 'create'
      ? 'Define a new category for financial transactions'
      : category
      ? `${category.category_type} category`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && category
      ? [
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit payment category',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete payment category',
            variant: 'ghost',
          },
        ]
      : [];

  const footerButtons: DrawerActionButton[] =
    currentMode === 'view'
      ? [
          {
            label: 'Close',
            onClick: handleClose,
            variant: 'outline',
          },
        ]
      : currentMode === 'edit'
      ? [
          {
            label: 'Cancel',
            onClick: handleSwitchToView,
            variant: 'outline',
            disabled: isSaving,
          },
          {
            label: 'Save Changes',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ]
      : [
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'outline',
            disabled: isSaving,
          },
          {
            label: 'Create Category',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = categoryLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Category Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <PaymentCategoryBasicInfo
            ref={formRef}
            category={category}
            mode={currentMode}
            onSuccess={handleSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={drawerTitle}
      description={drawerDescription}
      mode={currentMode}
      headerActions={headerActions}
      isLoading={isLoading}
      loadingText="Loading payment category data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="payment-category-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
