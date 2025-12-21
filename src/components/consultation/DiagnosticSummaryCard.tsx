// src/components/consultation/DiagnosticSummaryCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Microscope, Clock, Activity, CheckCircle2, XCircle, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useNavigate } from 'react-router-dom';
import type { Requisition } from '@/types/diagnostics.types';
import { Skeleton } from '@/components/ui/skeleton';

interface DiagnosticSummaryCardProps {
  encounterType: 'visit' | 'admission';
  objectId: number;
  onOrderTests: () => void;
}

const getStatusIcon = (status: Requisition['status']) => {
    switch (status) {
        case 'Ordered':
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'Sample-Collected':
            return <Activity className="h-4 w-4 text-blue-500" />;
        case 'Report-Ready':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'Cancelled':
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return <Clock className="h-4 w-4 text-gray-500" />;
    }
};

const getStatusColor = (status: Requisition['status']) => {
    switch (status) {
        case 'Ordered': return 'bg-yellow-100 text-yellow-800';
        case 'Sample-Collected': return 'bg-blue-100 text-blue-800';
        case 'Report-Ready': return 'bg-green-100 text-green-800';
        case 'Cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}


export function DiagnosticSummaryCard({ encounterType, objectId, onOrderTests }: DiagnosticSummaryCardProps) {
  const navigate = useNavigate();
  const { useRequisitions } = useDiagnostics();

  const {
    data: requisitionsData,
    isLoading,
    error,
  } = useRequisitions({
    content_type_model: encounterType,
    object_id: objectId,
    ordering: '-created_at',
  });
  
  const requisitions = requisitionsData?.results || [];

  const handleViewReports = () => {
    navigate('/diagnostics/reports');
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-2/3" />
            </CardContent>
        </Card>
    )
  }

  if (error) {
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error Loading Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive">Could not load diagnostic orders. Please try again later.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Diagnostic Orders</CardTitle>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleViewReports}>
                <ExternalLink className="h-4 w-4" />
                View All Reports
            </Button>
            <Button size="sm" className="gap-2" onClick={onOrderTests}>
                <Plus className="h-4 w-4" />
                Order Tests
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requisitions.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <Microscope className="mx-auto h-10 w-10 mb-2" />
            <p>No diagnostic tests ordered for this encounter yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {requisitions.map((req) => (
                <div key={req.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-primary">{req.requisition_id}</p>
                        <Badge variant="secondary" className={getStatusColor(req.status)}>
                            {req.status.replace('-', ' ')}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        {req.investigation_orders.map(order => (
                             <div key={order.id} className="text-sm flex items-center justify-between p-1 rounded-md bg-background">
                                <span>{order.investigation_name}</span>
                                {getStatusIcon(req.status)}
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground pt-1">
                        Ordered on {new Date(req.created_at).toLocaleDateString()}
                    </div>
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}