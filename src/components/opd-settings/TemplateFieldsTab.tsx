// src/components/opd-settings/TemplateFieldsTab.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GripVertical, Plus, Settings, Trash2, Save, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateField, CreateTemplateFieldPayload, FieldType } from '@/types/opdTemplate.types';

// Field Type Options for the dropdown
const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Short Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'Date & Time', icon: '🕐' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'multiselect', label: 'Multi Select', icon: '☑️' },
  { value: 'radio', label: 'Radio Buttons', icon: '🔘' },
  { value: 'checkbox', label: 'Checkboxes', icon: '✅' },
];

// Sortable Field Row Component with Inline Editing
function SortableFieldRow({
  field,
  onEdit,
  onDelete,
  onUpdate,
  onOpenConfig,
}: {
  field: TemplateField;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<TemplateField>) => void;
  onOpenConfig: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingPlaceholder, setIsEditingPlaceholder] = useState(false);
  const [labelValue, setLabelValue] = useState(field.field_label);
  const [placeholderValue, setPlaceholderValue] = useState(field.placeholder || '');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const placeholderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabelValue(field.field_label);
    setPlaceholderValue(field.placeholder || '');
  }, [field.field_label, field.placeholder]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  useEffect(() => {
    if (isEditingPlaceholder && placeholderInputRef.current) {
      placeholderInputRef.current.focus();
      placeholderInputRef.current.select();
    }
  }, [isEditingPlaceholder]);

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
      email: 'bg-blue-100 text-blue-800 border-blue-200',
      phone: 'bg-blue-100 text-blue-800 border-blue-200',
      select: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      multiselect: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      radio: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      checkbox: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      image: 'bg-orange-100 text-orange-800 border-orange-200',
      file: 'bg-orange-100 text-orange-800 border-orange-200',
      json: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const icon = FIELD_TYPE_OPTIONS.find(opt => opt.value === fieldType)?.icon || '📝';

    return (
      <Badge
        variant="outline"
        className={`${colors[fieldType] || 'bg-gray-100 text-gray-800 border-gray-200'} font-medium`}
      >
        <span className="mr-1">{icon}</span>
        {fieldType}
      </Badge>
    );
  };

  const handleLabelSave = () => {
    if (labelValue.trim() && labelValue !== field.field_label) {
      onUpdate({ field_label: labelValue.trim() });
    }
    setIsEditingLabel(false);
  };

  const handlePlaceholderSave = () => {
    if (placeholderValue !== field.placeholder) {
      onUpdate({ placeholder: placeholderValue.trim() });
    }
    setIsEditingPlaceholder(false);
  };

  const needsPlaceholder = !['select', 'multiselect', 'radio', 'checkbox', 'boolean'].includes(field.field_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative border-2 rounded-xl bg-gradient-to-br from-background to-muted/20 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Drag Indicator Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/40 via-primary/60 to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top Row: Label, Type, Actions */}
          <div className="flex items-center gap-3">
            {/* Editable Label */}
            <div className="flex-1 min-w-0">
              {isEditingLabel ? (
                <Input
                  ref={labelInputRef}
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onBlur={handleLabelSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLabelSave();
                    if (e.key === 'Escape') {
                      setLabelValue(field.field_label);
                      setIsEditingLabel(false);
                    }
                  }}
                  className="h-8 font-semibold text-base"
                />
              ) : (
                <div
                  className="flex items-center gap-2 cursor-pointer group/label"
                  onClick={() => setIsEditingLabel(true)}
                >
                  <span className="font-semibold text-base group-hover/label:text-primary transition-colors">
                    {field.field_label}
                  </span>
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
              )}
            </div>

            {/* Field Type Badge */}
            <div>{getFieldTypeBadge(field.field_type)}</div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenConfig}
                className="h-8 w-8 p-0"
                title="Advanced Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 hover:text-destructive"
                title="Delete Field"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bottom Row: Placeholder and Field Key */}
          <div className="flex items-center gap-4 text-sm">
            {/* Editable Placeholder */}
            {needsPlaceholder && (
              <div className="flex-1 min-w-0">
                {isEditingPlaceholder ? (
                  <Input
                    ref={placeholderInputRef}
                    value={placeholderValue}
                    onChange={(e) => setPlaceholderValue(e.target.value)}
                    onBlur={handlePlaceholderSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePlaceholderSave();
                      if (e.key === 'Escape') {
                        setPlaceholderValue(field.placeholder || '');
                        setIsEditingPlaceholder(false);
                      }
                    }}
                    className="h-7 text-sm"
                    placeholder="Add placeholder..."
                  />
                ) : (
                  <div
                    className="cursor-pointer group/placeholder"
                    onClick={() => setIsEditingPlaceholder(true)}
                  >
                    <span className="text-muted-foreground group-hover/placeholder:text-foreground transition-colors">
                      {field.placeholder || (
                        <span className="italic opacity-60">Click to add placeholder</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Field Key */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                {field.field_key}
              </span>
            </div>
          </div>
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

  // Add Field Type Popover state
  const [addFieldPopoverOpen, setAddFieldPopoverOpen] = useState(false);

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

  // Handle inline field update
  const handleInlineFieldUpdate = useCallback(
    async (fieldId: number, updates: Partial<TemplateField>) => {
      try {
        await updateTemplateField(fieldId, updates);
        toast.success('Field updated');
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to update field');
      }
    },
    [updateTemplateField, mutate]
  );

  // Handle create field from field type selection
  const handleCreateFieldFromType = useCallback(
    async (fieldType: FieldType) => {
      if (!selectedTemplateId) {
        toast.error('Please select a template first');
        return;
      }

      const typeLabel = FIELD_TYPE_OPTIONS.find(opt => opt.value === fieldType)?.label || fieldType;
      const defaultLabel = `New ${typeLabel}`;
      const fieldKey = `field_${Date.now()}`; // Temporary unique key

      try {
        const payload: CreateTemplateFieldPayload = {
          template: selectedTemplateId,
          field_type: fieldType,
          field_label: defaultLabel,
          field_name: fieldKey,
          field_key: fieldKey,
          placeholder: fieldType === 'text' ? 'Enter text...' :
                       fieldType === 'textarea' ? 'Enter description...' :
                       fieldType === 'number' ? 'Enter number...' :
                       fieldType === 'email' ? 'Enter email address...' :
                       fieldType === 'phone' ? 'Enter phone number...' :
                       fieldType === 'date' ? '' :
                       fieldType === 'datetime' ? '' : '',
          is_required: false,
          display_order: localFields.length,
          is_active: true,
        };

        await createTemplateField(payload);
        toast.success(`${typeLabel} field created! Click to edit.`);
        setAddFieldPopoverOpen(false);
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to create field');
      }
    },
    [selectedTemplateId, localFields.length, createTemplateField, mutate]
  );

  // Handle create field (opens drawer)
  const handleCreateField = useCallback(() => {
    if (!selectedTemplateId) {
      toast.error('Please select a template first');
      return;
    }
    setSelectedFieldId(null);
    setFieldEditorMode('create');
    setFieldEditorOpen(true);
  }, [selectedTemplateId]);

  // Handle open config (opens drawer for advanced settings)
  const handleOpenConfig = useCallback((fieldId: number) => {
    setSelectedFieldId(fieldId);
    setFieldEditorMode('edit');
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
                    <Popover open={addFieldPopoverOpen} onOpenChange={setAddFieldPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2" align="end">
                        <div className="space-y-2">
                          <div className="px-2 py-1.5">
                            <p className="text-sm font-semibold">Choose Field Type</p>
                            <p className="text-xs text-muted-foreground">Select the type of field to add</p>
                          </div>
                          <div className="grid gap-1">
                            {FIELD_TYPE_OPTIONS.map((option) => (
                              <Button
                                key={option.value}
                                variant="ghost"
                                className="w-full justify-start h-auto py-2.5 px-3"
                                onClick={() => handleCreateFieldFromType(option.value)}
                              >
                                <span className="text-xl mr-3">{option.icon}</span>
                                <span className="text-sm font-medium">{option.label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
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
                  <Popover open={addFieldPopoverOpen} onOpenChange={setAddFieldPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Field
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                      <div className="space-y-2">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-semibold">Choose Field Type</p>
                          <p className="text-xs text-muted-foreground">Select the type of field to add</p>
                        </div>
                        <div className="grid gap-1">
                          {FIELD_TYPE_OPTIONS.map((option) => (
                            <Button
                              key={option.value}
                              variant="ghost"
                              className="w-full justify-start h-auto py-2.5 px-3"
                              onClick={() => handleCreateFieldFromType(option.value)}
                            >
                              <span className="text-xl mr-3">{option.icon}</span>
                              <span className="text-sm font-medium">{option.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                      <div className="space-y-3">
                        {localFields.map((field) => (
                          <SortableFieldRow
                            key={field.id}
                            field={field}
                            onEdit={() => handleEditField(field.id)}
                            onDelete={() => handleDeleteField(field.id)}
                            onUpdate={(updates) => handleInlineFieldUpdate(field.id, updates)}
                            onOpenConfig={() => handleOpenConfig(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* Quick Add Button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Field
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                      <div className="space-y-2">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-semibold">Choose Field Type</p>
                          <p className="text-xs text-muted-foreground">Select the type of field to add</p>
                        </div>
                        <div className="grid gap-1">
                          {FIELD_TYPE_OPTIONS.map((option) => (
                            <Button
                              key={option.value}
                              variant="ghost"
                              className="w-full justify-start h-auto py-2.5 px-3"
                              onClick={() => handleCreateFieldFromType(option.value)}
                            >
                              <span className="text-xl mr-3">{option.icon}</span>
                              <span className="text-sm font-medium">{option.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
