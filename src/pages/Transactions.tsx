// src/pages/Transactions.tsx
import React, { useState } from 'react';
import { usePayment } from '@/hooks/usePayment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  Search,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { Transaction } from '@/types/payment.types';
import { format } from 'date-fns';

export const Transactions: React.FC = () => {
  const {
    useTransactions,
    useTransactionStatistics,
  } = usePayment();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Build query params
  const queryParams = {
    page: currentPage,
    search: searchTerm || undefined,
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
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  // Transaction type badge color
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage and track all financial transactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.overall_stats.total_payments.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.overall_stats.total_expenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Expenses paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.overall_stats.total_transactions}
              </div>
              <p className="text-xs text-muted-foreground">
                All time count
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.overall_stats.total_amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total transaction value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            View and manage all financial transactions ({totalCount} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Loading State */}
          {transactionsLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {transactionsError && (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load transactions</p>
              <p className="text-sm text-muted-foreground mt-2">
                {transactionsError.message}
              </p>
            </div>
          )}

          {/* Transactions List */}
          {!transactionsLoading && !transactionsError && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No transactions found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Try adjusting your search'
                      : 'Get started by creating your first transaction'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{transaction.transaction_number}</p>
                            {getTransactionTypeBadge(transaction.transaction_type)}
                            {getPaymentMethodBadge(transaction.payment_method)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {transaction.description || 'No description'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.category.name}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-lg">
                            ₹{parseFloat(transaction.amount).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                          </p>
                          {transaction.is_reconciled && (
                            <Badge variant="outline" className="mt-1">
                              Reconciled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {transactions.length} of {totalCount} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!transactionsData?.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
