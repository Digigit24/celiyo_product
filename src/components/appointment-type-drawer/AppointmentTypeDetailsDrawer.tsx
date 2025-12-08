// src/components/appointment-type-drawer/AppointmentTypeDetailsDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

import type { AppointmentType, AppointmentTypeCreateData, AppointmentTypeUpdateData } from '@/types/appointmentType.types';
import { useAppointmentType } from '@/hooks/useAppointmentType';

import AppointmentTypeBasicInfo from './AppointmentTypeBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface AppointmentTypeBasicInfoHandle {
  getFormValues: () => Promise<AppointmentTypeCreateData | AppointmentTypeUpdateData | null>;
}

interface AppointmentTypeDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentTypeId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function AppointmentTypeDetailsDrawer({
  open,
  onOpenChange,
  appointmentTypeId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: AppointmentTypeDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    useAppointmentTypeById,
    createAppointmentType,
    updateAppointmentType,
    deleteAppointmentType,
  } = useAppointmentType();

  const { data: appointmentType, isLoading: appointmentTypeLoading, mutate: revalidateAppointmentType } = useAppointmentTypeById(appointmentTypeId);

  // Form ref to collect values
  const formRef = useRef<AppointmentTypeBasicInfoHandle | null>(null);

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
      revalidateAppointmentType();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateAppointmentType]);

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
    if (!appointmentTypeId) return;

    if (
      window.confirm(
        `Are you sure you want to delete "${appointmentType?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteAppointmentType(appointmentTypeId);
        toast.success('Appointment type deleted successfully');
        onDelete?.(appointmentTypeId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete appointment type');
      }
    }
  }, [appointmentTypeId, appointmentType, deleteAppointmentType, onDelete, handleClose]);

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

        console.log('Creating appointment type with values:', values);

        await createAppointmentType(values as AppointmentTypeCreateData);

        toast.success('Appointment type created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !appointmentTypeId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating appointment type with values:', values);

        await updateAppointmentType(appointmentTypeId, values as AppointmentTypeUpdateData);

        toast.success('Appointment type updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save appointment type'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, appointmentTypeId, createAppointmentType, updateAppointmentType, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create Appointment Type'
      : appointmentType
      ? appointmentType.name
      : 'Appointment Type Details';

  const drawerDescription =
    currentMode === 'create'
      ? 'Define a new appointment type for your practice'
      : appointmentType
      ? `${appointmentType.code} • ${appointmentType.is_active ? 'Active' : 'Inactive'}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && appointmentType
      ? [
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit appointment type',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete appointment type',
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
            label: 'Create Type',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = appointmentTypeLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Type Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <AppointmentTypeBasicInfo
            ref={formRef}
            appointmentType={appointmentType}
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
      loadingText="Loading appointment type data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="appointment-type-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
