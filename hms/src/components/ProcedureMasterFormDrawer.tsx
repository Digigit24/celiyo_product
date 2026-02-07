// src/components/ProcedureMasterFormDrawer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { SideDrawer, DrawerHeaderAction } from '@/components/SideDrawer';
import { ProcedureMasterBasicInfo } from '@/components/procedure-master-drawer/ProcedureMasterBasicInfo';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { ProcedureMaster, ProcedureMasterCreateData, ProcedureMasterUpdateData } from '@/types/procedureMaster.types';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProcedureMasterFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  procedureId?: number | null;
  onSuccess?: () => void;
}

export const ProcedureMasterFormDrawer: React.FC<ProcedureMasterFormDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  procedureId,
  onSuccess,
}) => {
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { useProcedureMasterById, createProcedure, updateProcedure, deleteProcedure } = useProcedureMaster();

  const { data: procedure, mutate } = useProcedureMasterById(procedureId || null);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const handleCreate = useCallback(
    async (data: ProcedureMasterCreateData) => {
      setIsSubmitting(true);
      try {
        await createProcedure(data);
        toast.success('Procedure created successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to create procedure');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createProcedure, onSuccess, onClose]
  );

  const handleUpdate = useCallback(
    async (data: ProcedureMasterUpdateData) => {
      if (!procedureId) return;
      setIsSubmitting(true);
      try {
        await updateProcedure(procedureId, data);
        toast.success('Procedure updated successfully');
        mutate();
        onSuccess?.();
        setCurrentMode('view');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update procedure');
      } finally {
        setIsSubmitting(false);
      }
    },
    [procedureId, updateProcedure, mutate, onSuccess]
  );

  const handleDelete = useCallback(async () => {
    if (!procedureId) return;
    if (window.confirm('Are you sure you want to delete this procedure?')) {
      try {
        await deleteProcedure(procedureId);
        toast.success('Procedure deleted successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete procedure');
      }
    }
  }, [procedureId, deleteProcedure, onSuccess, onClose]);

  const handleSwitchToEdit = useCallback(() => {
    setCurrentMode('edit');
  }, []);

  const handleSubmit = (data: ProcedureMasterCreateData | ProcedureMasterUpdateData) => {
    if (currentMode === 'create') {
      handleCreate(data as ProcedureMasterCreateData);
    } else if (currentMode === 'edit') {
      handleUpdate(data as ProcedureMasterUpdateData);
    }
  };

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && procedure
      ? [
          { icon: Pencil, onClick: handleSwitchToEdit, label: 'Edit procedure' },
          { icon: Trash2, onClick: handleDelete, label: 'Delete procedure' },
        ]
      : [];

  const getTitle = () => {
    if (currentMode === 'create') return 'Create Procedure';
    if (currentMode === 'edit') return 'Edit Procedure';
    return 'Procedure Details';
  };

  return (
    <SideDrawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={getTitle()}
      description={procedure ? `${procedure.code} - ${procedure.category.replace('_', ' ').toUpperCase()}` : undefined}
      headerActions={headerActions}
    >
      <ProcedureMasterBasicInfo
        mode={currentMode}
        procedure={procedure}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </SideDrawer>
  );
};
