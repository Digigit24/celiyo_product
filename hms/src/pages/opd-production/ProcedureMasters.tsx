// src/pages/opd-production/ProcedureMasters.tsx
import React, { useState } from 'react';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { ProcedureMaster, ProcedureMasterListParams, ProcedureCategory } from '@/types/procedureMaster.types';
import { toast } from 'sonner';
import { ProcedureMasterFormDrawer } from '@/components/ProcedureMasterFormDrawer';

export const ProcedureMasters: React.FC = () => {
  const { useProcedureMasters, deleteProcedure } = useProcedureMaster();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProcedureCategory | ''>('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProcedureId, setSelectedProcedureId] = useState<number | null>(null);

  const queryParams: ProcedureMasterListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    category: categoryFilter || undefined,
    is_active: activeFilter,
  };

  const { data: proceduresData, error, isLoading, mutate } = useProcedureMasters(queryParams);

  const procedures = proceduresData?.results || [];
  const totalCount = proceduresData?.count || 0;
  const hasNext = !!proceduresData?.next;
  const hasPrevious = !!proceduresData?.previous;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (procedure: ProcedureMaster) => {
    if (window.confirm(`Delete procedure ${procedure.name}?`)) {
      try {
        await deleteProcedure(procedure.id);
        toast.success('Procedure deleted');
        mutate();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const getCategoryColor = (category: ProcedureCategory) => {
    const colors: Record<ProcedureCategory, string> = {
      laboratory: 'bg-blue-600',
      radiology: 'bg-purple-600',
      cardiology: 'bg-red-600',
      pathology: 'bg-green-600',
      ultrasound: 'bg-indigo-600',
      ct_scan: 'bg-orange-600',
      mri: 'bg-pink-600',
      ecg: 'bg-yellow-600',
      xray: 'bg-cyan-600',
      other: 'bg-gray-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  const columns: DataTableColumn<ProcedureMaster>[] = [
    {
      header: 'Procedure',
      key: 'name',
      cell: (procedure) => (
        <div className="flex flex-col">
          <span className="font-medium">{procedure.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{procedure.code}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      cell: (procedure) => (
        <Badge variant="default" className={`${getCategoryColor(procedure.category)} text-xs`}>
          {procedure.category.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      cell: (procedure) => (
        <div className="max-w-md">
          <p className="text-sm truncate">{procedure.description || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Charge',
      key: 'default_charge',
      cell: (procedure) => (
        <span className="font-medium">₹{procedure.default_charge}</span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      cell: (procedure) => (
        <Badge variant={procedure.is_active ? 'default' : 'secondary'} className={procedure.is_active ? 'bg-green-600' : ''}>
          {procedure.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Procedure Masters</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage procedure catalog and pricing
          </p>
        </div>
        <Button onClick={() => { setDrawerMode('create'); setSelectedProcedureId(null); setDrawerOpen(true); }} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Procedure
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Procedures</p>
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
                  {procedures.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Inactive</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {procedures.filter(p => !p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Categories</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {new Set(procedures.map(p => p.category)).size}
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
            <CardTitle className="text-lg">Procedures List</CardTitle>
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
                rows={procedures}
                isLoading={isLoading}
                columns={columns}
                getRowId={(procedure) => procedure.id}
                getRowLabel={(procedure) => procedure.name}
                onView={(procedure) => { setDrawerMode('view'); setSelectedProcedureId(procedure.id); setDrawerOpen(true); }}
                onEdit={(procedure) => { setDrawerMode('edit'); setSelectedProcedureId(procedure.id); setDrawerOpen(true); }}
                onDelete={handleDelete}
                emptyTitle="No procedures found"
                emptySubtitle="Try adjusting your filters"
              />

              {!isLoading && procedures.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {procedures.length} of {totalCount} procedure(s)
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
      <ProcedureMasterFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        procedureId={selectedProcedureId}
        onSuccess={mutate}
      />
    </div>
  );
};

export default ProcedureMasters;
