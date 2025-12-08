// src/components/opd-settings/TemplateFieldEditor.tsx
import { useState, useEffect, useCallback } from 'react';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { SideDrawer, type DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type {
  TemplateField,
  FieldType,
  CreateTemplateFieldPayload,
  UpdateTemplateFieldPayload,
} from '@/types/opdTemplate.types';

type EditorMode = 'create' | 'edit';

interface TemplateFieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number | null;
  fieldId: number | null;
  mode: EditorMode;
  onSuccess: () => void;
  onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Text (Short)', description: 'Single line text input' },
  { value: 'textarea', label: 'Text Area (Long)', description: 'Multi-line text input' },
  { value: 'number', label: 'Number', description: 'Numeric input with validation' },
  { value: 'email', label: 'Email', description: 'Email address with validation' },
  { value: 'phone', label: 'Phone', description: 'Phone number input' },
  { value: 'url', label: 'URL', description: 'Website URL with validation' },
  { value: 'date', label: 'Date', description: 'Date picker (YYYY-MM-DD)' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'checkbox', label: 'Checkboxes', description: 'Single or multiple choice checkboxes' },
  { value: 'select', label: 'Single Select', description: 'Dropdown with single selection' },
  { value: 'radio', label: 'Radio Buttons', description: 'Single choice from options' },
  { value: 'multiselect', label: 'Multiple Select', description: 'Multiple selection checkboxes' },
];

// Field types that support options
const FIELD_TYPES_WITH_OPTIONS: FieldType[] = ['select', 'radio', 'multiselect', 'checkbox'];

// Field types that support numeric validation
const FIELD_TYPES_NUMERIC: FieldType[] = ['number'];

// Field types that support text length validation
const FIELD_TYPES_TEXT: FieldType[] = ['text', 'textarea', 'email', 'phone', 'url'];

