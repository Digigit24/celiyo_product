// src/components/patient-drawer/PatientVisitHistory.tsx
import { useState } from 'react';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { OpdVisit } from '@/types/opdVisit.types';
import { Loader2, Eye, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface PatientVisitHistoryProps {
  patientId: number;
  onViewVisit?: (visitId: number) => void;
}

export default function PatientVisitHistory({ patientId, onViewVisit }: PatientVisitHistoryProps) {
  const { useOpdVisits } = useOpdVisit();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: visitsData,
    error: visitsError,
    isLoading: visitsLoading,
  } = useOpdVisits({
    patient_id: patientId,
    ordering: '-visit_date,-visit_time',
    page: currentPage,
    page_size: 10,
  });

  const visits = visitsData?.results || [];
  const totalCount = visitsData?.count || 0;
  const hasNext = !!visitsData?.next;
  const hasPrevious = !!visitsData?.previous;

  const statusConfig = {
    waiting: { label: 'Waiting', className: 'bg-orange-600' },
    in_consultation: { label: 'In Consultation', className: 'bg-blue-600' },
    in_progress: { label: 'In Progress', className: 'bg-blue-600' },
    completed: { label: 'Completed', className: 'bg-green-600' },
    cancelled: { label: 'Cancelled', className: 'bg-red-600' },
    no_show: { label: 'No Show', className: 'bg-gray-600' },
  };

  const visitTypeConfig = {
    new: { label: 'New Visit', className: 'bg-purple-100 text-purple-800' },
    follow_up: { label: 'Follow-up', className: 'bg-blue-100 text-blue-800' },
    emergency: { label: 'Emergency', className: 'bg-red-100 text-red-800' },
    referral: { label: 'Referral', className: 'bg-orange-100 text-orange-800' },
  };

  const columns: DataTableColumn<OpdVisit>[] = [
    {
      header: 'Visit',
      key: 'visit_number',
      cell: (visit) => {
        const visitDateTime = visit.visit_time
          ? `${visit.visit_date}T${visit.visit_time}`
          : visit.visit_date;
        const dateFormat = visit.visit_time ? 'MMM dd, yyyy h:mm a' : 'MMM dd, yyyy';

        return (
          <div className="flex flex-col">
            <span className="font-medium font-mono text-sm">{visit.visit_number}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(visitDateTime), dateFormat)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Doctor',
      key: 'doctor',
      cell: (visit) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{visit.doctor_details?.full_name || visit.doctor_name || 'N/A'}</span>
          {visit.doctor_details?.specialties && visit.doctor_details.specialties.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {visit.doctor_details.specialties.map((s) => s.name).join(', ')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'visit_type',
      cell: (visit) => {
        const config = visitTypeConfig[visit.visit_type];
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      cell: (visit) => {
        const config = statusConfig[visit.status];
        return (
          <Badge variant="default" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Chief Complaint',
      key: 'chief_complaint',
      cell: (visit) => (
        <div className="text-sm max-w-xs truncate">
          {visit.chief_complaint || <span className="text-muted-foreground">N/A</span>}
        </div>
      ),
    },
    {
      header: 'Amount',
      key: 'total_amount',
      cell: (visit) => (
        <div className="text-sm font-medium">₹{parseFloat(visit.total_amount).toLocaleString()}</div>
      ),
    },
  ];

  const renderMobileCard = (visit: OpdVisit, actions: any) => {
    const statusConf = statusConfig[visit.status];
    const typeConf = visitTypeConfig[visit.visit_type];

    const visitDateTime = visit.visit_time
      ? `${visit.visit_date}T${visit.visit_time}`
      : visit.visit_date;
    const dateFormat = visit.visit_time ? 'MMM dd, yyyy h:mm a' : 'MMM dd, yyyy';

    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base font-mono">{visit.visit_number}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(visitDateTime), dateFormat)}
            </p>
          </div>
          <Badge variant="default" className={statusConf.className}>
            {statusConf.label}
          </Badge>
        </div>

        {/* Doctor Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{visit.doctor_details?.full_name || visit.doctor_name || 'N/A'}</span>
        </div>

        {/* Visit Type & Chief Complaint */}
        <div className="space-y-2">
          <Badge variant="outline" className={typeConf.className}>
            {typeConf.label}
          </Badge>
          {visit.chief_complaint && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="line-clamp-2">{visit.chief_complaint}</span>
            </div>
          )}
        </div>

        {/* Amount & Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Amount: </span>
            <span className="font-semibold">₹{parseFloat(visit.total_amount).toLocaleString()}</span>
          </div>
          {actions.view && (
            <Button size="sm" variant="outline" onClick={actions.view}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
        </div>
      </>
    );
  };

  const handleView = (visit: OpdVisit) => {
    onViewVisit?.(visit.id);
  };

  if (visitsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load visit history</p>
            <p className="text-sm text-muted-foreground mt-2">{visitsError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Visits</div>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {visits.filter((v) => v.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-orange-600">
              {visits.filter((v) => ['waiting', 'in_consultation', 'in_progress'].includes(v.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Last Visit</div>
            <div className="text-sm font-medium">
              {visits.length > 0 ? format(new Date(visits[0].visit_date), 'MMM dd, yyyy') : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits Table */}
      <Card>
        <CardContent className="p-0">
          {visitsLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <DataTable
                rows={visits}
                isLoading={visitsLoading}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(visit) => visit.id}
                getRowLabel={(visit) => visit.visit_number}
                onView={handleView}
                emptyTitle="No visits found"
                emptySubtitle="This patient has no visit history"
              />

              {/* Pagination */}
              {!visitsLoading && visits.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {visits.length} of {totalCount} visit(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevious}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
