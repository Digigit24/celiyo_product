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
  PenTool,
  ClipboardList,
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

  // existing
  onView: () => void;

  // existing (optional)
  onCopyFromTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  onDelete?: () => void;
  onMarkReviewed?: () => void;

  // NEW: direct navigation actions
  onOpenForm?: () => void;
  onOpenCanvas?: () => void;
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
  onOpenForm,
  onOpenCanvas,
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

  const filledByName = filledByUser
    ? `${filledByUser.first_name} ${filledByUser.last_name}`.trim()
    : 'Unknown';

  const reviewedByName = reviewedByUser
    ? `${reviewedByUser.first_name} ${reviewedByUser.last_name}`.trim()
    : 'Unknown';

  // Fallback behavior:
  // - Form button should open form; if not provided, use onView
  // - Canvas button should call onOpenCanvas if provided; else do nothing
  const handleOpenForm = () => {
    if (onOpenForm) onOpenForm();
    else onView();
  };

  const handleOpenCanvas = () => {
    if (onOpenCanvas) onOpenCanvas();
  };

  const hasCanvas = !!response.canvas_data;
  const canOpenCanvas = !!onOpenCanvas; // you can also change this to `hasCanvas && !!onOpenCanvas` if you want strict

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.01] cursor-pointer border hover:border-primary/50">
      <CardContent className="p-0">
        {/* Card Header with Template Name */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 border-b">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-sm truncate">{templateName || 'Clinical Note'}</h3>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  #{response.response_sequence}
                </Badge>
                <Badge className={`text-xs h-5 px-1.5 ${config.className}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>

            {/* Right actions: Canvas + Form + Menu */}
            <div className="flex items-center gap-0.5">
              {/* Open Form */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                title="Open Form Fields"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenForm();
                }}
              >
                <ClipboardList className="h-3.5 w-3.5" />
              </Button>

              {/* Open Canvas */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                title={hasCanvas ? 'Open Canvas Drawing' : 'Open Canvas (empty)'}
                disabled={!canOpenCanvas}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCanvas();
                }}
              >
                <PenTool className="h-3.5 w-3.5" />
              </Button>

              {/* Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onCopyFromTemplate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyFromTemplate();
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy from Template
                    </DropdownMenuItem>
                  )}

                  {onSaveAsTemplate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveAsTemplate();
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save as Template
                    </DropdownMenuItem>
                  )}

                  {onMarkReviewed && response.status !== 'reviewed' && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkReviewed();
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Reviewed
                    </DropdownMenuItem>
                  )}

                  {(onCopyFromTemplate || onSaveAsTemplate || onMarkReviewed) && onDelete && (
                    <DropdownMenuSeparator />
                  )}

                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Card Content - Click to View */}
        <div onClick={onView} className="p-3 space-y-2.5">
          {/* Filled By */}
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Filled by:</span>
            <span className="font-medium truncate">{filledByName}</span>
          </div>

          {/* Doctor Switch Info */}
          {response.doctor_switched_reason && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2">
              <p className="font-semibold text-amber-800">Handover:</p>
              <p className="text-amber-700 mt-0.5 line-clamp-2">{response.doctor_switched_reason}</p>
            </div>
          )}

          {/* Reviewed Badge */}
          {response.is_reviewed && response.reviewed_by_id && (
            <div className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
              <CheckCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="text-blue-700 truncate">Reviewed by {reviewedByName}</span>
            </div>
          )}

          {/* Compact Info Footer */}
          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="truncate">{formatTimeAgo(response.response_date || response.created_at)}</span>
              {hasCanvas && (
                <div className="flex items-center gap-1 text-primary">
                  <PenTool className="h-3 w-3" />
                  <span className="hidden sm:inline">Drawing</span>
                </div>
              )}
            </div>
            <span className="text-xs">{response.field_response_count || 0} fields</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
