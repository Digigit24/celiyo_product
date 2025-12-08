// src/components/KanbanCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar,
  GripVertical,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Lead, PriorityEnum } from '@/types/crmTypes';

interface KanbanCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  lead,
  onView,
  isDragging = false,
  dragHandleProps
}) => {
  // Priority badge helper
  const getPriorityBadge = (priority: PriorityEnum) => {
    const variants = {
      LOW: 'bg-gray-100 text-gray-800 border-gray-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      HIGH: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge variant="outline" className={`text-xs ${variants[priority]}`}>
        {priority}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount?: string, currency?: string) => {
    if (!amount) return null;
    const formatted = parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${currency || '$'}${formatted}`;
  };

  return (
    <Card 
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''}
        group
      `}
      onClick={() => onView(lead)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with drag handle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary">
              {lead.name}
            </h3>
            {lead.title && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lead.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getPriorityBadge(lead.priority)}
            <div 
              {...dragHandleProps}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Company */}
        {lead.company && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Value */}
        {lead.value_amount && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <DollarSign className="h-3 w-3 flex-shrink-0" />
            <span>{formatCurrency(lead.value_amount, lead.value_currency)}</span>
          </div>
        )}

        {/* Next Follow-up */}
        {lead.next_follow_up_at && (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>
              Follow-up {formatDistanceToNow(new Date(lead.next_follow_up_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-muted/50">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onView(lead);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};