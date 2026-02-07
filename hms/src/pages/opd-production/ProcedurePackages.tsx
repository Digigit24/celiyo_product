// src/pages/opd-production/ProcedurePackages.tsx
import React, { useState } from 'react';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, Package, TrendingDown, CheckCircle } from 'lucide-react';
import { ProcedurePackage, ProcedurePackageListParams } from '@/types/procedurePackage.types';
import { toast } from 'sonner';
import { ProcedurePackageFormDrawer } from '@/components/ProcedurePackageFormDrawer';

export const ProcedurePackages: React.FC = () => {
  const { useProcedurePackages, deletePackage } = useProcedurePackage();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  const queryParams: ProcedurePackageListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    is_active: activeFilter,
  };

  const { data: packagesData, error, isLoading, mutate } = useProcedurePackages(queryParams);

  const packages = packagesData?.results || [];
  const totalCount = packagesData?.count || 0;
  const hasNext = !!packagesData?.next;
  const hasPrevious = !!packagesData?.previous;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (pkg: ProcedurePackage) => {
    if (window.confirm(`Delete package ${pkg.name}?`)) {
      try {
        await deletePackage(pkg.id);
        toast.success('Package deleted');
        mutate();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const columns: DataTableColumn<ProcedurePackage>[] = [
    {
      header: 'Package',
      key: 'name',
      cell: (pkg) => (
        <div className="flex flex-col">
          <span className="font-medium">{pkg.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{pkg.code}</span>
        </div>
      ),
    },
    {
      header: 'Procedures',
      key: 'procedures',
      cell: (pkg) => {
        const count = pkg.procedures?.length ?? pkg.procedure_count ?? 0;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium">{count} procedure{count !== 1 ? 's' : ''}</span>
            {pkg.procedures && pkg.procedures.length > 0 && (
              <>
                {pkg.procedures.slice(0, 2).map((proc, idx) => (
                  <span key={idx} className="text-muted-foreground truncate max-w-xs">
                    • {proc.name}
                  </span>
                ))}
                {pkg.procedures.length > 2 && (
                  <span className="text-muted-foreground">+{pkg.procedures.length - 2} more</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      header: 'Pricing',
      key: 'pricing',
      cell: (pkg) => (
        <div className="flex flex-col text-sm">
          <span className="text-muted-foreground line-through">₹{pkg.total_charge}</span>
          <span className="font-medium text-green-600">₹{pkg.discounted_charge}</span>
          {pkg.discount_percent && (
            <Badge variant="outline" className="text-xs w-fit bg-green-50 text-green-700 border-green-200">
              {parseFloat(pkg.discount_percent).toFixed(1)}% off
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Savings',
      key: 'savings_amount',
      cell: (pkg) => {
        const savings = pkg.savings_amount || pkg.savings;
        return (
          <span className="font-medium text-green-600">
            {savings ? `₹${savings}` : 'N/A'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'is_active',
      cell: (pkg) => (
        <Badge variant={pkg.is_active ? 'default' : 'secondary'} className={pkg.is_active ? 'bg-green-600' : ''}>
          {pkg.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Procedure Packages</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage procedure bundles and discounts
          </p>
        </div>
        <Button onClick={() => { setDrawerMode('create'); setSelectedPackageId(null); setDrawerOpen(true); }} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Package
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Packages</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {packages.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Discount</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {packages.length > 0
                    ? (packages.reduce((sum, p) => sum + parseFloat(p.discount_percent || '0'), 0) / packages.length).toFixed(1)
                    : '0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Savings</p>
                <p className="text-xl sm:text-2xl font-bold">
                  ₹{packages.reduce((sum, p) => sum + parseFloat(p.savings_amount || p.savings || '0'), 0).toFixed(0)}
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
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeFilter === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(undefined)}
              >
                All Status
              </Button>
              <Button
                variant={activeFilter === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(true)}
              >
                Active
              </Button>
              <Button
                variant={activeFilter === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(false)}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Packages List</CardTitle>
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
                rows={packages}
                isLoading={isLoading}
                columns={columns}
                getRowId={(pkg) => pkg.id}
                getRowLabel={(pkg) => pkg.name}
                onView={(pkg) => { setDrawerMode('view'); setSelectedPackageId(pkg.id); setDrawerOpen(true); }}
                onEdit={(pkg) => { setDrawerMode('edit'); setSelectedPackageId(pkg.id); setDrawerOpen(true); }}
                onDelete={handleDelete}
                emptyTitle="No packages found"
                emptySubtitle="Try adjusting your filters"
              />

              {!isLoading && packages.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {packages.length} of {totalCount} package(s)
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
      <ProcedurePackageFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        packageId={selectedPackageId}
        onSuccess={mutate}
      />
    </div>
  );
};

export default ProcedurePackages;
