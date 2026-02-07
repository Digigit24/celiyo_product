// src/components/opd-settings/TemplateGroupFormDrawer.tsx
import { useState, useEffect, useCallback } from 'react';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { SideDrawer, type DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type {
  TemplateGroup,
  CreateTemplateGroupPayload,
  UpdateTemplateGroupPayload,
} from '@/types/opdTemplate.types';

type DrawerMode = 'view' | 'edit' | 'create';

interface TemplateGroupFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number | null;
  mode: DrawerMode;
  onSuccess: () => void;
  onClose: () => void;
}

export function TemplateGroupFormDrawer({
  open,
  onOpenChange,
  groupId,
  mode: initialMode,
  onSuccess,
  onClose,
}: TemplateGroupFormDrawerProps) {
  const {
    useTemplateGroup,
    createTemplateGroup,
    updateTemplateGroup,
    deleteTemplateGroup,
  } = useOPDTemplate();

  const [mode, setMode] = useState<DrawerMode>(initialMode);

  // Form state
  const [formData, setFormData] = useState<CreateTemplateGroupPayload>({
    name: '',
    description: '',
    is_active: true,
    display_order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch group data when editing/viewing
  const { data: groupData, error: fetchError } = useTemplateGroup(groupId);

  // Sync mode with prop
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Update form data when group data changes
  useEffect(() => {
    if (groupData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: groupData.name,
        description: groupData.description || '',
        is_active: groupData.is_active,
        display_order: groupData.display_order,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
      });
    }
    setErrors({});
  }, [groupData, mode]);

  // Handle form field changes
  const handleChange = useCallback(
    (field: keyof CreateTemplateGroupPayload, value: any) => {
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
        await createTemplateGroup(formData);
        toast.success('Template group created successfully');
      } else if (mode === 'edit' && groupId) {
        const updatePayload: UpdateTemplateGroupPayload = {
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          display_order: formData.display_order,
        };
        await updateTemplateGroup(groupId, updatePayload);
        toast.success('Template group updated successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template group');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, groupId, validate, createTemplateGroup, updateTemplateGroup, onSuccess]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!groupId) return;

    if (!confirm('Are you sure you want to delete this template group?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteTemplateGroup(groupId);
      toast.success('Template group deleted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template group');
      setIsSubmitting(false);
    }
  }, [groupId, deleteTemplateGroup, onSuccess]);

  // Header actions
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
    mode === 'create'
      ? 'Create Template Group'
      : mode === 'edit'
      ? 'Edit Template Group'
      : 'Template Group Details';

  const isReadOnly = mode === 'view';

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      mode={mode}
      footerButtons={getFooterButtons()}
      isLoading={!groupData && groupId !== null && mode !== 'create'}
    >
      <div className="space-y-6">
        {/* Group Information */}
        <Card>
          <CardHeader>
            <CardTitle>Group Information</CardTitle>
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
                placeholder="e.g., Cardiology OPD"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isReadOnly}
                placeholder="Brief description of this template group..."
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
                  Inactive groups are hidden from users
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
        {mode === 'view' && groupData && (
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Group ID</span>
                <span className="text-sm font-medium">{groupData.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={groupData.is_active ? 'default' : 'secondary'}>
                  {groupData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(groupData.created_at), { addSuffix: true })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(groupData.updated_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SideDrawer>
  );
}
