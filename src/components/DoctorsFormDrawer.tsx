// src/components/DoctorsFormDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import type { Doctor, DoctorCreateData, DoctorUpdateData } from '@/types/doctor.types';
import { useDoctor } from '@/hooks/useDoctor';

import DoctorBasicInfo from './doctor-drawer/DoctorBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface DoctorBasicInfoHandle {
  getFormValues: () => Promise<DoctorCreateData | DoctorUpdateData | null>;
}

interface DoctorsFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function DoctorsFormDrawer({
  open,
  onOpenChange,
  doctorId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: DoctorsFormDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    useDoctor: useDoctorById,
    useSpecialties,
    createDoctor,
    updateDoctor,
    deleteDoctor,
  } = useDoctor();

  const { data: doctor, isLoading: doctorLoading, mutate: revalidateDoctor } = useDoctorById(doctorId);
  const { data: specialtiesData, isLoading: specialtiesLoading } = useSpecialties({ is_active: true });

  // Form ref to collect values
  const formRef = useRef<DoctorBasicInfoHandle | null>(null);

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
      revalidateDoctor();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateDoctor]);

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
    if (!doctorId) return;

    if (
      window.confirm(
        `Are you sure you want to delete Dr. ${doctor?.full_name}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteDoctor(doctorId);
        toast.success('Doctor deleted successfully');
        onDelete?.(doctorId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete doctor');
      }
    }
  }, [doctorId, doctor, deleteDoctor, onDelete, handleClose]);

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

        console.log('Creating doctor with values:', values);

        await createDoctor(values as DoctorCreateData);

        toast.success('Doctor created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !doctorId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating doctor with values:', values);

        await updateDoctor(doctorId, values as DoctorUpdateData);

        toast.success('Doctor updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save doctor'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, doctorId, createDoctor, updateDoctor, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create New Doctor'
      : doctor
      ? `Dr. ${doctor.full_name}`
      : 'Doctor Details';

  const drawerDescription =
    currentMode === 'create'
      ? undefined
      : doctor
      ? `${doctor.specialties.map(s => s.name).join(', ')} • ${doctor.years_of_experience} years exp`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && doctor
      ? [
          {
            icon: Phone,
            onClick: () => {
              console.log('Call doctor');
              toast.info('Phone feature coming soon');
            },
            label: 'Call doctor',
            variant: 'ghost',
          },
          {
            icon: Mail,
            onClick: () => window.open(`mailto:${doctor.user.email}`, '_self'),
            label: 'Email doctor',
            variant: 'ghost',
          },
          {
            icon: Calendar,
            onClick: () => {
              console.log('View schedule');
              toast.info('Schedule feature coming soon');
            },
            label: 'View schedule',
            variant: 'ghost',
          },
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit doctor',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete doctor',
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
            label: 'Create Doctor',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = doctorLoading || specialtiesLoading;
  const specialties = specialtiesData?.results || [];

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Doctor Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <DoctorBasicInfo
            ref={formRef}
            doctor={doctor}
            specialties={specialties}
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
      loadingText="Loading doctor data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="doctor-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
