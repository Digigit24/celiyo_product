// src/components/patient-drawer/PatientBillingHistory.tsx
import { useState } from 'react';
import { useOPDBill } from '@/hooks/useOPDBill';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { OPDBill } from '@/types/opdBill.types';
import { Loader2, Eye, Calendar, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface PatientBillingHistoryProps {
  patientId: number;
}

export default function PatientBillingHistory({ patientId }: PatientBillingHistoryProps) {
  const { useOPDBills, useOPDBillStatistics } = useOPDBill();
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const {
    data: billsData,
    error: billsError,
    isLoading: billsLoading,
  } = useOPDBills({
    patient: patientId,
    ordering: '-bill_date',
    page: currentPage,
    page_size: 10,
  });

  const bills = billsData?.results || [];
  const totalCount = billsData?.count || 0;
  const hasNext = !!billsData?.next;
  const hasPrevious = !!billsData?.previous;

  // Calculate summary stats from bills
  const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || '0'), 0);
  const receivedAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.received_amount || '0'), 0);
  const balanceAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.balance_amount || '0'), 0);

  const paymentStatusConfig = {
    unpaid: { label: 'Unpaid', className: 'bg-red-600' },
    partial: { label: 'Partial', className: 'bg-orange-600' },
    paid: { label: 'Paid', className: 'bg-green-600' },
  };

  const billTypeConfig = {
    hospital: 'Hospital',
    consultation: 'Consultation',
    procedure: 'Procedure',
  };

  const columns: DataTableColumn<OPDBill>[] = [
    {
      header: 'Bill',
      key: 'bill_number',
      cell: (bill) => (
        <div className="flex flex-col">
          <span className="font-medium font-mono text-sm">{bill.bill_number}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
          </span>
        </div>
      ),
    },
    {
      header: 'Visit',
      key: 'visit',
      cell: (bill) => (
        <div className="text-sm">
          {bill.visit_number ? (
            <div className="font-mono font-medium">{bill.visit_number}</div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'bill_type',
      cell: (bill) => (
        <Badge variant="outline">
          {bill.bill_type ? billTypeConfig[bill.bill_type] : 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Doctor',
      key: 'doctor',
      cell: (bill) => (
        <div className="text-sm">
          <span className="font-medium">{bill.doctor_name || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Amount',
      key: 'total_amount',
      cell: (bill) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold">₹{parseFloat(bill.total_amount).toLocaleString()}</span>
          {parseFloat(bill.balance_amount) > 0 && (
            <span className="text-xs text-red-600">Bal: ₹{parseFloat(bill.balance_amount).toLocaleString()}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'payment_status',
      cell: (bill) => {
        const config = bill.payment_status ? paymentStatusConfig[bill.payment_status] : null;
        if (!config) {
          return <Badge variant="secondary" className="bg-gray-600">Unknown</Badge>;
        }
        return (
          <Badge variant="default" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
  ];

  const renderMobileCard = (bill: OPDBill, actions: any) => {
    const statusConfig = bill.payment_status ? paymentStatusConfig[bill.payment_status] : null;

    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base font-mono">{bill.bill_number}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
            </p>
          </div>
          {statusConfig && (
            <Badge variant="default" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          )}
        </div>

        {/* Bill Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline">
              {bill.bill_type ? billTypeConfig[bill.bill_type] : 'N/A'}
            </Badge>
          </div>
          {bill.visit_number && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Visit:</span>
              <span className="font-mono font-medium">{bill.visit_number}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Doctor:</span>
            <span className="font-medium">{bill.doctor_name || 'N/A'}</span>
          </div>
        </div>

        {/* Amount Details */}
        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between font-semibold">
            <span>Total Amount:</span>
            <span>₹{parseFloat(bill.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Received:</span>
            <span className="text-green-600">₹{parseFloat(bill.received_amount).toLocaleString()}</span>
          </div>
          {parseFloat(bill.balance_amount) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Balance:</span>
              <span className="text-red-600">₹{parseFloat(bill.balance_amount).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action */}
        {actions.view && (
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={actions.view} className="w-full">
              <Eye className="h-4 w-4 mr-1" />
              View Bill
            </Button>
          </div>
        )}
      </>
    );
  };

  const handleView = (bill: OPDBill) => {
    if (bill.visit) {
      navigate(`/opd/billing/${bill.visit}`);
    }
  };

  if (billsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load billing history</p>
            <p className="text-sm text-muted-foreground mt-2">{billsError.message}</p>
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
            <div className="text-sm text-muted-foreground">Total Bills</div>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-xl font-bold">₹{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Received</div>
            <div className="text-xl font-bold text-green-600">₹{receivedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Balance Due</div>
            <div className="text-xl font-bold text-red-600">₹{balanceAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          {billsLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <DataTable
                rows={bills}
                isLoading={billsLoading}
                columns={columns}
                renderMobileCard={renderMobileCard}
                getRowId={(bill) => bill.id}
                getRowLabel={(bill) => bill.bill_number}
                onView={handleView}
                emptyTitle="No bills found"
                emptySubtitle="This patient has no billing history"
              />

              {/* Pagination */}
              {!billsLoading && bills.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {bills.length} of {totalCount} bill(s)
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
