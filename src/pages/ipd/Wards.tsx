// src/pages/ipd/Wards.tsx
import { useState } from 'react';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { useIPD } from '@/hooks/useIPD';
import { Ward, WARD_TYPE_LABELS } from '@/types/ipd.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Plus, Bed as BedIcon, Building } from 'lucide-react';
import { WardFormDrawer } from '@/components/ipd/WardFormDrawer';

export default function Wards() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { useWards, deleteWard } = useIPD();
  const { data: wardsData, isLoading, error: fetchError, mutate } = useWards({ search: searchQuery });

  const wards = wardsData?.results || [];

  // Show error state if data fetch fails
  if (fetchError && !isLoading && wards.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Ward Management</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-destructive">Failed to load wards</p>
            <p className="text-sm text-muted-foreground mt-2">{fetchError.message || 'An error occurred'}</p>
            <Button className="mt-4" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Delete
  const handleDelete = async (ward: Ward) => {
    try {
      await deleteWard(ward.id);
      toast({
        title: 'Success',
        description: 'Ward deleted successfully',
      });
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ward',
        variant: 'destructive',
      });
    }
  };

  // Open Create Drawer
  const openCreateDrawer = () => {
    setSelectedWard(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const openEditDrawer = (ward: Ward) => {
    setSelectedWard(ward);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  // DataTable columns
  const columns: DataTableColumn<Ward>[] = [
    {
      header: 'Ward Name',
      key: 'name',
      sortable: true,
      filterable: true,
      accessor: (row) => row.name,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      sortable: true,
      filterable: true,
      accessor: (row) => row.type,
      cell: (row) => (
        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
          {WARD_TYPE_LABELS[row.type]}
        </span>
      ),
    },
    {
      header: 'Floor',
      key: 'floor',
      sortable: true,
      filterable: true,
      accessor: (row) => row.floor,
      cell: (row) => <span>{row.floor || '-'}</span>,
    },
    {
      header: 'Total Beds',
      key: 'total_beds',
      sortable: true,
      accessor: (row) => row.total_beds,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <BedIcon className="h-4 w-4 text-muted-foreground" />
          <span>{row.total_beds}</span>
        </div>
      ),
    },
    {
      header: 'Available',
      key: 'available_beds_count',
      sortable: true,
      accessor: (row) => row.available_beds_count || 0,
      cell: (row) => (
        <span className="text-green-600 font-medium">
          {row.available_beds_count || 0}
        </span>
      ),
    },
    {
      header: 'Occupied',
      key: 'occupied_beds_count',
      sortable: true,
      accessor: (row) => row.occupied_beds_count || 0,
      cell: (row) => (
        <span className="text-orange-600 font-medium">
          {row.occupied_beds_count || 0}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      sortable: true,
      accessor: (row) => row.is_active,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ward Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage hospital wards and their bed capacity
            </p>
          </div>
          <Button onClick={openCreateDrawer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ward
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <Input
            placeholder="Search wards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <DataTable
          rows={wards}
          isLoading={isLoading}
          columns={columns}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          onEdit={openEditDrawer}
          onDelete={handleDelete}
          renderMobileCard={(row, actions) => (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{row.name}</span>
                </div>
                {actions.dropdown}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                    {WARD_TYPE_LABELS[row.type]}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Floor:</span>
                  <span>{row.floor || '-'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Beds:</span>
                  <span>{row.total_beds}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="text-green-600 font-medium">
                    {row.available_beds_count || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Occupied:</span>
                  <span className="text-orange-600 font-medium">
                    {row.occupied_beds_count || 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      row.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}
          emptyTitle="No wards found"
          emptySubtitle="Create your first ward to get started"
        />
      </div>

      {/* Ward Form Drawer */}
      <WardFormDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        ward={selectedWard}
        mode={drawerMode}
        onSuccess={() => mutate()}
      />
    </div>
  );
}