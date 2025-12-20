// src/components/consultation/ResponseCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  MoreVertical,
  Copy,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  FileText,
  User,
} from 'lucide-react';
import { TemplateResponse } from '@/types/opdTemplate.types';
import { formatDistanceToNow } from 'date-fns';
import { useUsers } from '@/hooks/useUsers';

// Safe date formatter helper
const formatTimeAgo = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

interface ResponseCardProps {
  response: TemplateResponse;
  templateName?: string;
  onView: () => void;
  onCopyFromTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  onDelete?: () => void;
  onMarkReviewed?: () => void;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: CheckCircle,
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Archive,
  },
};

export const ResponseCard: React.FC<ResponseCardProps> = ({
  response,
  templateName,
  onView,
  onCopyFromTemplate,
  onSaveAsTemplate,
  onDelete,
  onMarkReviewed,
}) => {
  const { useUser } = useUsers();
  const { data: filledByUser } = useUser(response.filled_by_id || null);
  const { data: reviewedByUser } = useUser(response.reviewed_by_id || null);

  const config = statusConfig[response.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = config.icon;

  // Construct full name from first_name and last_name
  const filledByName = filledByUser
    ? `${filledByUser.first_name} ${filledByUser.last_name}`.trim()
    : 'Unknown';

  const reviewedByName = reviewedByUser
    ? `${reviewedByUser.first_name} ${reviewedByUser.last_name}`.trim()
    : 'Unknown';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50">
      <CardContent className="p-0">
        {/* Card Header with Template Name */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-sm truncate">{templateName || 'Clinical Note'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  #{response.response_sequence}
                </Badge>
                <Badge className={`text-xs ${config.className}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onCopyFromTemplate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyFromTemplate(); }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy from Template
                    </DropdownMenuItem>
                  </>
                )}
                {onSaveAsTemplate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSaveAsTemplate(); }}>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Template
                  </DropdownMenuItem>
                )}
                {onMarkReviewed && response.status !== 'reviewed' && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkReviewed(); }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card Content - Click to View */}
        <div onClick={onView} className="p-4 space-y-3">
          {/* Filled By */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Filled by:</span>
            <span className="font-medium">{filledByName}</span>
          </div>

          {/* Doctor Switch Info */}
          {response.doctor_switched_reason && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2">
              <p className="font-semibold text-amber-800">Handover Note:</p>
              <p className="text-amber-700 mt-1">{response.doctor_switched_reason}</p>
            </div>
          )}

          {/* Reviewed Badge */}
          {response.is_reviewed && response.reviewed_by_id && (
            <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 rounded p-2">
              <CheckCircle className="h-3 w-3 text-blue-600" />
              <span className="text-blue-700">
                Reviewed by {reviewedByName}
              </span>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Created:</span>
              <span className="font-medium">{formatTimeAgo(response.response_date || response.created_at)}</span>
            </div>
            {response.updated_at && response.updated_at !== (response.response_date || response.created_at) && (
              <div className="flex justify-between">
                <span>Updated:</span>
                <span className="font-medium">{formatTimeAgo(response.updated_at)}</span>
              </div>
            )}
          </div>

          {/* Canvas Indicator */}
          {response.canvas_data && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <FileText className="h-3 w-3" />
              <span>Contains canvas drawing</span>
            </div>
          )}

          {/* Field Count */}
          <div className="text-xs text-muted-foreground">
            {response.field_response_count || 0} fields filled
          </div>
        </div>

        {/* View Button at Bottom */}
        <div className="border-t p-3 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={onView}
          >
            <Eye className="mr-2 h-4 w-4" />
            View & Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
