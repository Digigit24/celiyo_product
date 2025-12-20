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
import { GripVertical, Plus, Settings, Trash2, Save, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateField, CreateTemplateFieldPayload, FieldType, TemplateFieldOption } from '@/types/opdTemplate.types';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

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
  { value: 'canvas', label: 'Canvas Drawing', icon: '🎨' },
  { value: 'json', label: 'JSON Data', icon: '📊' },
];

// Draft Field Editor Component
function DraftFieldEditor({
  field,
  onSave,
  onCancel,
  onUpdate,
}: {
  field: TemplateField;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (updates: Partial<TemplateField>) => void;
}) {
  const [newOption, setNewOption] = useState('');
  const needsOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(field.field_type);
  const needsPlaceholder = !['select', 'multiselect', 'radio', 'checkbox', 'boolean', 'canvas', 'json'].includes(field.field_type);
  const typeInfo = FIELD_TYPE_OPTIONS.find(opt => opt.value === field.field_type);

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const options = field.options || [];
    const newOptionObj = {
      id: -Date.now(), // Temporary ID for draft option
      option_label: newOption.trim(),
      option_value: newOption.trim().toLowerCase().replace(/\s+/g, '_'),
      display_order: options.length,
      is_active: true,
    };
    onUpdate({ options: [...options, newOptionObj] });
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    const options = field.options || [];
    onUpdate({ options: options.filter((_, i) => i !== index) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <div className="border-2 border-primary rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeInfo?.icon}</span>
          <div>
            <h3 className="text-lg font-semibold">Configure {typeInfo?.label}</h3>
            <p className="text-sm text-muted-foreground">Fill in the details below and click Save</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Field Label */}
      <div className="space-y-2">
        <Label htmlFor="field-label" className="text-sm font-medium">
          Field Label <span className="text-destructive">*</span>
        </Label>
        <Input
          id="field-label"
          value={field.field_label}
          onChange={(e) => onUpdate({ field_label: e.target.value })}
          placeholder="Enter field label"
          className="font-medium"
        />
      </div>

      {/* Field Key */}
      <div className="space-y-2">
        <Label htmlFor="field-key" className="text-sm font-medium">
          Field Key <span className="text-muted-foreground text-xs">(used in code)</span>
        </Label>
        <Input
          id="field-key"
          value={field.field_key}
          onChange={(e) => onUpdate({ field_key: e.target.value, field_name: e.target.value })}
          placeholder="e.g., patient_name"
          className="font-mono text-sm"
        />
      </div>

      {/* Placeholder */}
      {needsPlaceholder && (
        <div className="space-y-2">
          <Label htmlFor="placeholder" className="text-sm font-medium">
            Placeholder Text
          </Label>
          <Input
            id="placeholder"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>
      )}

      {/* Options Editor for Select Types */}
      {needsOptions && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Options <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-2">
            {/* Existing Options */}
            {field.options && field.options.length > 0 && (
              <div className="space-y-1">
                {field.options.map((option, index) => (
                  <div key={option.id || index} className="flex items-center gap-2 bg-background p-2 rounded border">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{option.option_label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({option.option_value})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="h-7 w-7 p-0 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {/* Add New Option */}
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type option and press Enter"
                className="flex-1"
              />
              <Button onClick={handleAddOption} size="sm" disabled={!newOption.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="space-y-2">
        <Label htmlFor="help-text" className="text-sm font-medium">
          Help Text <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="help-text"
          value={field.help_text || ''}
          onChange={(e) => onUpdate({ help_text: e.target.value })}
          placeholder="Add helpful instructions for this field"
          rows={2}
        />
      </div>

      {/* Default Value */}
      {!needsOptions && field.field_type !== 'canvas' && (
        <div className="space-y-2">
          <Label htmlFor="default-value" className="text-sm font-medium">
            Default Value <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="default-value"
            value={field.default_value || ''}
            onChange={(e) => onUpdate({ default_value: e.target.value })}
            placeholder="Enter default value"
            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
          />
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-required"
            checked={field.is_required}
            onCheckedChange={(checked) => onUpdate({ is_required: !!checked })}
          />
          <Label htmlFor="is-required" className="text-sm font-medium cursor-pointer">
            Required Field
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-active"
            checked={field.is_active}
            onCheckedChange={(checked) => onUpdate({ is_active: !!checked })}
          />
          <Label htmlFor="is-active" className="text-sm font-medium cursor-pointer">
            Active
          </Label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Field
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

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
      canvas: 'bg-violet-100 text-violet-800 border-violet-200',
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

  const needsPlaceholder = !['select', 'multiselect', 'radio', 'checkbox', 'boolean', 'canvas', 'json'].includes(field.field_type);

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

  // Draft field state (for optimistic creation)
  const [draftFieldId, setDraftFieldId] = useState<number | null>(null);
  const [isDraftExpanded, setIsDraftExpanded] = useState(true);

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

  // Handle create field from field type selection (optimistic)
  const handleCreateFieldFromType = useCallback(
    (fieldType: FieldType) => {
      if (!selectedTemplateId) {
        toast.error('Please select a template first');
        return;
      }

      // Remove any existing draft field first
      if (draftFieldId) {
        setLocalFields(prev => prev.filter(f => f.id !== draftFieldId));
      }

      const typeLabel = FIELD_TYPE_OPTIONS.find(opt => opt.value === fieldType)?.label || fieldType;
      const fieldKey = `field_${Date.now()}`; // Temporary unique key
      const draftId = -Date.now(); // Use negative ID for draft fields

      // Create optimistic draft field
      const draftField: TemplateField = {
        id: draftId,
        template: selectedTemplateId,
        field_type: fieldType,
        field_label: 'Untitled',
        field_name: fieldKey,
        field_key: fieldKey,
        placeholder: '',
        is_required: false,
        display_order: localFields.length,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Initialize options for select-type fields
        ...(fieldType === 'select' || fieldType === 'multiselect' || fieldType === 'radio' || fieldType === 'checkbox'
          ? { options: [] }
          : {}),
      };

      // Add draft field to local fields
      setLocalFields(prev => [...prev, draftField]);
      setDraftFieldId(draftId);
      setIsDraftExpanded(true);
      setAddFieldPopoverOpen(false);

      toast.success(`${typeLabel} field added. Configure and save when ready.`);
    },
    [selectedTemplateId, localFields.length, draftFieldId]
  );

  // Handle save draft field
  const handleSaveDraftField = useCallback(
    async (fieldId: number) => {
      const draftField = localFields.find(f => f.id === fieldId);
      if (!draftField || !selectedTemplateId) return;

      // Validate field
      if (!draftField.field_label || draftField.field_label.trim() === '' || draftField.field_label === 'Untitled') {
        toast.error('Please provide a field label');
        return;
      }

      // Validate options for select-type fields
      const needsOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(draftField.field_type);
      if (needsOptions && (!draftField.options || draftField.options.length === 0)) {
        toast.error('Please add at least one option');
        return;
      }

      try {
        const payload: CreateTemplateFieldPayload = {
          template: selectedTemplateId,
          field_type: draftField.field_type,
          field_label: draftField.field_label.trim(),
          field_name: draftField.field_name,
          field_key: draftField.field_key,
          placeholder: draftField.placeholder || '',
          is_required: draftField.is_required,
          display_order: draftField.display_order,
          is_active: draftField.is_active,
          ...(draftField.default_value !== undefined ? { default_value: draftField.default_value } : {}),
          ...(draftField.help_text ? { help_text: draftField.help_text } : {}),
        };

        // Add formatted options for select-type fields
        if (needsOptions && draftField.options) {
          payload.options = draftField.options.map((opt, idx) => ({
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: idx,
            is_active: true,
          }));
        }

        await createTemplateField(payload);
        toast.success('Field saved successfully');
        setDraftFieldId(null);
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error.message || 'Failed to save field');
      }
    },
    [localFields, selectedTemplateId, createTemplateField, mutate]
  );

  // Handle cancel draft field
  const handleCancelDraftField = useCallback(
    (fieldId: number) => {
      setLocalFields(prev => prev.filter(f => f.id !== fieldId));
      setDraftFieldId(null);
    },
    []
  );

  // Handle update draft field
  const handleUpdateDraftField = useCallback(
    (fieldId: number, updates: Partial<TemplateField>) => {
      setLocalFields(prev =>
        prev.map(f => (f.id === fieldId ? { ...f, ...updates } : f))
      );
    },
    []
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
                    {localFields.length > 0 && (
                      <Popover open={addFieldPopoverOpen} onOpenChange={setAddFieldPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Field
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
                          <div className="px-3 py-2 border-b">
                            <p className="text-sm font-semibold">Choose Field Type</p>
                            <p className="text-xs text-muted-foreground">Select the type of field to add</p>
                          </div>
                          <div className="max-h-[400px] overflow-y-auto p-2">
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
                    )}
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
                    <PopoverContent className="w-80 p-0" sideOffset={5}>
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-semibold">Choose Field Type</p>
                        <p className="text-xs text-muted-foreground">Select the type of field to add</p>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2">
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
                        {localFields.map((field) => {
                          // Check if this is a draft field (negative ID)
                          const isDraft = field.id < 0;

                          if (isDraft) {
                            return (
                              <DraftFieldEditor
                                key={field.id}
                                field={field}
                                onSave={() => handleSaveDraftField(field.id)}
                                onCancel={() => handleCancelDraftField(field.id)}
                                onUpdate={(updates) => handleUpdateDraftField(field.id, updates)}
                              />
                            );
                          }

                          return (
                            <SortableFieldRow
                              key={field.id}
                              field={field}
                              onEdit={() => handleEditField(field.id)}
                              onDelete={() => handleDeleteField(field.id)}
                              onUpdate={(updates) => handleInlineFieldUpdate(field.id, updates)}
                              onOpenConfig={() => handleOpenConfig(field.id)}
                            />
                          );
                        })}
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
                    <PopoverContent className="w-80 p-0" sideOffset={5}>
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-semibold">Choose Field Type</p>
                        <p className="text-xs text-muted-foreground">Select the type of field to add</p>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2">
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
