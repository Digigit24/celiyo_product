// src/pages/opd-production/ProcedureBills.tsx
import React, { useState } from 'react';
import { useProcedureBill } from '@/hooks/useProcedureBill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, DollarSign, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { ProcedureBill, ProcedureBillListParams } from '@/types/procedureBill.types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ProcedureBillFormDrawer } from '@/components/ProcedureBillFormDrawer';

export const ProcedureBills: React.FC = () => {
  const { useProcedureBills, deleteBill, printBill } = useProcedureBill();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'paid' | 'unpaid' | 'partial' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  const queryParams: ProcedureBillListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    payment_status: paymentStatusFilter || undefined,
  };

  const { data: billsData, error, isLoading, mutate } = useProcedureBills(queryParams);

  const bills = billsData?.results || [];
  const totalCount = billsData?.count || 0;
  const hasNext = !!billsData?.next;
  const hasPrevious = !!billsData?.previous;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (bill: ProcedureBill) => {
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

  const handlePrint = async (bill: ProcedureBill) => {
    try {
      const result = await printBill(bill.id);
      window.open(result.pdf_url, '_blank');
      toast.success('Bill printed');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const columns: DataTableColumn<ProcedureBill>[] = [
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
      header: 'Doctor',
      key: 'doctor',
      cell: (bill) => (
        <span className="text-sm">{bill.doctor_name || 'N/A'}</span>
      ),
    },
    {
      header: 'Items',
      key: 'items',
      cell: (bill) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium">{bill.items.length} items</span>
          {bill.items.slice(0, 2).map((item, idx) => (
            <span key={idx} className="text-muted-foreground truncate max-w-xs">
              • {item.particular_name || `Procedure #${item.procedure}`} x{item.quantity}
            </span>
          ))}
          {bill.items.length > 2 && (
            <span className="text-muted-foreground">+{bill.items.length - 2} more</span>
          )}
        </div>
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
        const config = statusConfig[bill.payment_status];
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
          <h1 className="text-2xl sm:text-3xl font-bold">Procedure Bills</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage procedure billing and payments
          </p>
        </div>
        <Button onClick={() => { setDrawerMode('create'); setSelectedBillId(null); setDrawerOpen(true); }} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Bill
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Bills</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
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
                <p className="text-xl sm:text-2xl font-bold">
                  ₹{bills.reduce((sum, b) => sum + parseFloat(b.received_amount || '0'), 0).toFixed(0)}
                </p>
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
                <p className="text-xl sm:text-2xl font-bold">
                  ₹{bills.reduce((sum, b) => sum + parseFloat(b.balance_amount || '0'), 0).toFixed(0)}
                </p>
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
                <p className="text-xl sm:text-2xl font-bold">
                  {bills.filter(b => b.payment_status === 'unpaid').length}
                </p>
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
                onView={(bill) => handlePrint(bill)}
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
      <ProcedureBillFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        billId={selectedBillId}
        onSuccess={mutate}
      />
    </div>
  );
};

export default ProcedureBills;
