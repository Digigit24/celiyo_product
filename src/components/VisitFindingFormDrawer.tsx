// src/components/VisitFindingFormDrawer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { SideDrawer, DrawerHeaderAction } from '@/components/SideDrawer';
import { VisitFindingBasicInfo } from '@/components/visit-finding-drawer/VisitFindingBasicInfo';
import { useVisitFinding } from '@/hooks/useVisitFinding';
import { VisitFinding, VisitFindingCreateData, VisitFindingUpdateData } from '@/types/visitFinding.types';
import { Pencil, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface VisitFindingFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  findingId?: number | null;
  onSuccess?: () => void;
}

export const VisitFindingFormDrawer: React.FC<VisitFindingFormDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  findingId,
  onSuccess,
}) => {
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { useVisitFindingById, createFinding, updateFinding, deleteFinding } = useVisitFinding();

  const { data: finding, mutate } = useVisitFindingById(findingId || null);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const handleCreate = useCallback(
    async (data: VisitFindingCreateData) => {
      setIsSubmitting(true);
      try {
        await createFinding(data);
        toast.success('Visit finding created successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to create visit finding');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createFinding, onSuccess, onClose]
  );

  const handleUpdate = useCallback(
    async (data: VisitFindingUpdateData) => {
      if (!findingId) return;
      setIsSubmitting(true);
      try {
        await updateFinding(findingId, data);
        toast.success('Visit finding updated successfully');
        mutate();
        onSuccess?.();
        setCurrentMode('view');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update visit finding');
      } finally {
        setIsSubmitting(false);
      }
    },
    [findingId, updateFinding, mutate, onSuccess]
  );

  const handleDelete = useCallback(async () => {
    if (!findingId) return;
    if (window.confirm('Are you sure you want to delete this visit finding?')) {
      try {
        await deleteFinding(findingId);
        toast.success('Visit finding deleted successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete visit finding');
      }
    }
  }, [findingId, deleteFinding, onSuccess, onClose]);

  const handlePrint = useCallback(() => {
    toast.info('Print functionality coming soon');
  }, []);

  const handleSwitchToEdit = useCallback(() => {
    setCurrentMode('edit');
  }, []);

  const handleSubmit = (data: VisitFindingCreateData | VisitFindingUpdateData) => {
    if (currentMode === 'create') {
      handleCreate(data as VisitFindingCreateData);
    } else if (currentMode === 'edit') {
      handleUpdate(data as VisitFindingUpdateData);
    }
  };

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && finding
      ? [
          { icon: Printer, onClick: handlePrint, label: 'Print finding' },
          { icon: Pencil, onClick: handleSwitchToEdit, label: 'Edit finding' },
          { icon: Trash2, onClick: handleDelete, label: 'Delete finding' },
        ]
      : [];

  const getTitle = () => {
    if (currentMode === 'create') return 'Create Visit Finding';
    if (currentMode === 'edit') return 'Edit Visit Finding';
    return 'Visit Finding Details';
  };

  return (
    <SideDrawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={getTitle()}
      description={finding ? `Visit: ${finding.visit_number || `#${finding.visit}`} - ${finding.finding_type.toUpperCase()}` : undefined}
      headerActions={headerActions}
    >
      <VisitFindingBasicInfo
        mode={currentMode}
        finding={finding}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </SideDrawer>
  );
};
