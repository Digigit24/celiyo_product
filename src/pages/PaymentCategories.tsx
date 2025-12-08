// src/pages/PaymentCategories.tsx
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
  Package,
} from 'lucide-react';

export const PaymentCategories: React.FC = () => {
  const {
    usePaymentCategories,
  } = usePayment();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Build query params
  const queryParams = {
    page: currentPage,
    search: searchTerm || undefined,
  };

  // Fetch categories
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = usePaymentCategories(queryParams);

  const categories = categoriesData?.results || [];
  const totalCount = categoriesData?.count || 0;

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Category type badge color
  const getCategoryTypeBadge = (type: string) => {
    switch (type) {
      case 'income':
        return <Badge className="bg-green-500">Income</Badge>;
      case 'expense':
        return <Badge className="bg-red-500">Expense</Badge>;
      case 'refund':
        return <Badge className="bg-orange-500">Refund</Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-500">Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Categories</h1>
          <p className="text-muted-foreground">
            Manage categories for financial transactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Organize your transactions with categories ({totalCount} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {categoriesLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {categoriesError && (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load categories</p>
            </div>
          )}

          {/* Categories Grid */}
          {!categoriesLoading && !categoriesError && (
            <div className="space-y-4">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Try adjusting your search'
                      : 'Get started by creating your first category'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card
                      key={category.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {getCategoryTypeBadge(category.category_type)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {category.description || 'No description'}
                        </p>
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
                Showing {categories.length} of {totalCount} categories
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
                  disabled={!categoriesData?.next}
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

export default PaymentCategories;
