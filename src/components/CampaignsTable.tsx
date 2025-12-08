// src/components/CampaignsTable.tsx
import React from 'react';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import type { WACampaign } from '@/types/whatsappTypes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CampaignsTableProps {
  campaigns: WACampaign[];
  isLoading: boolean;
  onView?: (row: WACampaign) => void;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return iso;
  }
}

function successRate(c: WACampaign) {
  if (!c.total_recipients) return 0;
  return Math.round(((c.sent_count ?? 0) / c.total_recipients) * 100);
}

export function CampaignsTable({ campaigns, isLoading, onView }: CampaignsTableProps) {
  const columns: DataTableColumn<WACampaign>[] = [
    {
      header: 'Campaign',
      key: 'campaign',
      className: 'w-[35%]',
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.campaign_name || '(No name)'}</div>
          <div className="text-xs text-muted-foreground">ID: {row.campaign_id}</div>
        </div>
      ),
    },
    {
      header: 'Created',
      key: 'created',
      className: 'w-[18%]',
      cell: (row) => (
        <div className="text-sm">{formatDate(row.created_at)}</div>
      ),
    },
    {
      header: 'Recipients',
      key: 'total',
      className: 'w-[10%]',
      cell: (row) => <div className="text-sm">{row.total_recipients}</div>,
    },
    {
      header: 'Sent',
      key: 'sent',
      className: 'w-[10%]',
      cell: (row) => <div className="text-sm">{row.sent_count}</div>,
    },
    {
      header: 'Failed',
      key: 'failed',
      className: 'w-[10%]',
      cell: (row) => (
        <div className={cn('text-sm', (row.failed_count ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground')}>
          {row.failed_count}
        </div>
      ),
    },
    {
      header: 'Success',
      key: 'success',
      className: 'w-[17%]',
      cell: (row) => {
        const rate = successRate(row);
        const color =
          rate >= 90 ? 'bg-green-100 text-green-800' :
          rate >= 70 ? 'bg-emerald-100 text-emerald-800' :
          rate >= 40 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800';
        return (
          <Badge variant="secondary" className={cn('font-medium', color)}>
            {rate}% 
          </Badge>
        );
      },
    },
  ];

  return (
    <DataTable
      rows={campaigns}
      isLoading={isLoading}
      columns={columns}
      getRowId={(row) => row.campaign_id}
      getRowLabel={(row) => row.campaign_name || row.campaign_id}
      onView={onView}
      renderMobileCard={(row, actions) => {
        const rate = successRate(row);
        return (
          <div className="space-y-2" onClick={actions.view}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{row.campaign_name || '(No name)'}</div>
                <div className="text-xs text-muted-foreground">ID: {row.campaign_id}</div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'font-medium',
                  rate >= 90 ? 'bg-green-100 text-green-800' :
                  rate >= 70 ? 'bg-emerald-100 text-emerald-800' :
                  rate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                )}
              >
                {rate}%
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">{formatDate(row.created_at)}</div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded border p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Recipients</div>
                <div className="text-sm font-medium">{row.total_recipients}</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Sent</div>
                <div className="text-sm font-medium">{row.sent_count}</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Failed</div>
                <div className={cn('text-sm font-medium', (row.failed_count ?? 0) > 0 ? 'text-red-600' : '')}>
                  {row.failed_count}
                </div>
              </div>
            </div>
          </div>
        );
      }}
      emptyTitle="No campaigns yet"
      emptySubtitle="Create your first WhatsApp broadcast campaign"
    />
  );
}

export default CampaignsTable;