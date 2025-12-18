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
  { value: 'canvas', label: '🎨 Canvas Drawing', description: 'Excalidraw drawing canvas for sketches and diagrams' },
  { value: 'json', label: 'JSON Data', description: 'Store structured JSON data (including canvas drawings)' },
];

const FIELD_TYPES_WITH_OPTIONS: FieldType[] = ['select', 'radio', 'multiselect', 'checkbox'];
const FIELD_TYPES_NUMERIC: FieldType[] = ['number'];
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
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
    createTemplateFieldOption,
    updateTemplateFieldOption,
    deleteTemplateFieldOption,
  } = useOPDTemplate();

  const [formData, setFormData] = useState<CreateTemplateFieldPayload & { metadata?: any }>({
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
    metadata: {},
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
        metadata: fieldData.metadata || {},
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
        metadata: {},
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
  
  const handleMetadataChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({
        ...prev,
        metadata: {
            ...prev.metadata,
            [key]: value,
        },
    }));
  }, []);

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
        const updated = [...prev];
        updated[index] = { ...option, isDeleted: true };
        return updated;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const validate = useCallback((): boolean => {
    // ... validation logic
    return true;
  }, [formData, options]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      let savedFieldId: number;
      let fieldOperationSuccess = false;

      if (mode === 'create') {
        const createPayload: CreateTemplateFieldPayload = { ...formData };

        if (FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
          const activeOptions = options.filter((opt) => !opt.isDeleted);
          createPayload.options = activeOptions.map((opt, index) => ({
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: index,
            is_active: true,
          }));
        }

        const createdField = await createTemplateField(createPayload);
        savedFieldId = createdField.id;
        fieldOperationSuccess = true;
      } else if (mode === 'edit' && fieldId) {
        const updatePayload: UpdateTemplateFieldPayload = { ...formData };
        await updateTemplateField(fieldId, updatePayload);
        savedFieldId = fieldId;
        fieldOperationSuccess = true;
      } else {
        throw new Error('Invalid mode or missing field ID');
      }

      if (mode === 'edit' && FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type)) {
        // ... option handling logic
      }

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
    formData, options, mode, fieldId, validate, createTemplateField, updateTemplateField,
    createTemplateFieldOption, updateTemplateFieldOption, deleteTemplateFieldOption, onSuccess,
  ]);

  const handleDelete = useCallback(async () => {
    // ... delete logic
  }, [fieldId, deleteTemplateField, onSuccess]);

  const getFooterButtons = useCallback((): DrawerActionButton[] => {
    // ... footer button logic
    const actions: DrawerActionButton[] = [
        { label: 'Cancel', onClick: onClose, variant: 'outline' },
        { label: mode === 'create' ? 'Create' : 'Save', onClick: handleSubmit, variant: 'default', loading: isSubmitting, disabled: isSubmitting },
    ];
    if (mode === 'edit') {
        actions.push({ label: 'Delete', onClick: handleDelete, variant: 'destructive' });
    }
    return actions;
  }, [mode, isSubmitting, handleSubmit, handleDelete, onClose]);

  const showOptions = FIELD_TYPES_WITH_OPTIONS.includes(formData.field_type);
  const showNumberValidation = FIELD_TYPES_NUMERIC.includes(formData.field_type);
  const showTextValidation = FIELD_TYPES_TEXT.includes(formData.field_type);
  const needsPlaceholder = !['boolean', 'select', 'multiselect', 'radio', 'checkbox', 'image', 'file', 'canvas', 'json'].includes(formData.field_type);
  const missingRequiredOptions = showOptions && options.filter((opt) => !opt.isDeleted).length === 0;

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create Field' : 'Edit Field'}
      mode="edit"
      footerButtons={getFooterButtons()}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Field Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field_label">Field Label <span className="text-destructive">*</span></Label>
              <Input id="field_label" value={formData.field_label} onChange={(e) => handleChange('field_label', e.target.value)} placeholder="e.g., Chief Complaint" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field_type">Field Type <span className="text-destructive">*</span></Label>
              <Select value={formData.field_type} onValueChange={(value) => handleChange('field_type', value as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        {/* Other conditional cards from original file */}
      </div>
    </SideDrawer>
  );
}
