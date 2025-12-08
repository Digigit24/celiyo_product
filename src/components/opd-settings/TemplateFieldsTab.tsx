// src/components/opd-settings/TemplateFieldsTab.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Plus, Edit, Trash2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateField, CreateTemplateFieldPayload } from '@/types/opdTemplate.types';

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
      className="flex items-center gap-3 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{field.field_label}</span>
            {field.is_required && (
              <Badge variant="destructive" className="h-5 text-xs">
                Required
              </Badge>
            )}
            {!field.is_active && (
              <Badge variant="secondary" className="h-5 text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground font-mono">{field.field_key}</div>
        </div>

        <div className="col-span-2 flex items-center">
          {getFieldTypeBadge(field.field_type)}
        </div>

        <div className="col-span-3 flex items-center">
          <span className="text-sm text-muted-foreground truncate">
            {field.placeholder || field.help_text || '-'}
          </span>
        </div>

        <div className="col-span-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">{field.display_order}</span>
        </div>

        <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TemplateFieldsTab() {
  const {
    useTemplates,
    useTemplate,
    useTemplateFields,
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
  } = useOPDTemplate();

  // Selected template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Field Editor state
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [fieldEditorMode, setFieldEditorMode] = useState<'create' | 'edit'>('create');

  // Local state for fields (for drag-and-drop)
  const [localFields, setLocalFields] = useState<TemplateField[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Fetch all templates for dropdown
  const { data: templatesData } = useTemplates({
    is_active: true,
    page: 1,
    page_size: 1000,
    ordering: 'group,display_order',
  });

  // Fetch selected template data
  const { data: templateData } = useTemplate(selectedTemplateId);

  // Fetch template fields
  const {
    data: fieldsData,
    error,
    isLoading,
    mutate,
  } = useTemplateFields({
    template: selectedTemplateId || undefined,
    is_active: undefined, // Show all fields including inactive
    ordering: 'display_order',
  });

  // Update local fields when data changes
  useEffect(() => {
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
    if (!selectedTemplateId) {
      toast.error('Please select a template first');
      return;
    }
    setSelectedFieldId(null);
    setFieldEditorMode('create');
    setFieldEditorOpen(true);
  }, [selectedTemplateId]);

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

      if (!confirm(`Are you sure you want to delete the field "${field.field_label}"?`)) {
        return;
      }

      try {
        // Optimistically update UI before API call
        const updatedFields = localFields.filter((f) => f.id !== fieldId);
        setLocalFields(updatedFields);

        await deleteTemplateField(fieldId);
        toast.success(`Field "${field.field_label}" deleted successfully`);

        // Revalidate to ensure sync with server
        mutate(undefined, { revalidate: true });
      } catch (error: any) {
        // Revert optimistic update on error
        setLocalFields(localFields);
        toast.error(error.message || 'Failed to delete field');
      }
    },
    [localFields, deleteTemplateField, mutate]
  );

  // Handle field editor success
  const handleFieldEditorSuccess = useCallback(() => {
    // Use optimistic updates with revalidation
    mutate(undefined, { revalidate: true });
    setFieldEditorOpen(false);
    setSelectedFieldId(null);
  }, [mutate]);

  const handleFieldEditorClose = useCallback(() => {
    setFieldEditorOpen(false);
    setSelectedFieldId(null);
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Header with Template Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <CardTitle className="mb-2">Design Template Fields</CardTitle>
                <Select
                  value={selectedTemplateId?.toString() || ''}
                  onValueChange={(value) => setSelectedTemplateId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesData?.results?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name} ({template.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {selectedTemplateId && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => mutate()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={handleCreateField}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Template Info & Fields */}
        {selectedTemplateId && templateData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{templateData.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {templateData.description || 'No description'}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">Code: {templateData.code}</Badge>
                    <Badge variant={templateData.is_active ? 'default' : 'secondary'}>
                      {templateData.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {localFields.length === 0 && !isLoading ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium mb-1">No fields yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first field to start designing the template
                  </p>
                  <Button onClick={handleCreateField}>
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

                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Field Name / Key</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Placeholder / Help</div>
                    <div className="col-span-1 text-center">Order</div>
                    <div className="col-span-1 text-center">Actions</div>
                  </div>

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

                  {/* Quick Add Button */}
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={handleCreateField}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Field
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedTemplateId && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-lg font-medium mb-1">No template selected</p>
              <p className="text-sm text-muted-foreground">
                Select a template from the dropdown above to edit its fields
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Field Editor Drawer */}
      <TemplateFieldEditor
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        templateId={selectedTemplateId}
        fieldId={selectedFieldId}
        mode={fieldEditorMode}
        onSuccess={handleFieldEditorSuccess}
        onClose={handleFieldEditorClose}
      />
    </>
  );
}
