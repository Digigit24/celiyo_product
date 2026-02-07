// src/components/SpecialtiesFormDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Award, Users } from 'lucide-react';
import { toast } from 'sonner';

import type { Specialty, SpecialtyCreateData, SpecialtyUpdateData } from '@/types/specialty.types';
import { useSpecialty } from '@/hooks/useSpecialty';

import SpecialtyBasicInfo from './specialty-drawer/SpecialtyBasicInfo';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface SpecialtyBasicInfoHandle {
  getFormValues: () => Promise<SpecialtyCreateData | SpecialtyUpdateData | null>;
}

interface SpecialtiesFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialtyId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function SpecialtiesFormDrawer({
  open,
  onOpenChange,
  specialtyId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: SpecialtiesFormDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const {
    useSpecialtyById,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
  } = useSpecialty();

  const { data: specialty, isLoading: specialtyLoading, mutate: revalidateSpecialty } = useSpecialtyById(specialtyId);

  // Form ref to collect values
  const formRef = useRef<SpecialtyBasicInfoHandle | null>(null);

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
      revalidateSpecialty();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidateSpecialty]);

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
    if (!specialtyId) return;

    if (
      window.confirm(
        `Are you sure you want to delete "${specialty?.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteSpecialty(specialtyId);
        toast.success('Specialty deleted successfully');
        onDelete?.(specialtyId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete specialty');
      }
    }
  }, [specialtyId, specialty, deleteSpecialty, onDelete, handleClose]);

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

        console.log('Creating specialty with values:', values);

        await createSpecialty(values as SpecialtyCreateData);

        toast.success('Specialty created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !specialtyId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating specialty with values:', values);

        await updateSpecialty(specialtyId, values as SpecialtyUpdateData);

        toast.success('Specialty updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save specialty'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, specialtyId, createSpecialty, updateSpecialty, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Create New Specialty'
      : specialty
      ? specialty.name
      : 'Specialty Details';

  const drawerDescription =
    currentMode === 'create'
      ? undefined
      : specialty
      ? `Code: ${specialty.code}${specialty.department ? ` • ${specialty.department}` : ''}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && specialty
      ? [
          {
            icon: Users,
            onClick: () => {
              console.log('View doctors in specialty');
              toast.info('Doctors view feature coming soon');
            },
            label: 'View doctors',
            variant: 'ghost',
          },
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit specialty',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete specialty',
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
            label: 'Create Specialty',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = specialtyLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="basic">Specialty Information</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <SpecialtyBasicInfo
            ref={formRef}
            specialty={specialty}
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
      loadingText="Loading specialty data..."
      size="lg"
      footerButtons={footerButtons}
      footerAlignment="right"
      showBackButton={true}
      resizable={true}
      storageKey="specialty-drawer-width"
      onClose={handleClose}
    >
      {drawerContent}
    </SideDrawer>
  );
}
