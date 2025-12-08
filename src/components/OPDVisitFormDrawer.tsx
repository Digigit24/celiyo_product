// src/components/OPDVisitFormDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { OpdVisit, OpdVisitCreateData, OpdVisitUpdateData } from '@/types/opdVisit.types';
import { useOpdVisit } from '@/hooks/useOpdVisit';

import OPDVisitBasicInfo from './opd-visit-drawer/OPDVisitBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface OPDVisitBasicInfoHandle {
  getFormValues: () => Promise<OpdVisitCreateData | OpdVisitUpdateData | null>;
}

interface OPDVisitFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function OPDVisitFormDrawer({
  open,
  onOpenChange,
  visitId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: OPDVisitFormDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    useOpdVisitById,
    createOpdVisit,
    updateOpdVisit,
    deleteOpdVisit,
    completeOpdVisit,
  } = useOpdVisit();

  const { data: visit, isLoading: visitLoading, mutate: revalidateVisit } = useOpdVisitById(visitId);

  // Form ref to collect values
  const formRef = useRef<OPDVisitBasicInfoHandle | null>(null);

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
      revalidateVisit();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateVisit]);

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
    if (!visitId) return;

    if (
      window.confirm(
        `Are you sure you want to delete visit ${visit?.visit_number}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteOpdVisit(visitId);
        toast.success('OPD visit deleted successfully');
        onDelete?.(visitId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete OPD visit');
      }
    }
  }, [visitId, visit, deleteOpdVisit, onDelete, handleClose]);

  const handleComplete = useCallback(async () => {
    if (!visitId) return;

    try {
      await completeOpdVisit(visitId, {
        diagnosis: visit?.diagnosis || '',
        treatment_plan: visit?.treatment_plan || '',
        prescription: visit?.prescription || '',
      });
      toast.success('Visit marked as completed');
      handleSuccess();
      handleSwitchToView();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to complete visit');
    }
  }, [visitId, visit, completeOpdVisit, handleSuccess, handleSwitchToView]);

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

        console.log('Creating OPD visit with values:', values);

        await createOpdVisit(values as OpdVisitCreateData);

        toast.success('OPD visit created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !visitId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating OPD visit with values:', values);

        await updateOpdVisit(visitId, values as OpdVisitUpdateData);

        toast.success('OPD visit updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save OPD visit'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, visitId, createOpdVisit, updateOpdVisit, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create New OPD Visit'
      : visit
      ? `Visit ${visit.visit_number}`
      : 'OPD Visit Details';

  const drawerDescription =
    currentMode === 'create'
      ? undefined
      : visit
      ? `${visit.patient_details?.full_name || 'N/A'} • ${visit.doctor_details?.full_name || 'N/A'} • ${visit.visit_date} ${visit.visit_time}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && visit
      ? [
          {
            icon: CheckCircle,
            onClick: handleComplete,
            label: 'Complete visit',
            variant: 'ghost',
          },
          {
            icon: FileText,
            onClick: () => {
              console.log('Generate report');
              toast.info('Report generation coming soon');
            },
            label: 'Generate report',
            variant: 'ghost',
          },
          {
            icon: DollarSign,
            onClick: () => {
              console.log('Process payment');
              toast.info('Payment feature coming soon');
            },
            label: 'Process payment',
            variant: 'ghost',
          },
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit visit',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete visit',
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
            label: 'Create Visit',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = visitLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Visit Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <OPDVisitBasicInfo
            ref={formRef}
            visit={visit}
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
      loadingText="Loading visit data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="opd-visit-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