export function TemplateFieldEditor({
  open,
  onOpenChange,
  templateId,
  fieldId,
  mode,
  onSuccess,
  onClose,
}: TemplateFieldEditorProps) {
  const {
    useTemplateField,
    useTemplateFieldOptions,
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
    createTemplateFieldOption,
    updateTemplateFieldOption,
    deleteTemplateFieldOption,
  } = useOPDTemplate();

  // Form state
  const [formData, setFormData] = useState<CreateTemplateFieldPayload>({
    template: templateId || 0,
    field_type: 'text',
    field_label: '',
    field_name: '',
    field_key: '',
    placeholder: '',
    help_text: '',
    is_required: false,
    display_order: 0,
    is_active: true,
  });

  // Options state - now tracking full option objects
  interface OptionItem {
    id?: number; // undefined for new options
    option_label: string;
    option_value: string;
    display_order: number;
    isDeleted?: boolean;
  }

  const [options, setOptions] = useState<OptionItem[]>([]);
  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch field data when editing
  const { data: fieldData } = useTemplateField(fieldId);

  // Update form data when field data changes
  useEffect(() => {
    if (fieldData && mode === 'edit') {
      setFormData({
        template: fieldData.template,
        field_type: fieldData.field_type,
        field_label: fieldData.field_label,
        field_name: fieldData.field_name,
        field_key: fieldData.field_key,
        placeholder: fieldData.placeholder || '',
        help_text: fieldData.help_text || '',
        is_required: fieldData.is_required,
        min_length: fieldData.min_length,
        max_length: fieldData.max_length,
        min_value: fieldData.min_value,
        max_value: fieldData.max_value,
        pattern: fieldData.pattern,
        default_value: fieldData.default_value,
        display_order: fieldData.display_order,
        is_active: fieldData.is_active,
      });

      // Load options if field has them
      if (fieldData.options && Array.isArray(fieldData.options)) {
        setOptions(
          fieldData.options.map((opt) => ({
            id: opt.id,
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: opt.display_order,
          }))
        );
      }
    } else if (mode === 'create') {
      setFormData({
        template: templateId || 0,
        field_type: 'text',
        field_label: '',
        field_name: '',
        field_key: '',
        placeholder: '',
        help_text: '',
        is_required: false,
        display_order: 0,
        is_active: true,
      });
      setOptions([]);
    }
    setErrors({});
  }, [fieldData, mode, templateId]);

  // Handle form field changes
  const handleChange = useCallback(
    (field: keyof CreateTemplateFieldPayload, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));

      // Auto-generate field_name and field_key from field_label in create mode
      if (field === 'field_label' && typeof value === 'string' && mode === 'create') {
        const generatedName = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '');
        setFormData((prev) => ({ ...prev, field_name: generatedName, field_key: generatedName }));
      }
    },
    [mode]
  );

  // Add option
  const handleAddOption = useCallback(() => {
    if (newOption.trim()) {
      const value = newOption.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const newOptionItem: OptionItem = {
        option_label: newOption.trim(),
        option_value: value,
        display_order: options.length,
      };
      setOptions((prev) => [...prev, newOptionItem]);
      setNewOption('');
    }
  }, [newOption, options.length]);

  // Remove option
  const handleRemoveOption = useCallback((index: number) => {
    setOptions((prev) => {
      const option = prev[index];
      // If option has an id (existing option), mark as deleted instead of removing
      if (option.id) {
        const updated = [...prev];
        updated[index] = { ...option, isDeleted: true };
        return updated;
      }
      // Otherwise, just remove it
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.field_label?.trim()) {
      newErrors.field_label = 'Field label is required';
    }

    if (!formData.field_name?.trim()) {
      newErrors.field_name = 'Field name is required';
    }

    if (!formData.field_key?.trim()) {
      newErrors.field_key = 'Field key is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.field_key)) {
      newErrors.field_key = 'Field key must contain only lowercase letters, numbers, and underscores';
    }

    if (!formData.template || formData.template === 0) {
      newErrors.template = 'Template is required';
    }

    // Validate options for select/radio/multiselect
    const activeOptions = options.filter((opt) => !opt.isDeleted);
    if (FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type) && activeOptions.length === 0) {
      newErrors.options = 'At least one option is required for this field type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, options]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      let savedFieldId: number;
      let fieldOperationSuccess = false;

      // Step 1: Create or update the field
      if (mode === 'create') {
        // Prepare the create payload
        const createPayload: CreateTemplateFieldPayload = { ...formData };

        // Include options for fields that require them
        if (FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
          const activeOptions = options.filter((opt) => !opt.isDeleted);
          createPayload.options = activeOptions.map((opt, index) => ({
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: index,
            is_active: true,
          }));
        }

        console.log('Creating field with payload:', createPayload);
        const createdField = await createTemplateField(createPayload);
        savedFieldId = createdField.id;
        fieldOperationSuccess = true;
        // Don't show success toast yet - wait for options to complete
      } else if (mode === 'edit' && fieldId) {
        const updatePayload: UpdateTemplateFieldPayload = {
          field_type: formData.field_type,
          field_label: formData.field_label,
          field_name: formData.field_name,
          field_key: formData.field_key,
          placeholder: formData.placeholder,
          help_text: formData.help_text,
          is_required: formData.is_required,
          min_length: formData.min_length,
          max_length: formData.max_length,
          min_value: formData.min_value,
          max_value: formData.max_value,
          pattern: formData.pattern,
          default_value: formData.default_value,
          display_order: formData.display_order,
          is_active: formData.is_active,
        };
        console.log('Updating field with payload:', updatePayload);
        await updateTemplateField(fieldId, updatePayload);
        savedFieldId = fieldId;
        fieldOperationSuccess = true;
        // Don't show success toast yet - wait for options to complete
      } else {
        throw new Error('Invalid mode or missing field ID');
      }

      // Step 2: Handle options for select/radio/multiselect fields (only in edit mode for separate option operations)
      if (mode === 'edit' && FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
        const optionPromises: Promise<any>[] = [];

        options.forEach((option, index) => {
          if (option.isDeleted && option.id) {
            // Delete existing option
            optionPromises.push(deleteTemplateFieldOption(option.id));
          } else if (!option.isDeleted && option.id) {
            // Update existing option (in case label/value changed or display_order)
            optionPromises.push(
              updateTemplateFieldOption(option.id, {
                option_label: option.option_label,
                option_value: option.option_value,
                display_order: index,
              })
            );
          } else if (!option.isDeleted && !option.id) {
            // Create new option
            optionPromises.push(
              createTemplateFieldOption({
                field: savedFieldId,
                option_label: option.option_label,
                option_value: option.option_value,
                display_order: index,
              })
            );
          }
        });

        // Wait for all option operations to complete
        if (optionPromises.length > 0) {
          await Promise.all(optionPromises);
        }
      }

      // Show success toast only after all operations complete
      if (fieldOperationSuccess) {
        toast.success(mode === 'create' ? 'Field created successfully' : 'Field updated successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save field');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    options,
    mode,
    fieldId,
    validate,
    createTemplateField,
    updateTemplateField,
    createTemplateFieldOption,
    updateTemplateFieldOption,
    deleteTemplateFieldOption,
    onSuccess,
  ]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!fieldId) return;

    if (!confirm('Are you sure you want to delete this field?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteTemplateField(fieldId);
      toast.success('Field deleted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete field');
      setIsSubmitting(false);
    }
  }, [fieldId, deleteTemplateField, onSuccess]);

  // Footer buttons
  const getFooterButtons = useCallback((): DrawerActionButton[] => {
    // Check if options are required but missing
    const activeOptions = options.filter((opt) => !opt.isDeleted);
    const needsOptions = FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type);
    const hasRequiredOptions = !needsOptions || activeOptions.length > 0;

    const actions: DrawerActionButton[] = [
      {
        label: 'Cancel',
        onClick: onClose,
        variant: 'outline',
      },
      {
        label: mode === 'create' ? 'Create' : 'Save',
        onClick: handleSubmit,
        variant: 'default',
        loading: isSubmitting,
        disabled: isSubmitting || !hasRequiredOptions,
      },
    ];

    if (mode === 'edit') {
      actions.push({
        label: 'Delete',
        onClick: handleDelete,
        variant: 'destructive',
      });
    }

    return actions;
  }, [mode, isSubmitting, handleSubmit, handleDelete, onClose, formData.field_type, options]);

  const showOptions = FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type);
  const showNumberValidation = FIELD_TYPES_NUMERIC.includes(formData.field_type);
  const showTextValidation = FIELD_TYPES_TEXT.includes(formData.field_type);

  // Fields that typically don't need placeholder (boolean, options-based fields, file uploads)
  const needsPlaceholder = ![
    'boolean',
    'select',
    'multiselect',
    'radio',
    'checkbox',
    'image',
    'file',
  ].includes(formData.field_type);

  // Check if we're missing required options
  const activeOptions = options.filter((opt) => !opt.isDeleted);
  const missingRequiredOptions = showOptions && activeOptions.length === 0;

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create Field' : 'Edit Field'}
      mode="edit"
      footerButtons={getFooterButtons()}
    >
      <div className="space-y-6">
        {/* Field Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Field Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Field Label */}
            <div className="space-y-2">
              <Label htmlFor="field_label">
                Field Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="field_label"
                value={formData.field_label}
                onChange={(e) => handleChange('field_label', e.target.value)}
                placeholder="e.g., Chief Complaint"
                className={errors.field_label ? 'border-destructive' : ''}
              />
              {errors.field_label && (
                <p className="text-sm text-destructive">{errors.field_label}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Display name shown in the UI
              </p>
            </div>

            {/* Field Name */}
            <div className="space-y-2">
              <Label htmlFor="field_name">
                Field Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="field_name"
                value={formData.field_name}
                onChange={(e) => handleChange('field_name', e.target.value)}
                placeholder="e.g., chief_complaint"
                className={errors.field_name ? 'border-destructive' : ''}
                disabled={mode === 'create'} // Auto-generated in create mode
              />
              {errors.field_name && (
                <p className="text-sm text-destructive">{errors.field_name}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {mode === 'create'
                  ? 'Auto-generated from field label'
                  : 'Technical field name'}
              </p>
            </div>

            {/* Field Key */}
            <div className="space-y-2">
              <Label htmlFor="field_key">
                Field Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="field_key"
                value={formData.field_key}
                onChange={(e) => handleChange('field_key', e.target.value.toLowerCase())}
                placeholder="e.g., chief_complaint"
                className={errors.field_key ? 'border-destructive' : ''}
                disabled={mode === 'create'} // Auto-generated in create mode
              />
              {errors.field_key && <p className="text-sm text-destructive">{errors.field_key}</p>}
              <p className="text-sm text-muted-foreground">
                {mode === 'create'
                  ? 'Auto-generated from field label'
                  : 'Unique identifier (lowercase, numbers, underscores only)'}
              </p>
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <Label htmlFor="field_type">
                Field Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.field_type}
                onValueChange={(value) => handleChange('field_type', value as FieldType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {FIELD_TYPES.find((t) => t.value === formData.field_type)?.description}
              </p>
            </div>

            {/* Placeholder - only for fields that accept text input */}
            {needsPlaceholder && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={formData.placeholder}
                  onChange={(e) => handleChange('placeholder', e.target.value)}
                  placeholder="Enter placeholder text..."
                />
                <p className="text-sm text-muted-foreground">
                  Text shown when field is empty
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                value={formData.help_text}
                onChange={(e) => handleChange('help_text', e.target.value)}
                placeholder="Additional help text..."
                rows={3}
              />
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            {/* Required & Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Required Field</Label>
                <p className="text-sm text-muted-foreground">Mark this field as mandatory</p>
              </div>
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) => handleChange('is_required', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">Inactive fields are hidden</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Options (for select, radio, multiselect, checkbox) */}
        {showOptions && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Field Options <span className="text-destructive">*</span></CardTitle>
                  <CardDescription>
                    {formData.field_type === 'select' && 'Define dropdown options (at least one required)'}
                    {formData.field_type === 'multiselect' && 'Define multiple-select options (at least one required)'}
                    {formData.field_type === 'radio' && 'Define radio button options (at least one required)'}
                    {formData.field_type === 'checkbox' && 'Define checkbox options (at least one required)'}
                  </CardDescription>
                </div>
                {options.filter((opt) => !opt.isDeleted).length > 0 && (
                  <Badge variant="secondary">
                    {options.filter((opt) => !opt.isDeleted).length} option
                    {options.filter((opt) => !opt.isDeleted).length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {options.filter((opt) => !opt.isDeleted).length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    No options added yet
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Add at least one option to save this field
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {options
                  .filter((opt) => !opt.isDeleted)
                  .map((option, index) => {
                    // Find the real index in the original array
                    const realIndex = options.findIndex(
                      (opt) => opt.option_label === option.option_label && opt.option_value === option.option_value
                    );
                    return (
                      <div key={realIndex} className="flex items-center gap-2">
                        <Input value={option.option_label} disabled className="flex-1" />
                        <Badge variant="outline" className="min-w-[80px] justify-center">
                          {option.option_value}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(realIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Enter option label..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button onClick={handleAddOption} disabled={!newOption.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {errors.options && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm font-medium text-destructive">{errors.options}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Press Enter or click Add to create an option. The value will be auto-generated from the label.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Validation Rules - Text */}
        {showTextValidation && (
          <Card>
            <CardHeader>
              <CardTitle>Text Length Validation</CardTitle>
              <CardDescription>
                Set minimum and maximum character limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_length">Minimum Length (characters)</Label>
                  <Input
                    id="min_length"
                    type="number"
                    value={formData.min_length || ''}
                    onChange={(e) =>
                      handleChange('min_length', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    min="0"
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_length">Maximum Length (characters)</Label>
                  <Input
                    id="max_length"
                    type="number"
                    value={formData.max_length || ''}
                    onChange={(e) =>
                      handleChange('max_length', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    min="0"
                    placeholder="No limit"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Rules - Number/Decimal */}
        {showNumberValidation && (
          <Card>
            <CardHeader>
              <CardTitle>
                {formData.field_type === 'decimal' ? 'Decimal Range Validation' : 'Number Range Validation'}
              </CardTitle>
              <CardDescription>
                Set minimum and maximum allowed values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_value">Minimum Value</Label>
                  <Input
                    id="min_value"
                    type="number"
                    step={formData.field_type === 'decimal' ? '0.01' : '1'}
                    value={formData.min_value || ''}
                    onChange={(e) =>
                      handleChange('min_value', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_value">Maximum Value</Label>
                  <Input
                    id="max_value"
                    type="number"
                    step={formData.field_type === 'decimal' ? '0.01' : '1'}
                    value={formData.max_value || ''}
                    onChange={(e) =>
                      handleChange('max_value', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="No limit"
                  />
                </div>
              </div>
              {formData.field_type === 'decimal' && (
                <p className="text-sm text-muted-foreground">
                  Supports decimal values with up to 2 decimal places
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Warning when submit is disabled due to missing options */}
        {missingRequiredOptions && (
          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-2">
                  <svg
                    className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Cannot save field without options
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {formData.field_type === 'checkbox' && 'Checkbox fields require at least one option.'}
                    {formData.field_type === 'select' && 'Dropdown fields require at least one option.'}
                    {formData.field_type === 'multiselect' && 'Multiple-select fields require at least one option.'}
                    {formData.field_type === 'radio' && 'Radio button fields require at least one option.'}
                    {' '}Please add at least one option above to enable the save button.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SideDrawer>
  );
}
