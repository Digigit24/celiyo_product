// src/pages/AccountingPeriods.tsx
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
  TrendingUp,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';
import { format } from 'date-fns';

export const AccountingPeriods: React.FC = () => {
  const {
    useAccountingPeriods,
  } = usePayment();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Build query params
  const queryParams = {
    page: currentPage,
    search: searchTerm || undefined,
  };

  // Fetch accounting periods
  const {
    data: periodsData,
    error: periodsError,
    isLoading: periodsLoading,
  } = useAccountingPeriods(queryParams);

  const periods = periodsData?.results || [];
  const totalCount = periodsData?.count || 0;

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Period type badge color
  const getPeriodTypeBadge = (type: string) => {
    switch (type) {
      case 'monthly':
        return <Badge variant="outline">Monthly</Badge>;
      case 'quarterly':
        return <Badge variant="outline">Quarterly</Badge>;
      case 'annual':
        return <Badge variant="outline">Annual</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Periods</h1>
          <p className="text-muted-foreground">
            Manage financial reporting periods
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Period
        </Button>
      </div>

      {/* Periods List */}
      <Card>
        <CardHeader>
          <CardTitle>All Periods</CardTitle>
          <CardDescription>
            View and manage accounting periods ({totalCount} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search periods..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {periodsLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {periodsError && (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load accounting periods</p>
            </div>
          )}

          {/* Periods List */}
          {!periodsLoading && !periodsError && (
            <div className="space-y-4">
              {periods.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No periods found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Try adjusting your search'
                      : 'Get started by creating your first accounting period'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {periods.map((period) => (
                    <Card
                      key={period.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{period.name}</CardTitle>
                            {getPeriodTypeBadge(period.period_type)}
                            {period.is_closed ? (
                              <Badge className="bg-red-500">
                                <Lock className="mr-1 h-3 w-3" />
                                Closed
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500">
                                <Unlock className="mr-1 h-3 w-3" />
                                Open
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(period.start_date), 'MMM dd, yyyy')} - {format(new Date(period.end_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Income</p>
                            <p className="text-lg font-semibold text-green-600">
                              ₹{parseFloat(period.total_income).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Expenses</p>
                            <p className="text-lg font-semibold text-red-600">
                              ₹{parseFloat(period.total_expenses).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Net Profit</p>
                            <p className={`text-lg font-semibold ${parseFloat(period.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{parseFloat(period.net_profit).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {periods.length} of {totalCount} periods
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
                  disabled={!periodsData?.next}
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

export default AccountingPeriods;
