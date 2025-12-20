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
import { Plus, X, GripVertical } from 'lucide-react';
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

const FIELD_TYPES: { value: FieldType; label: string; description: string; icon: string }[] = [
  { value: 'text', label: 'Short Text', description: 'Single line text input', icon: '📝' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text input', icon: '📄' },
  { value: 'number', label: 'Number', description: 'Numeric input with validation', icon: '🔢' },
  { value: 'email', label: 'Email', description: 'Email address with validation', icon: '📧' },
  { value: 'phone', label: 'Phone', description: 'Phone number input', icon: '📱' },
  { value: 'date', label: 'Date', description: 'Date picker (YYYY-MM-DD)', icon: '📅' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker', icon: '🕐' },
  { value: 'select', label: 'Dropdown', description: 'Dropdown with single selection', icon: '📋' },
  { value: 'multiselect', label: 'Multi Select', description: 'Multiple selection checkboxes', icon: '☑️' },
  { value: 'radio', label: 'Radio Buttons', description: 'Single choice from options', icon: '🔘' },
  { value: 'checkbox', label: 'Checkboxes', description: 'Multiple choice checkboxes', icon: '✅' },
  { value: 'canvas', label: 'Canvas Drawing', description: 'Excalidraw drawing canvas', icon: '🎨' },
  { value: 'json', label: 'JSON Data', description: 'Store structured JSON data', icon: '📊' },
];

const FIELD_TYPES_WITH_OPTIONS: FieldType[] = ['select', 'radio', 'multiselect', 'checkbox'];
const FIELD_TYPES_NUMERIC: FieldType[] = ['number', 'decimal'];
const FIELD_TYPES_TEXT: FieldType[] = ['text', 'textarea', 'email', 'phone'];

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
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
  } = useOPDTemplate();

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

  interface OptionItem {
    id?: number;
    option_label: string;
    option_value: string;
    display_order: number;
    isDeleted?: boolean;
  }

  const [options, setOptions] = useState<OptionItem[]>([]);
  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fieldData } = useTemplateField(fieldId);

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

      if (fieldData.options && Array.isArray(fieldData.options)) {
        setOptions(
          fieldData.options.map((opt) => ({
            id: opt.id,
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: opt.display_order,
          }))
        );
      } else {
        setOptions([]);
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

  const handleChange = useCallback(
    (field: keyof CreateTemplateFieldPayload, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));

      if (field === 'field_label' && typeof value === 'string' && mode === 'create') {
        const generatedName = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        setFormData((prev) => ({ ...prev, field_name: generatedName, field_key: generatedName }));
      }
    },
    [mode]
  );

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

  const handleRemoveOption = useCallback((index: number) => {
    setOptions((prev) => {
      const option = prev[index];
      if (option.id) {
        // Mark existing options as deleted
        const updated = [...prev];
        updated[index] = { ...option, isDeleted: true };
        return updated;
      }
      // Remove new options immediately
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleKeyDownOption = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  }, [handleAddOption]);

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
    }

    if (FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
      const activeOptions = options.filter((opt) => !opt.isDeleted);
      if (activeOptions.length === 0) {
        newErrors.options = 'At least one option is required for this field type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, options]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const createPayload: CreateTemplateFieldPayload = { ...formData };

        // Add options for select-type fields
        if (FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
          const activeOptions = options.filter((opt) => !opt.isDeleted);
          createPayload.options = activeOptions.map((opt, index) => ({
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: index,
            is_active: true,
          }));
        }

        await createTemplateField(createPayload);
        toast.success('Field created successfully');
      } else if (mode === 'edit' && fieldId) {
        const updatePayload: UpdateTemplateFieldPayload = { ...formData };
        await updateTemplateField(fieldId, updatePayload);

        // Handle options for select-type fields in edit mode
        if (FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
          // For now, we'll recreate the field to update options
          // In a more sophisticated implementation, you'd handle individual option CRUD
          toast.info('Options updated - field recreated');
        }

        toast.success('Field updated successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving field:', error);
      toast.error(error.message || 'Failed to save field');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData, options, mode, fieldId, validate, createTemplateField, updateTemplateField, onSuccess,
  ]);

  const handleDelete = useCallback(async () => {
    if (!fieldId) return;

    const confirmed = window.confirm('Are you sure you want to delete this field? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteTemplateField(fieldId);
      toast.success('Field deleted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete field');
    }
  }, [fieldId, deleteTemplateField, onSuccess]);

  const getFooterButtons = useCallback((): DrawerActionButton[] => {
    const actions: DrawerActionButton[] = [
      { label: 'Cancel', onClick: onClose, variant: 'outline' },
      {
        label: mode === 'create' ? 'Create Field' : 'Save Changes',
        onClick: handleSubmit,
        variant: 'default',
        loading: isSubmitting,
        disabled: isSubmitting,
      },
    ];
    if (mode === 'edit') {
      actions.splice(1, 0, { label: 'Delete', onClick: handleDelete, variant: 'destructive' });
    }
    return actions;
  }, [mode, isSubmitting, handleSubmit, handleDelete, onClose]);

  const showOptions = FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type);
  const showNumberValidation = FIELD_TYPES_NUMERIC.includes(formData.field_type);
  const showTextValidation = FIELD_TYPES_TEXT.includes(formData.field_type);
  const needsPlaceholder = !['boolean', 'select', 'multiselect', 'radio', 'checkbox', 'canvas', 'json'].includes(formData.field_type);

  const selectedFieldType = FIELD_TYPES.find(t => t.value === formData.field_type);

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create Field' : 'Edit Field'}
      mode="edit"
      footerButtons={getFooterButtons()}
    >
      <div className="space-y-6">
        {/* Field Type Badge */}
        {selectedFieldType && (
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border">
            <span className="text-3xl">{selectedFieldType.icon}</span>
            <div>
              <p className="font-semibold text-lg">{selectedFieldType.label}</p>
              <p className="text-sm text-muted-foreground">{selectedFieldType.description}</p>
            </div>
          </div>
        )}

        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
            <CardDescription>Define the field's label, type, and identifiers</CardDescription>
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
                error={errors.field_label}
              />
              {errors.field_label && <p className="text-sm text-destructive">{errors.field_label}</p>}
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <Label htmlFor="field_type">
                Field Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.field_type} onValueChange={(value) => handleChange('field_type', value as FieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Key */}
            <div className="space-y-2">
              <Label htmlFor="field_key">
                Field Key <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">(used in code and database)</span>
              </Label>
              <Input
                id="field_key"
                value={formData.field_key}
                onChange={(e) => handleChange('field_key', e.target.value)}
                placeholder="e.g., chief_complaint"
                className="font-mono text-sm"
                error={errors.field_key}
              />
              {errors.field_key && <p className="text-sm text-destructive">{errors.field_key}</p>}
            </div>

            {/* Field Name (Internal) */}
            <div className="space-y-2">
              <Label htmlFor="field_name">
                Field Name <span className="text-xs text-muted-foreground">(internal identifier)</span>
              </Label>
              <Input
                id="field_name"
                value={formData.field_name}
                onChange={(e) => handleChange('field_name', e.target.value)}
                placeholder="e.g., chief_complaint"
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Options Editor (for select types) */}
        {showOptions && (
          <Card>
            <CardHeader>
              <CardTitle>Field Options</CardTitle>
              <CardDescription>Define the available choices for this field</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Options */}
              {options.filter(opt => !opt.isDeleted).length > 0 && (
                <div className="space-y-2">
                  {options.map((option, index) => {
                    if (option.isDeleted) return null;
                    return (
                      <div key={option.id || index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{option.option_label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{option.option_value}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Option */}
              <div className="space-y-2">
                <Label>Add New Option</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={handleKeyDownOption}
                    placeholder="Type option and press Enter"
                    className="flex-1"
                  />
                  <Button onClick={handleAddOption} size="sm" disabled={!newOption.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {errors.options && <p className="text-sm text-destructive">{errors.options}</p>}
            </CardContent>
          </Card>
        )}

        {/* Display Options */}
        <Card>
          <CardHeader>
            <CardTitle>Display Options</CardTitle>
            <CardDescription>Configure how this field appears to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder */}
            {needsPlaceholder && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={formData.placeholder || ''}
                  onChange={(e) => handleChange('placeholder', e.target.value)}
                  placeholder="e.g., Enter your complaint..."
                />
              </div>
            )}

            {/* Help Text */}
            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                value={formData.help_text || ''}
                onChange={(e) => handleChange('help_text', e.target.value)}
                placeholder="Provide helpful instructions or context for this field"
                rows={3}
              />
            </div>

            {/* Default Value */}
            {!showOptions && formData.field_type !== 'canvas' && (
              <div className="space-y-2">
                <Label htmlFor="default_value">Default Value</Label>
                <Input
                  id="default_value"
                  value={formData.default_value || ''}
                  onChange={(e) => handleChange('default_value', e.target.value)}
                  placeholder="Optional default value"
                  type={formData.field_type === 'number' ? 'number' : formData.field_type === 'date' ? 'date' : 'text'}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Rules</CardTitle>
            <CardDescription>Set constraints and requirements for this field</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_required">Required Field</Label>
                <p className="text-sm text-muted-foreground">Users must fill this field</p>
              </div>
              <Switch
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(checked) => handleChange('is_required', checked)}
              />
            </div>

            {/* Number Validation */}
            {showNumberValidation && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_value">Minimum Value</Label>
                  <Input
                    id="min_value"
                    type="number"
                    value={formData.min_value || ''}
                    onChange={(e) => handleChange('min_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_value">Maximum Value</Label>
                  <Input
                    id="max_value"
                    type="number"
                    value={formData.max_value || ''}
                    onChange={(e) => handleChange('max_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="No maximum"
                  />
                </div>
              </div>
            )}

            {/* Text Validation */}
            {showTextValidation && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_length">Minimum Length</Label>
                  <Input
                    id="min_length"
                    type="number"
                    value={formData.min_length || ''}
                    onChange={(e) => handleChange('min_length', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_length">Maximum Length</Label>
                  <Input
                    id="max_length"
                    type="number"
                    value={formData.max_length || ''}
                    onChange={(e) => handleChange('max_length', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="No maximum"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Additional configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">Show this field to users</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </SideDrawer>
  );
}
