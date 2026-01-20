// src/pages/opd-production/OPDBills.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOPDBill } from '@/hooks/useOPDBill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, IndianRupee, FileText, CreditCard, AlertCircle, CheckCircle2, Clock, TrendingUp, PieChart } from 'lucide-react';
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

  // Mobile card renderer
  const renderMobileCard = (bill: OPDBill, actions: any) => {
    const statusConfig = {
      paid: { label: 'Paid', className: 'bg-green-600' },
      partial: { label: 'Partial', className: 'bg-orange-600' },
      unpaid: { label: 'Unpaid', className: 'bg-red-600' },
    };
    const config = bill.payment_status ? statusConfig[bill.payment_status] : null;

    return (
      <>
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base font-mono truncate">{bill.bill_number}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
            </p>
          </div>
          {config && (
            <Badge variant="default" className={config.className}>
              {config.label}
            </Badge>
          )}
        </div>

        {/* Patient & Visit Info */}
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-medium">{bill.patient_name || 'N/A'}</p>
          <p className="text-muted-foreground font-mono text-xs">Visit: {bill.visit_number || `#${bill.visit}`}</p>
        </div>

        {/* Amount Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total Amount</p>
            <p className="font-medium">₹{bill.total_amount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Balance</p>
            <p className={`font-medium ${parseFloat(bill.balance_amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{bill.balance_amount}
            </p>
          </div>
        </div>

        {/* Type Badge */}
        <div>
          <Badge variant="secondary" className="text-xs">
            {bill.bill_type ? bill.bill_type.toUpperCase() : 'N/A'}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {actions.view && (
            <Button size="sm" variant="outline" onClick={actions.view} className="flex-1">
              View
            </Button>
          )}
          {actions.edit && (
            <Button size="sm" variant="outline" onClick={actions.edit} className="flex-1">
              Edit
            </Button>
          )}
          {actions.askDelete && (
            <Button size="sm" variant="destructive" onClick={actions.askDelete}>
              Delete
            </Button>
          )}
        </div>
      </>
    );
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

      {/* Main Statistics Grid */}
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
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl sm:text-2xl font-bold">₹{statistics?.total_revenue ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Paid Revenue</p>
                <p className="text-xl sm:text-2xl font-bold">₹{statistics?.paid_revenue ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">₹{statistics?.pending_amount ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Paid Bills</p>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.bills_paid ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Partial</p>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.bills_partial ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Unpaid</p>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.bills_unpaid ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Bill</p>
                <p className="text-xl sm:text-2xl font-bold">₹{statistics?.average_bill_amount ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* By OPD Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue by OPD Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.by_opd_type?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {item.opd_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.count} bill{item.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="font-semibold">₹{item.revenue.toFixed(2)}</span>
                  </div>
                ))}
                {(!statistics.by_opd_type || statistics.by_opd_type.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* By Payment Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Revenue by Payment Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.by_payment_mode?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {item.payment_mode}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.count} payment{item.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                  </div>
                ))}
                {(!statistics.by_payment_mode || statistics.by_payment_mode.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                renderMobileCard={renderMobileCard}
                getRowId={(bill) => bill.id}
                getRowLabel={(bill) => bill.bill_number}
                onView={(bill) => navigate(`/opd/consultation/${bill.visit}`, { state: { activeTab: 'billing' } })}
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
