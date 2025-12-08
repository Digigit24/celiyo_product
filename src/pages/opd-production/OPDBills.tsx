// src/pages/opd-production/OPDBills.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOPDBill } from '@/hooks/useOPDBill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, DollarSign, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { OPDBill, OPDBillListParams } from '@/types/opdBill.types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { OPDBillFormDrawer } from '@/components/OPDBillFormDrawer';

export const OPDBills: React.FC = () => {
  const navigate = useNavigate();
  const { useOPDBills, deleteBill, useOPDBillStatistics, printBill, recordBillPayment } = useOPDBill();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'paid' | 'unpaid' | 'partial' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  const queryParams: OPDBillListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    payment_status: paymentStatusFilter || undefined,
  };

  const { data: billsData, error, isLoading, mutate } = useOPDBills(queryParams);
  const { data: statistics, error: statsError } = useOPDBillStatistics();

  const bills = billsData?.results || [];
  const totalCount = billsData?.count || 0;
  const hasNext = !!billsData?.next;
  const hasPrevious = !!billsData?.previous;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (bill: OPDBill) => {
    if (window.confirm(`Delete bill ${bill.bill_number}?`)) {
      try {
        await deleteBill(bill.id);
        toast.success('Bill deleted');
        mutate();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handlePrint = async (bill: OPDBill) => {
    try {
      const result = await printBill(bill.id);
      window.open(result.pdf_url, '_blank');
      toast.success('Bill printed');
    } catch (error: any) {
      toast.error(error.message);
    }
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
        <div className="flex flex-col">
          <span className="font-medium font-mono text-sm">{bill.visit_number || `#${bill.visit}`}</span>
          <span className="text-xs text-muted-foreground">Visit ID: {bill.visit}</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      key: 'patient',
      cell: (bill) => (
        <div className="flex flex-col">
          <span className="font-medium">{bill.patient_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{bill.patient_phone}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'bill_type',
      cell: (bill) => (
        <Badge variant="secondary" className="text-xs">
          {bill.bill_type ? bill.bill_type.toUpperCase() : 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Amount',
      key: 'total_amount',
      cell: (bill) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">₹{bill.total_amount}</span>
          {parseFloat(bill.balance_amount) > 0 && (
            <span className="text-xs text-orange-600">Bal: ₹{bill.balance_amount}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Payment',
      key: 'payment_status',
      cell: (bill) => {
        const statusConfig = {
          paid: { label: 'Paid', className: 'bg-green-600' },
          partial: { label: 'Partial', className: 'bg-orange-600' },
          unpaid: { label: 'Unpaid', className: 'bg-red-600' },
        };
        const config = bill.payment_status ? statusConfig[bill.payment_status] : null;
        if (!config) {
          return (
            <Badge variant="secondary" className="bg-gray-600">
              Unknown
            </Badge>
          );
        }
        return (
          <Badge variant="default" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">OPD Bills</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage billing and payments
          </p>
        </div>
        <Button onClick={() => { setDrawerMode('create'); setSelectedBillId(null); setDrawerOpen(true); }} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Bill
        </Button>
      </div>

      {statsError && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Unable to load statistics. The bill list below is still available.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Bills</p>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.total_bills ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Collected</p>
                <p className="text-xl sm:text-2xl font-bold">₹{statistics?.received_amount ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold">₹{statistics?.balance_amount ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Unpaid</p>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.unpaid_bills ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bill number, patient..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant={paymentStatusFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentStatusFilter('')}>
                All
              </Button>
              <Button variant={paymentStatusFilter === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentStatusFilter('paid')}>
                Paid
              </Button>
              <Button variant={paymentStatusFilter === 'partial' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentStatusFilter('partial')}>
                Partial
              </Button>
              <Button variant={paymentStatusFilter === 'unpaid' ? 'default' : 'outline'} size="sm" onClick={() => setPaymentStatusFilter('unpaid')}>
                Unpaid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Bills List</CardTitle>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">{error.message}</p>
            </div>
          ) : (
            <>
              <DataTable
                rows={bills}
                isLoading={isLoading}
                columns={columns}
                getRowId={(bill) => bill.id}
                getRowLabel={(bill) => bill.bill_number}
                onView={(bill) => navigate(`/opd/billing/${bill.visit}`)}
                onEdit={(bill) => { setDrawerMode('edit'); setSelectedBillId(bill.id); setDrawerOpen(true); }}
                onDelete={handleDelete}
                emptyTitle="No bills found"
                emptySubtitle="Try adjusting your filters"
              />

              {!isLoading && bills.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {bills.length} of {totalCount} bill(s)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => setCurrentPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setCurrentPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <OPDBillFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        billId={selectedBillId}
        onSuccess={mutate}
      />
    </div>
  );
};

export default OPDBills;
