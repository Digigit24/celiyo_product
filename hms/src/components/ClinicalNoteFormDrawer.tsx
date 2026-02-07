// src/components/ClinicalNoteFormDrawer.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { SideDrawer, DrawerHeaderAction } from '@/components/SideDrawer';
import { ClinicalNoteBasicInfo } from '@/components/clinical-note-drawer/ClinicalNoteBasicInfo';
import { useClinicalNote } from '@/hooks/useClinicalNote';
import { ClinicalNote, ClinicalNoteCreateData, ClinicalNoteUpdateData } from '@/types/clinicalNote.types';
import { Pencil, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface ClinicalNoteFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  noteId?: number | null;
  onSuccess?: () => void;
}

export const ClinicalNoteFormDrawer: React.FC<ClinicalNoteFormDrawerProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  noteId,
  onSuccess,
}) => {
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { useClinicalNoteById, createNote, updateNote, deleteNote } = useClinicalNote();

  const { data: note, mutate } = useClinicalNoteById(noteId || null);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const handleCreate = useCallback(
    async (data: ClinicalNoteCreateData) => {
      setIsSubmitting(true);
      try {
        await createNote(data);
        toast.success('Clinical note created successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to create clinical note');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createNote, onSuccess, onClose]
  );

  const handleUpdate = useCallback(
    async (data: ClinicalNoteUpdateData) => {
      if (!noteId) return;
      setIsSubmitting(true);
      try {
        await updateNote(noteId, data);
        toast.success('Clinical note updated successfully');
        mutate();
        onSuccess?.();
        setCurrentMode('view');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update clinical note');
      } finally {
        setIsSubmitting(false);
      }
    },
    [noteId, updateNote, mutate, onSuccess]
  );

  const handleDelete = useCallback(async () => {
    if (!noteId) return;
    if (window.confirm('Are you sure you want to delete this clinical note?')) {
      try {
        await deleteNote(noteId);
        toast.success('Clinical note deleted successfully');
        onSuccess?.();
        onClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete clinical note');
      }
    }
  }, [noteId, deleteNote, onSuccess, onClose]);

  const handlePrint = useCallback(() => {
    toast.info('Print functionality coming soon');
  }, []);

  const handleSwitchToEdit = useCallback(() => {
    setCurrentMode('edit');
  }, []);

  const handleSubmit = (data: ClinicalNoteCreateData | ClinicalNoteUpdateData) => {
    if (currentMode === 'create') {
      handleCreate(data as ClinicalNoteCreateData);
    } else if (currentMode === 'edit') {
      handleUpdate(data as ClinicalNoteUpdateData);
    }
  };

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && note
      ? [
          { icon: Printer, onClick: handlePrint, label: 'Print note' },
          { icon: Pencil, onClick: handleSwitchToEdit, label: 'Edit note' },
          { icon: Trash2, onClick: handleDelete, label: 'Delete note' },
        ]
      : [];

  const getTitle = () => {
    if (currentMode === 'create') return 'Create Clinical Note';
    if (currentMode === 'edit') return 'Edit Clinical Note';
    return 'Clinical Note Details';
  };

  return (
    <SideDrawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={getTitle()}
      description={note ? `Visit: ${note.visit_number || `#${note.visit}`}` : undefined}
      headerActions={headerActions}
    >
      <ClinicalNoteBasicInfo
        mode={currentMode}
        note={note}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </SideDrawer>
  );
};
