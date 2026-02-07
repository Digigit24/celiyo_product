// src/components/opd-settings/TemplateDesigner.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { SideDrawer } from '@/components/SideDrawer';
import { TemplateFieldEditor } from './TemplateFieldEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GripVertical, Plus, Edit, Trash2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateField, CreateTemplateFieldPayload } from '@/types/opdTemplate.types';

interface TemplateDesignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number | null;
  onClose: () => void;
}

// Sortable Field Row Component
function SortableFieldRow({
  field,
  onEdit,
  onDelete,
}: {
  field: TemplateField;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldTypeBadge = (fieldType: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800 border-blue-200',
      textarea: 'bg-blue-100 text-blue-800 border-blue-200',
      number: 'bg-green-100 text-green-800 border-green-200',
      decimal: 'bg-green-100 text-green-800 border-green-200',
      boolean: 'bg-purple-100 text-purple-800 border-purple-200',
      date: 'bg-pink-100 text-pink-800 border-pink-200',
      datetime: 'bg-pink-100 text-pink-800 border-pink-200',
      time: 'bg-pink-100 text-pink-800 border-pink-200',
      select: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      multiselect: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      radio: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      checkbox: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      image: 'bg-orange-100 text-orange-800 border-orange-200',
      file: 'bg-orange-100 text-orange-800 border-orange-200',
      json: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    return (
      <Badge
        variant="outline"
        className={colors[fieldType] || 'bg-gray-100 text-gray-800 border-gray-200'}
      >
        {fieldType}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{field.field_name}</span>
          {field.is_required && (
            <Badge variant="destructive" className="h-5">
              Required
            </Badge>
          )}
          {!field.is_active && (
            <Badge variant="secondary" className="h-5">
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{field.field_key}</span>
          <span>·</span>
          {getFieldTypeBadge(field.field_type)}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function TemplateDesigner({
  open,
  onOpenChange,
  templateId,
  onClose,
}: TemplateDesignerProps) {
  const {
    useTemplate,
    useTemplateFields,
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
  } = useOPDTemplate();

  // Field Editor state
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [fieldEditorMode, setFieldEditorMode] = useState<'create' | 'edit'>('create');

  // Local state for fields (for drag-and-drop)
  const [localFields, setLocalFields] = useState<TemplateField[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Fetch template data
  const { data: templateData } = useTemplate(templateId);

  // Fetch template fields
  const {
    data: fieldsData,
    error,
    isLoading,
    mutate,
  } = useTemplateFields({
    template: templateId || undefined,
    is_active: undefined, // Show all fields including inactive
    ordering: 'display_order',
  });

  // Update local fields when data changes
  React.useEffect(() => {
    if (fieldsData?.results) {
      setLocalFields(fieldsData.results);
      setHasUnsavedOrder(false);
    }
  }, [fieldsData]);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localFields.findIndex((f) => f.id === active.id);
        const newIndex = localFields.findIndex((f) => f.id === over.id);

        const reordered = arrayMove(localFields, oldIndex, newIndex);
        setLocalFields(reordered);
        setHasUnsavedOrder(true);
      }
    },
    [localFields]
  );

  // Save field order
  const handleSaveOrder = useCallback(async () => {
    setIsSavingOrder(true);

    try {
      // Update display_order for all fields
      const updatePromises = localFields.map((field, index) =>
        updateTemplateField(field.id, { display_order: index })
      );

      await Promise.all(updatePromises);

      toast.success('Field order saved successfully');
      setHasUnsavedOrder(false);
      mutate(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to save field order');
    } finally {
      setIsSavingOrder(false);
    }
  }, [localFields, updateTemplateField, mutate]);

  // Reset field order
  const handleResetOrder = useCallback(() => {
    if (fieldsData?.results) {
      setLocalFields(fieldsData.results);
      setHasUnsavedOrder(false);
    }
  }, [fieldsData]);

  // Handle create field
  const handleCreateField = useCallback(() => {
    setSelectedFieldId(null);
    setFieldEditorMode('create');
    setFieldEditorOpen(true);
  }, []);

  // Handle edit field
  const handleEditField = useCallback((fieldId: number) => {
    setSelectedFieldId(fieldId);
    setFieldEditorMode('edit');
    setFieldEditorOpen(true);
  }, []);

  // Handle delete field
  const handleDeleteField = useCallback(
    async (fieldId: number) => {
      const field = localFields.find((f) => f.id === fieldId);
      if (!field) return;

      if (!confirm(`Are you sure you want to delete the field "${field.field_name}"?`)) {
        return;
      }

      try {
        await deleteTemplateField(fieldId);
        toast.success(`Field "${field.field_name}" deleted successfully`);
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete field');
      }
    },
    [localFields, deleteTemplateField, mutate]
  );

  // Handle field editor success
  const handleFieldEditorSuccess = useCallback(() => {
    mutate(); // Refresh the list
    setFieldEditorOpen(false);
    setSelectedFieldId(null);
  }, [mutate]);

  const handleFieldEditorClose = useCallback(() => {
    setFieldEditorOpen(false);
    setSelectedFieldId(null);
  }, []);

  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={templateData ? `Design Template - ${templateData.name}` : 'Template Designer'}
        mode="view"
      >
        <div className="space-y-6">
          {/* Template Info */}
          {templateData && (
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{templateData.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Code</span>
                  <span className="text-sm font-mono">{templateData.code}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={templateData.is_active ? 'default' : 'secondary'}>
                    {templateData.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fields Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Template Fields</CardTitle>
                  <CardDescription>
                    Drag and drop to reorder fields. Click edit to modify field details.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => mutate()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={handleCreateField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {localFields.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium">No fields yet</p>
                  <p className="text-sm mt-1">Add your first field to start designing the template</p>
                  <Button className="mt-4" onClick={handleCreateField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {hasUnsavedOrder && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        You have unsaved changes to field order
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetOrder}
                          disabled={isSavingOrder}
                        >
                          Reset
                        </Button>
                        <Button size="sm" onClick={handleSaveOrder} disabled={isSavingOrder}>
                          <Save className="h-4 w-4 mr-2" />
                          {isSavingOrder ? 'Saving...' : 'Save Order'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={localFields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {localFields.map((field) => (
                          <SortableFieldRow
                            key={field.id}
                            field={field}
                            onEdit={() => handleEditField(field.id)}
                            onDelete={() => handleDeleteField(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SideDrawer>

      {/* Field Editor Drawer */}
      <TemplateFieldEditor
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        templateId={templateId}
        fieldId={selectedFieldId}
        mode={fieldEditorMode}
        onSuccess={handleFieldEditorSuccess}
        onClose={handleFieldEditorClose}
      />
    </>
  );
}
