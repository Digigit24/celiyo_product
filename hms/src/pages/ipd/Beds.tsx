// src/pages/ipd/Beds.tsx
import { useMemo, useState } from 'react';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { useIPD } from '@/hooks/useIPD';
import { Bed, BED_TYPE_LABELS, BED_STATUS_LABELS } from '@/types/ipd.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Plus, Bed as BedIcon, Wind, Activity } from 'lucide-react';
import { BedFormDrawer } from '@/components/ipd/BedFormDrawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export default function Beds() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState<number | undefined>(undefined);

  const { useBeds, useWards, deleteBed } = useIPD();
  const { data: bedsData, isLoading, error: fetchError, mutate } = useBeds({
    search: searchQuery,
    ward: wardFilter,
  });
  const { data: wardsData } = useWards();

  const beds = bedsData?.results || [];
  const wards = wardsData?.results || wardsData || [];

  // Show error state if data fetch fails
  if (fetchError && !isLoading && beds.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Bed Management</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-destructive">Failed to load beds</p>
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
  const handleDelete = async (bed: Bed) => {
    try {
      await deleteBed(bed.id);
      toast({
        title: 'Success',
        description: 'Bed deleted successfully',
      });
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bed',
        variant: 'destructive',
      });
    }
  };

  // Open Create Drawer
  const openCreateDrawer = () => {
    setSelectedBed(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const openEditDrawer = (bed: Bed) => {
    setSelectedBed(bed);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  // Stats
  const occupancyStats = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter((b) => b.status === 'occupied').length;
    const available = beds.filter((b) => b.status === 'available').length;
    const others = total - occupied - available;

    const wardCounts = beds.reduce<Record<string, { total: number; occupied: number }>>(
      (acc, bed) => {
        const ward = bed.ward_name || 'Unknown';
        if (!acc[ward]) acc[ward] = { total: 0, occupied: 0 };
        acc[ward].total += 1;
        if (bed.status === 'occupied') acc[ward].occupied += 1;
        return acc;
      },
      {}
    );

    return {
      total,
      occupied,
      available,
      others,
      wardCounts,
      pieData: [
        { name: 'Occupied', value: occupied, color: '#f97316' },
        { name: 'Available', value: available, color: '#10b981' },
        { name: 'Other', value: others, color: '#94a3b8' },
      ],
    };
  }, [beds]);

  // DataTable columns
  const columns: DataTableColumn<Bed>[] = [
    {
      header: 'Bed Number',
      key: 'bed_number',
      sortable: true,
      filterable: true,
      accessor: (row) => row.bed_number,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <BedIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.bed_number}</span>
        </div>
      ),
    },
    {
      header: 'Ward',
      key: 'ward_name',
      sortable: true,
      filterable: true,
      accessor: (row) => row.ward_name || '',
      cell: (row) => <span>{row.ward_name}</span>,
    },
    {
      header: 'Type',
      key: 'bed_type',
      sortable: true,
      filterable: true,
      accessor: (row) => row.bed_type,
      cell: (row) => (
        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
          {BED_TYPE_LABELS[row.bed_type]}
        </span>
      ),
    },
    {
      header: 'Daily Charge',
      key: 'daily_charge',
      sortable: true,
      accessor: (row) => parseFloat(row.daily_charge),
      cell: (row) => (
        <span className="font-medium">₹{parseFloat(row.daily_charge).toFixed(2)}</span>
      ),
    },
    {
      header: 'Features',
      key: 'features',
      cell: (row) => (
        <div className="flex gap-2">
          {row.has_oxygen && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1">
              <Wind className="h-3 w-3" />
              O2
            </span>
          )}
          {row.has_ventilator && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Vent
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            row.status === 'available'
              ? 'bg-green-100 text-green-700'
              : row.status === 'occupied'
              ? 'bg-orange-100 text-orange-700'
              : row.status === 'maintenance'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {BED_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      header: 'Active',
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
          {row.is_active ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bed Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage individual beds across all wards
            </p>
          </div>
          <Button onClick={openCreateDrawer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bed
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4 flex gap-3 flex-wrap">
          <Input
            placeholder="Search beds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={wardFilter ? String(wardFilter) : 'all'}
            onValueChange={(val) =>
              setWardFilter(val === 'all' ? undefined : Number(val))
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by ward" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wards.map((w: any) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Occupancy</CardTitle>
            <CardDescription className="text-xs">Overall status</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{occupancyStats.total}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Occupied</p>
                <p className="text-lg font-semibold text-orange-600">
                  {occupancyStats.occupied}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={occupancyStats.pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={3}
                >
                  {occupancyStats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ward-wise Occupancy</CardTitle>
            <CardDescription className="text-xs">Occupied vs total per ward</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(occupancyStats.wardCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
            {Object.entries(occupancyStats.wardCounts).map(
              ([ward, stats]) => {
                const available = stats.total - stats.occupied;
                const percent = stats.total
                  ? Math.round((stats.occupied / stats.total) * 100)
                  : 0;
                return (
                  <div key={ward} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{ward}</span>
                      <span className="text-muted-foreground">
                        {stats.occupied}/{stats.total} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-2 bg-orange-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      <span>Available: {available}</span>
                      <span>Occupied: {stats.occupied}</span>
                    </div>
                  </div>
                );
              }
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <div className="px-6 pb-6">
        <DataTable
          rows={beds}
          isLoading={isLoading}
          columns={columns}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${row.ward_name} - ${row.bed_number}`}
          onEdit={openEditDrawer}
          onDelete={handleDelete}
          renderMobileCard={(row, actions) => (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BedIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{row.bed_number}</span>
                </div>
                {actions.dropdown}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ward:</span>
                  <span>{row.ward_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                    {BED_TYPE_LABELS[row.bed_type]}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Charge:</span>
                  <span className="font-medium">₹{parseFloat(row.daily_charge).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Features:</span>
                  <div className="flex gap-1">
                    {row.has_oxygen && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        O2
                      </span>
                    )}
                    {row.has_ventilator && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        Vent
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      row.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : row.status === 'occupied'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {BED_STATUS_LABELS[row.status]}
                  </span>
                </div>
              </div>
            </div>
          )}
          emptyTitle="No beds found"
          emptySubtitle="Create your first bed to get started"
        />
      </div>

      {/* Bed Form Drawer */}
      <BedFormDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        bed={selectedBed}
        mode={drawerMode}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
