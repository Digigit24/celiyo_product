// src/components/contact-drawer/ContactBasicInfo.tsx
import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus } from 'lucide-react';

import type { Contact, CreateContactPayload } from '@/types/whatsappTypes';
import type { ContactBasicInfoHandle } from '../ContactsFormDrawer';

// Validation schema
const contactSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  name: z.string().optional(),
  notes: z.string().optional(),
  labels: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
  is_business: z.boolean().optional(),
  business_description: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactBasicInfoProps {
  contact?: Contact | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
}

const ContactBasicInfo = forwardRef<ContactBasicInfoHandle, ContactBasicInfoProps>(
  ({ contact, mode, onSuccess }, ref) => {
    const isReadOnly = mode === 'view';

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
      getValues,
    } = useForm<ContactFormData>({
      resolver: zodResolver(contactSchema),
      defaultValues: {
        phone: contact?.phone || '',
        name: contact?.name || '',
        notes: contact?.notes || '',
        labels: contact?.labels || [],
        groups: contact?.groups || [],
        is_business: contact?.is_business || false,
        business_description: contact?.business_description || '',
      },
    });

    const watchedLabels = watch('labels') || [];
    const watchedGroups = watch('groups') || [];
    const watchedIsBusiness = watch('is_business');

    // Expose form validation and data collection to parent
    useImperativeHandle(ref, () => ({
      getFormValues: async (): Promise<CreateContactPayload | null> => {
        return new Promise((resolve) => {
          handleSubmit(
            (data) => {
              const payload: CreateContactPayload = {
                phone: data.phone,
                name: data.name || undefined,
                notes: data.notes || undefined,
                labels: data.labels?.length ? data.labels : undefined,
                groups: data.groups?.length ? data.groups : undefined,
                is_business: data.is_business || false,
                business_description: data.business_description || undefined,
              };
              resolve(payload);
            },
            () => resolve(null)
          )();
        });
      },
    }));

    const addLabel = (label: string) => {
      if (label.trim() && !watchedLabels.includes(label.trim())) {
        setValue('labels', [...watchedLabels, label.trim()]);
      }
    };

    const removeLabel = (labelToRemove: string) => {
      setValue('labels', watchedLabels.filter(label => label !== labelToRemove));
    };

    const addGroup = (group: string) => {
      if (group.trim() && !watchedGroups.includes(group.trim())) {
        setValue('groups', [...watchedGroups, group.trim()]);
      }
    };

    const removeGroup = (groupToRemove: string) => {
      setValue('groups', watchedGroups.filter(group => group !== groupToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, type: 'label' | 'group') => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = e.currentTarget.value;
        if (type === 'label') {
          addLabel(value);
        } else {
          addGroup(value);
        }
        e.currentTarget.value = '';
      }
    };

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
                disabled={isReadOnly || mode === 'edit'} // Phone can't be changed in edit mode
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter contact name"
                disabled={isReadOnly}
              />
            </div>

            {/* Business Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_business"
                checked={watchedIsBusiness}
                onCheckedChange={(checked) => setValue('is_business', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_business">Business Contact</Label>
            </div>

            {/* Business Description */}
            {watchedIsBusiness && (
              <div className="space-y-2">
                <Label htmlFor="business_description">Business Description</Label>
                <Textarea
                  id="business_description"
                  {...register('business_description')}
                  placeholder="Describe the business"
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Labels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Labels */}
            {watchedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="flex items-center gap-1">
                    {label}
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeLabel(label)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Label */}
            {!isReadOnly && (
              <div className="space-y-2">
                <Label>Add Label</Label>
                <Input
                  placeholder="Type label and press Enter"
                  onKeyPress={(e) => handleKeyPress(e, 'label')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Groups */}
            {watchedGroups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedGroups.map((group) => (
                  <Badge key={group} variant="outline" className="flex items-center gap-1">
                    {group}
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeGroup(group)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Group */}
            {!isReadOnly && (
              <div className="space-y-2">
                <Label>Add Group</Label>
                <Input
                  placeholder="Type group and press Enter"
                  onKeyPress={(e) => handleKeyPress(e, 'group')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('notes')}
              placeholder="Add notes about this contact"
              disabled={isReadOnly}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Contact Metadata (View Mode Only) */}
        {mode === 'view' && contact && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Contact ID</Label>
                  <p className="font-mono">{contact.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{contact.status || 'No status'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Seen</Label>
                  <p>{contact.last_seen ? new Date(contact.last_seen).toLocaleString() : 'Never'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{new Date(contact.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {contact.profile_pic_url && (
                <div>
                  <Label className="text-muted-foreground">Profile Picture</Label>
                  <div className="mt-2">
                    <img
                      src={contact.profile_pic_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

ContactBasicInfo.displayName = 'ContactBasicInfo';

export default ContactBasicInfo;