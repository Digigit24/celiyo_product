// src/components/transaction-drawer/TransactionDetailsDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import type { Transaction, TransactionCreateData, TransactionUpdateData } from '@/types/payment.types';
import { usePayment } from '@/hooks/usePayment';

import TransactionBasicInfo from './TransactionBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface TransactionBasicInfoHandle {
  getFormValues: () => Promise<TransactionCreateData | TransactionUpdateData | null>;
}

interface TransactionDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: string) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function TransactionDetailsDrawer({
  open,
  onOpenChange,
  transactionId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: TransactionDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    useTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = usePayment();

  const { data: transaction, isLoading: transactionLoading, mutate: revalidateTransaction } = useTransaction(transactionId);

  // Form ref to collect values
  const formRef = useRef<TransactionBasicInfoHandle | null>(null);

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
      revalidateTransaction();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateTransaction]);

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
    if (!transactionId) return;

    if (
      window.confirm(
        `Are you sure you want to delete transaction "${transaction?.transaction_number}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteTransaction(transactionId);
        toast.success('Transaction deleted successfully');
        onDelete?.(transactionId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete transaction');
      }
    }
  }, [transactionId, transaction, deleteTransaction, onDelete, handleClose]);

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

        console.log('Creating transaction with values:', values);

        await createTransaction(values as TransactionCreateData);

        toast.success('Transaction created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !transactionId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating transaction with values:', values);

        await updateTransaction(transactionId, values as TransactionUpdateData);

        toast.success('Transaction updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save transaction'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, transactionId, createTransaction, updateTransaction, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create Transaction'
      : transaction
      ? transaction.transaction_number
      : 'Transaction Details';

  const drawerDescription =
    currentMode === 'create'
      ? 'Record a new financial transaction'
      : transaction
      ? `${transaction.transaction_type} • ₹${parseFloat(transaction.amount).toLocaleString()}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && transaction
      ? [
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit transaction',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete transaction',
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
            label: 'Create Transaction',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = transactionLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Transaction Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <TransactionBasicInfo
            ref={formRef}
            transaction={transaction}
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
      loadingText="Loading transaction data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="transaction-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
