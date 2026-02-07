// src/components/ProcedurePackageFormDrawer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { SideDrawer, DrawerHeaderAction } from '@/components/SideDrawer';
import { ProcedurePackageBasicInfo } from '@/components/procedure-package-drawer/ProcedurePackageBasicInfo';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import { ProcedurePackage, ProcedurePackageCreateData, ProcedurePackageUpdateData } from '@/types/procedurePackage.types';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProcedurePackageFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  packageId?: number | null;
  onSuccess?: () => void;
}

export const ProcedurePackageFormDrawer: React.FC<ProcedurePackageFormDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  packageId,
  onSuccess,
}) => {
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { useProcedurePackageById, createPackage, updatePackage, deletePackage } = useProcedurePackage();

  const { data: pkg, mutate } = useProcedurePackageById(packageId || null);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const handleCreate = useCallback(
    async (data: ProcedurePackageCreateData) => {
      setIsSubmitting(true);
      try {
        await createPackage(data);
        toast.success('Package created successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to create package');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createPackage, onSuccess, onClose]
  );

  const handleUpdate = useCallback(
    async (data: ProcedurePackageUpdateData) => {
      if (!packageId) return;
      setIsSubmitting(true);
      try {
        await updatePackage(packageId, data);
        toast.success('Package updated successfully');
        mutate();
        onSuccess?.();
        setCurrentMode('view');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update package');
      } finally {
        setIsSubmitting(false);
      }
    },
    [packageId, updatePackage, mutate, onSuccess]
  );

  const handleDelete = useCallback(async () => {
    if (!packageId) return;
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(packageId);
        toast.success('Package deleted successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete package');
      }
    }
  }, [packageId, deletePackage, onSuccess, onClose]);

  const handleSwitchToEdit = useCallback(() => {
    setCurrentMode('edit');
  }, []);

  const handleSubmit = (data: ProcedurePackageCreateData | ProcedurePackageUpdateData) => {
    if (currentMode === 'create') {
      handleCreate(data as ProcedurePackageCreateData);
    } else if (currentMode === 'edit') {
      handleUpdate(data as ProcedurePackageUpdateData);
    }
  };

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && pkg
      ? [
          { icon: Pencil, onClick: handleSwitchToEdit, label: 'Edit package' },
          { icon: Trash2, onClick: handleDelete, label: 'Delete package' },
        ]
      : [];

  const getTitle = () => {
    if (currentMode === 'create') return 'Create Package';
    if (currentMode === 'edit') return 'Edit Package';
    return 'Package Details';
  };

  return (
    <SideDrawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={getTitle()}
      description={pkg ? `${pkg.code} - ${pkg.procedures.length} procedures` : undefined}
      headerActions={headerActions}
    >
      <ProcedurePackageBasicInfo
        mode={currentMode}
        package={pkg}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </SideDrawer>
  );
};
