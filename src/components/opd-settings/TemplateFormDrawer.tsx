// src/components/opd-settings/TemplateFormDrawer.tsx
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type {
  Template,
  CreateTemplatePayload,
  UpdateTemplatePayload,
} from '@/types/opdTemplate.types';

type DrawerMode = 'view' | 'edit' | 'create';

interface TemplateFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number | null;
  groupId: number | null;
  mode: DrawerMode;
  onSuccess: () => void;
  onClose: () => void;
}

export function TemplateFormDrawer({
  open,
  onOpenChange,
  templateId,
  groupId,
  mode: initialMode,
  onSuccess,
  onClose,
}: TemplateFormDrawerProps) {
  const {
    useTemplate,
    useTemplateGroups,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useOPDTemplate();

  const [mode, setMode] = useState<DrawerMode>(initialMode);

  // Form state
  const [formData, setFormData] = useState<CreateTemplatePayload>({
    name: '',
    code: '',
    group: groupId || 0,
    description: '',
    is_active: true,
    display_order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch template data when editing/viewing
  const { data: templateData, error: fetchError } = useTemplate(templateId);

  // Fetch template groups for dropdown
  const { data: groupsData } = useTemplateGroups({ show_inactive: false });

  // Sync mode with prop
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Update form data when template data changes
  useEffect(() => {
    if (templateData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: templateData.name,
        code: templateData.code,
        group: templateData.group,
        description: templateData.description || '',
        is_active: templateData.is_active,
        display_order: templateData.display_order,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        code: '',
        group: groupId || 0,
        description: '',
        is_active: true,
        display_order: 0,
      });
    }
    setErrors({});
  }, [templateData, mode, groupId]);

  // Handle form field changes
  const handleChange = useCallback(
    (field: keyof CreateTemplatePayload, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    []
  );

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.code?.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores';
    }

    if (!formData.group || formData.group === 0) {
      newErrors.group = 'Group is required';
    }

    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        await createTemplate(formData);
        toast.success('Template created successfully');
      } else if (mode === 'edit' && templateId) {
        const updatePayload: UpdateTemplatePayload = {
          name: formData.name,
          code: formData.code,
          group: formData.group,
          description: formData.description,
          is_active: formData.is_active,
          display_order: formData.display_order,
        };
        await updateTemplate(templateId, updatePayload);
        toast.success('Template updated successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, templateId, validate, createTemplate, updateTemplate, onSuccess]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!templateId) return;

    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteTemplate(templateId);
      toast.success('Template deleted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
      setIsSubmitting(false);
    }
  }, [templateId, deleteTemplate, onSuccess]);

  // Footer buttons
  const getFooterButtons = useCallback((): DrawerActionButton[] => {
    if (mode === 'view') {
      return [
        {
          label: 'Edit',
          onClick: () => setMode('edit'),
          variant: 'default',
        },
        {
          label: 'Delete',
          onClick: handleDelete,
          variant: 'destructive',
        },
      ];
    }

    if (mode === 'edit') {
      return [
        {
          label: 'Cancel',
          onClick: () => setMode('view'),
          variant: 'outline',
        },
        {
          label: 'Save',
          onClick: handleSubmit,
          variant: 'default',
          loading: isSubmitting,
        },
      ];
    }

    // Create mode
    return [
      {
        label: 'Cancel',
        onClick: onClose,
        variant: 'outline',
      },
      {
        label: 'Create',
        onClick: handleSubmit,
        variant: 'default',
        loading: isSubmitting,
      },
    ];
  }, [mode, isSubmitting, handleSubmit, handleDelete, onClose]);

  const title =
    mode === 'create' ? 'Create Template' : mode === 'edit' ? 'Edit Template' : 'Template Details';

  const isReadOnly = mode === 'view';

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      mode={mode}
      footerButtons={getFooterButtons()}
      isLoading={!templateData && templateId !== null && mode !== 'create'}
    >
      <div className="space-y-6">
        {/* Template Information */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g., Chest Pain Evaluation"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                disabled={isReadOnly}
                placeholder="e.g., CARD_CHEST_PAIN"
                className={errors.code ? 'border-destructive' : ''}
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
              <p className="text-sm text-muted-foreground">
                Unique code (uppercase, numbers, underscores only)
              </p>
            </div>

            {/* Group */}
            <div className="space-y-2">
              <Label htmlFor="group">
                Template Group <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.group.toString()}
                onValueChange={(value) => handleChange('group', parseInt(value))}
                disabled={isReadOnly}
              >
                <SelectTrigger className={errors.group ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groupsData?.results.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.group && <p className="text-sm text-destructive">{errors.group}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isReadOnly}
                placeholder="Brief description of this template..."
                rows={4}
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
                disabled={isReadOnly}
                min="0"
                className={errors.display_order ? 'border-destructive' : ''}
              />
              {errors.display_order && (
                <p className="text-sm text-destructive">{errors.display_order}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Lower numbers appear first in lists
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive templates are hidden from users
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
                disabled={isReadOnly}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metadata (View mode only) */}
        {mode === 'view' && templateData && (
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Template ID</span>
                <span className="text-sm font-medium">{templateData.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={templateData.is_active ? 'default' : 'secondary'}>
                  {templateData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(templateData.created_at), { addSuffix: true })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(templateData.updated_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SideDrawer>
  );
}
