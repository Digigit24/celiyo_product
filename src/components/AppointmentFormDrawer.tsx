// src/components/AppointmentFormDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Calendar, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

import type { Appointment, AppointmentCreateData, AppointmentUpdateData } from '@/types/appointment.types';
import { useAppointment } from '@/hooks/useAppointment';

import AppointmentBasicInfo from './appointment-drawer/AppointmentBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface AppointmentBasicInfoHandle {
  getFormValues: () => Promise<AppointmentCreateData | AppointmentUpdateData | null>;
}

interface AppointmentFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function AppointmentFormDrawer({
  open,
  onOpenChange,
  appointmentId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: AppointmentFormDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    useAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointment();

  const { data: appointment, isLoading: appointmentLoading, mutate: revalidateAppointment } = useAppointmentById(appointmentId);

  // Form ref to collect values
  const formRef = useRef<AppointmentBasicInfoHandle | null>(null);

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
      revalidateAppointment();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateAppointment]);

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
    if (!appointmentId) return;

    if (
      window.confirm(
        `Are you sure you want to delete appointment ${appointment?.appointment_number}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteAppointment(appointmentId);
        toast.success('Appointment deleted successfully');
        onDelete?.(appointmentId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete appointment');
      }
    }
  }, [appointmentId, appointment, deleteAppointment, onDelete, handleClose]);

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

        console.log('Creating appointment with values:', values);

        await createAppointment(values as AppointmentCreateData);

        toast.success('Appointment created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !appointmentId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating appointment with values:', values);

        await updateAppointment(appointmentId, values as AppointmentUpdateData);

        toast.success('Appointment updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save appointment'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, appointmentId, createAppointment, updateAppointment, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create New Appointment'
      : appointment
      ? `Appointment ${appointment.appointment_number}`
      : 'Appointment Details';

  const drawerDescription =
    currentMode === 'create'
      ? undefined
      : appointment
      ? `${appointment.doctor?.full_name} • ${appointment.patient?.full_name} • ${appointment.appointment_date} ${appointment.appointment_time}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && appointment
      ? [
          {
            icon: Calendar,
            onClick: () => {
              console.log('Reschedule appointment');
              toast.info('Reschedule feature coming soon');
            },
            label: 'Reschedule',
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
            label: 'Edit appointment',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete appointment',
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
            label: 'Create Appointment',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = appointmentLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Appointment Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <AppointmentBasicInfo
            ref={formRef}
            appointment={appointment}
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
      loadingText="Loading appointment data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="appointment-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
