// src/components/accounting-period-drawer/AccountingPeriodDetailsDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Calendar, Lock, Unlock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import type { AccountingPeriod, AccountingPeriodCreateData, AccountingPeriodUpdateData } from '@/types/payment.types';
import { usePayment } from '@/hooks/usePayment';

import AccountingPeriodBasicInfo from './AccountingPeriodBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface AccountingPeriodBasicInfoHandle {
  getFormValues: () => Promise<AccountingPeriodCreateData | AccountingPeriodUpdateData | null>;
}

interface AccountingPeriodDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function AccountingPeriodDetailsDrawer({
  open,
  onOpenChange,
  periodId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: AccountingPeriodDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Hooks
  const {
    useAccountingPeriod,
    createAccountingPeriod,
    updateAccountingPeriod,
    deleteAccountingPeriod,
    recalculateAccountingPeriod,
    closeAccountingPeriod,
  } = usePayment();

  const { data: period, isLoading: periodLoading, mutate: revalidatePeriod } = useAccountingPeriod(periodId);

  // Form ref to collect values
  const formRef = useRef<AccountingPeriodBasicInfoHandle | null>(null);

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
      revalidatePeriod();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidatePeriod]);

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
    if (!periodId) return;

    if (
      window.confirm(
        `Are you sure you want to delete period "${period?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteAccountingPeriod(periodId);
        toast.success('Accounting period deleted successfully');
        onDelete?.(periodId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete accounting period');
      }
    }
  }, [periodId, period, deleteAccountingPeriod, onDelete, handleClose]);

  const handleRecalculate = useCallback(async () => {
    if (!periodId) return;

    setIsRecalculating(true);
    try {
      await recalculateAccountingPeriod(periodId);
      toast.success('Period recalculated successfully');
      revalidatePeriod();
      handleSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to recalculate period');
    } finally {
      setIsRecalculating(false);
    }
  }, [periodId, recalculateAccountingPeriod, revalidatePeriod, handleSuccess]);

  const handleClosePeriod = useCallback(async () => {
    if (!periodId) return;

    if (
      window.confirm(
        `Are you sure you want to close period "${period?.name}"? This action cannot be undone.`
      )
    ) {
      setIsClosing(true);
      try {
        await closeAccountingPeriod(periodId);
        toast.success('Period closed successfully');
        revalidatePeriod();
        handleSuccess();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to close period');
      } finally {
        setIsClosing(false);
      }
    }
  }, [periodId, period, closeAccountingPeriod, revalidatePeriod, handleSuccess]);

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

        console.log('Creating accounting period with values:', values);

        await createAccountingPeriod(values as AccountingPeriodCreateData);

        toast.success('Accounting period created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !periodId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating accounting period with values:', values);

        await updateAccountingPeriod(periodId, values as AccountingPeriodUpdateData);

        toast.success('Accounting period updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save accounting period'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, periodId, createAccountingPeriod, updateAccountingPeriod, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create Accounting Period'
      : period
      ? period.name
      : 'Accounting Period Details';

  const drawerDescription =
    currentMode === 'create'
      ? 'Define a new accounting period for financial reporting'
      : period
      ? `${period.period_type} • ${period.is_closed ? 'Closed' : 'Open'}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && period
      ? [
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit accounting period',
            variant: 'ghost',
          },
          {
            icon: RefreshCw,
            onClick: handleRecalculate,
            label: 'Recalculate period',
            variant: 'ghost',
          },
          ...(period.is_closed
            ? []
            : [
                {
                  icon: Lock,
                  onClick: handleClosePeriod,
                  label: 'Close period',
                  variant: 'ghost' as const,
                },
              ]),
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete accounting period',
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
            label: 'Create Period',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = periodLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Period Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <AccountingPeriodBasicInfo
            ref={formRef}
            period={period}
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
      loadingText="Loading accounting period data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="accounting-period-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
