// src/components/ActivityFormDrawer.tsx
import { useState, useEffect } from 'react';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityTypeEnum } from '@/types/crmTypes';

interface ActivityFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  onSuccess?: () => void;
}

export const ActivityFormDrawer: React.FC<ActivityFormDrawerProps> = ({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { createLeadActivity } = useCRM();

  // Form state
  const [type, setType] = useState<ActivityTypeEnum>('NOTE');
  const [content, setContent] = useState('');
  const [happenedAt, setHappenedAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default happened_at to now
  useEffect(() => {
    if (open) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setHappenedAt(localDateTime);
      setContent('');
      setType('NOTE');
    }
  }, [open]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Activity content is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const activityData = {
        lead: leadId,
        type,
        content: content.trim(),
        happened_at: new Date(happenedAt).toISOString(),
        by_user_id: user?.id,
      };

      await createLeadActivity(activityData);
      toast.success('Activity added successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Activity</SheetTitle>
          <SheetDescription>
            Record an interaction or note for this lead
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Activity Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ActivityTypeEnum)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="NOTE">Note</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter activity details..."
              rows={6}
              required
            />
          </div>

          {/* Happened At */}
          <div className="space-y-2">
            <Label htmlFor="happenedAt">
              Date & Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="happenedAt"
              type="datetime-local"
              value={happenedAt}
              onChange={(e) => setHappenedAt(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Activity'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ActivityFormDrawer;
