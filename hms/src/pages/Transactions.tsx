// src/pages/Transactions.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { usePayment } from '@/hooks/usePayment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import type { RowActions } from '@/components/DataTable';
import TransactionDetailsDrawer from '@/components/transaction-drawer/TransactionDetailsDrawer';
import {
  Plus,
  CreditCard,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { Transaction } from '@/types/payment.types';
import { format } from 'date-fns';
import { toast } from 'sonner';

type DrawerMode = 'view' | 'edit' | 'create';

export const Transactions: React.FC = () => {
  const {
    useTransactions,
    useTransactionStatistics,
    deleteTransaction,
  } = usePayment();

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');

  // Build query params
  const queryParams = {
    page: currentPage,
    page_size: 20,
    ordering: '-created_at',
  };

  // Fetch transactions
  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
    mutate: mutateTransactions
  } = useTransactions(queryParams);

  // Fetch statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useTransactionStatistics();

  const transactions = transactionsData?.results || [];
  const totalCount = transactionsData?.count || 0;

  // Handlers
  const handleCreateTransaction = useCallback(() => {
    setSelectedTransactionId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  }, []);

  const handleViewTransaction = useCallback((transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
    setDrawerMode('view');
    setDrawerOpen(true);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  }, []);

  const handleDeleteTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        await deleteTransaction(transaction.id);
        toast.success(`Transaction "${transaction.transaction_number}" deleted successfully`);
        mutateTransactions();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete transaction');
        throw error;
      }
    },
    [deleteTransaction, mutateTransactions]
  );

  const handleDrawerSuccess = useCallback(() => {
    mutateTransactions();
  }, [mutateTransactions]);

  const handleModeChange = useCallback((mode: DrawerMode) => {
    setDrawerMode(mode);
  }, []);

  // Transaction type badge
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'payment':
        return <Badge className="bg-green-500">Payment</Badge>;
      case 'refund':
        return <Badge className="bg-orange-500">Refund</Badge>;
      case 'expense':
        return <Badge className="bg-red-500">Expense</Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-500">Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Payment method badge
  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return null;
    return <Badge variant="outline">{method.toUpperCase()}</Badge>;
  };

  // Column definitions
  const columns: DataTableColumn<Transaction>[] = useMemo(
    () => [
      {
        header: 'Transaction #',
        key: 'transaction_number',
        cell: (transaction) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{transaction.transaction_number}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
            </span>
          </div>
        ),
        className: 'w-[180px]',
        sortable: true,
        filterable: true,
        accessor: (transaction) => transaction.transaction_number,
      },
      {
        header: 'Type',
        key: 'type',
        cell: (transaction) => (
          <div className="flex flex-col gap-1">
            {getTransactionTypeBadge(transaction.transaction_type)}
            {transaction.payment_method && getPaymentMethodBadge(transaction.payment_method)}
          </div>
        ),
        sortable: true,
        filterable: true,
        accessor: (transaction) => transaction.transaction_type,
      },
      {
        header: 'Category',
        key: 'category',
        cell: (transaction) => (
          <div className="flex flex-col">
            <span className="font-medium">{transaction.category.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {transaction.category.category_type}
            </span>
          </div>
        ),
        sortable: true,
        filterable: true,
        accessor: (transaction) => transaction.category.name,
      },
      {
        header: 'Amount',
        key: 'amount',
        cell: (transaction) => (
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">
              ₹{parseFloat(transaction.amount).toLocaleString()}
            </span>
          </div>
        ),
        className: 'text-right',
        sortable: true,
        filterable: false,
        accessor: (transaction) => parseFloat(transaction.amount),
      },
      {
        header: 'Description',
        key: 'description',
        cell: (transaction) => (
          <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
            {transaction.description || '-'}
          </span>
        ),
        sortable: false,
        filterable: true,
        accessor: (transaction) => transaction.description || '',
      },
      {
        header: 'Status',
        key: 'status',
        cell: (transaction) => (
          <div>
            {transaction.is_reconciled ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Reconciled
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Pending
              </Badge>
            )}
          </div>
        ),
        sortable: true,
        filterable: false,
        accessor: (transaction) => (transaction.is_reconciled ? 'reconciled' : 'pending'),
      },
    ],
    []
  );

  // Mobile card renderer
  const renderMobileCard = (transaction: Transaction, actions: RowActions<Transaction>) => (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base">{transaction.transaction_number}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {getTransactionTypeBadge(transaction.transaction_type)}
        </div>
      </div>

      {/* Category & Payment Method */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{transaction.category.name}</span>
        {transaction.payment_method && getPaymentMethodBadge(transaction.payment_method)}
      </div>

      {/* Amount */}
      <div className="flex items-center gap-1.5">
        <IndianRupee className="h-4 w-4 text-muted-foreground" />
        <span className="text-lg font-semibold">
          ₹{parseFloat(transaction.amount).toLocaleString()}
        </span>
      </div>

      {/* Description */}
      {transaction.description && (
        <p className="text-sm text-muted-foreground">{transaction.description}</p>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        {transaction.is_reconciled ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Reconciled
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">
          {format(new Date(transaction.updated_at), 'MMM dd, yyyy h:mm a')}
        </span>
        <div className="flex gap-2">
          {actions.edit && (
            <Button variant="outline" size="sm" onClick={actions.edit}>
              Edit
            </Button>
          )}
          {actions.view && (
            <Button variant="default" size="sm" onClick={actions.view}>
              View
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage and track all financial transactions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutateTransactions()}
            disabled={transactionsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${transactionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateTransaction} size="default" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    ₹{stats.overall_stats.total_payments.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    ₹{stats.overall_stats.total_expenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {stats.overall_stats.total_transactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Net Amount</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    ₹{stats.overall_stats.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            rows={transactions}
            isLoading={transactionsLoading}
            columns={columns}
            renderMobileCard={renderMobileCard}
            getRowId={(transaction) => transaction.id}
            getRowLabel={(transaction) => transaction.transaction_number}
            onView={handleViewTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            emptyTitle="No transactions found"
            emptySubtitle="Get started by creating your first transaction"
          />

          {/* Pagination */}
          {!transactionsLoading && transactionsData && transactionsData.count > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {transactions.length} of {totalCount} transaction(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!transactionsData.previous}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!transactionsData.next}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Drawer */}
      <TransactionDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        transactionId={selectedTransactionId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={(id) => {
          // Already handled in handleDeleteTransaction
        }}
        onModeChange={handleModeChange}
      />
    </div>
  );
};

export default Transactions;
