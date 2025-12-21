// src/pages/diagnostics/Investigations.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Microscope, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { Investigation, InvestigationCategory, CreateInvestigationPayload } from '@/types/diagnostics.types';

const CATEGORY_OPTIONS: { value: InvestigationCategory; label: string }[] = [
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'mri', label: 'MRI' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'other', label: 'Other' },
];

export const Investigations: React.FC = () => {
  const {
    useInvestigations,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,
  } = useDiagnostics();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InvestigationCategory | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<CreateInvestigationPayload>>({
    name: '',
    code: '',
    category: 'laboratory',
    base_charge: '',
    description: '',
    is_active: true,
  });

  // Fetch data
  const { data, isLoading, mutate } = useInvestigations();
  const investigations = data?.results || [];

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  // Filtered investigations
  const filteredInvestigations = useMemo(() => {
    return investigations.filter((inv) => {
      const matchesSearch =
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [investigations, searchTerm, categoryFilter]);

  // DataTable columns
  const columns: DataTableColumn<Investigation>[] = [
    {
      header: 'Code',
      key: 'code',
      accessor: (row) => row.code,
      cell: (row) => <span className="font-mono font-semibold text-sm">{row.code}</span>,
      sortable: true,
      filterable: true,
    },
    {
      header: 'Name',
      key: 'name',
      accessor: (row) => row.name,
      cell: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      header: 'Category',
      key: 'category',
      accessor: (row) => row.category,
      cell: (row) => (
        <Badge variant="outline">
          {CATEGORY_OPTIONS.find((c) => c.value === row.category)?.label || row.category}
        </Badge>
      ),
      sortable: true,
      filterable: true,
    },
    {
      header: 'Base Charge',
      key: 'base_charge',
      accessor: (row) => parseFloat(row.base_charge),
      cell: (row) => <span className="font-medium">₹{parseFloat(row.base_charge).toLocaleString()}</span>,
      sortable: true,
      className: 'text-right',
    },
    {
      header: 'Status',
      key: 'is_active',
      accessor: (row) => row.is_active,
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      sortable: true,
    },
  ];

  // Handlers
  const handleCreate = () => {
    setFormData({
      name: '',
      code: '',
      category: 'laboratory',
      base_charge: '',
      description: '',
      is_active: true,
    });
    setSelectedInvestigation(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleView = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    setFormData(investigation);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    setFormData(investigation);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleDelete = async (investigation: Investigation) => {
    try {
      await deleteInvestigation(investigation.id);
      toast.success('Investigation deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete investigation');
    }
  };

  const handleSubmit = async () => {
    console.log('=== SUBMIT CLICKED ===');
    console.log('Current formData:', JSON.stringify(formData, null, 2));
    console.log('Drawer mode:', drawerMode);

    // Trim values for validation
    const name = formData.name?.trim() || '';
    const code = formData.code?.trim() || '';
    const base_charge = formData.base_charge?.toString().trim() || '';
    const category = formData.category;

    console.log('Validation checks:', {
      'name empty?': !name,
      'code empty?': !code,
      'base_charge empty?': !base_charge,
      'category empty?': !category,
    });

    // Detailed validation with specific error messages
    if (!name) {
      console.error('Validation failed: name is empty');
      toast.error('Test Name is required');
      return;
    }
    if (!code) {
      console.error('Validation failed: code is empty');
      toast.error('Test Code is required');
      return;
    }
    if (!base_charge) {
      console.error('Validation failed: base_charge is empty');
      toast.error('Base Charge is required');
      return;
    }
    if (!category) {
      console.error('Validation failed: category is empty');
      toast.error('Category is required');
      return;
    }

    console.log('✓ All validations passed');
    console.log('Submitting investigation:', formData);

    setIsSubmitting(true);
    try {
      if (drawerMode === 'create') {
        const result = await createInvestigation(formData as CreateInvestigationPayload);
        console.log('✓ Created investigation:', result);
        toast.success('Investigation created successfully');
      } else if (drawerMode === 'edit' && selectedInvestigation) {
        const result = await updateInvestigation(selectedInvestigation.id, formData);
        console.log('✓ Updated investigation:', result);
        toast.success('Investigation updated successfully');
      }
      setDrawerOpen(false);
      mutate();
    } catch (error: any) {
      console.error('✗ Error saving investigation:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setFormData({
      name: '',
      code: '',
      category: 'laboratory',
      base_charge: '',
      description: '',
      is_active: true,
    });
    setSelectedInvestigation(null);
  };

  // Drawer action buttons - removed useMemo to fix stale closure issue
  const drawerButtons: DrawerActionButton[] = (() => {
    if (drawerMode === 'view') {
      return [
        {
          label: 'Edit',
          onClick: () => {
            setDrawerMode('edit');
          },
          variant: 'default',
        },
      ];
    }

    return [
      {
        label: 'Cancel',
        onClick: handleDrawerClose,
        variant: 'outline',
      },
      {
        label: drawerMode === 'create' ? 'Create' : 'Update',
        onClick: handleSubmit,
        variant: 'default',
        loading: isSubmitting,
        disabled: isSubmitting,
      },
    ];
  })();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Microscope className="h-8 w-8 text-primary" />
              </div>
              Investigations
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage test catalog and pricing
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investigation
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as InvestigationCategory | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <DataTable
          rows={filteredInvestigations}
          columns={columns}
          isLoading={isLoading}
          onRowClick={handleView}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyTitle="No investigations found"
          emptySubtitle="Create your first investigation to get started"
          renderMobileCard={(row, actions) => (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-semibold text-sm text-primary">{row.code}</div>
                  <div className="font-medium mt-1">{row.name}</div>
                </div>
                <Badge variant={row.is_active ? 'default' : 'secondary'}>
                  {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Badge variant="outline">
                  {CATEGORY_OPTIONS.find((c) => c.value === row.category)?.label}
                </Badge>
                <span className="font-semibold">₹{parseFloat(row.base_charge).toLocaleString()}</span>
              </div>
            </div>
          )}
        />
      </div>

      {/* Side Drawer */}
      <SideDrawer
        key={`${drawerMode}-${selectedInvestigation?.id || 'new'}`}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClose={handleDrawerClose}
        title={
          drawerMode === 'create'
            ? 'Add Investigation'
            : drawerMode === 'edit'
            ? 'Edit Investigation'
            : 'Investigation Details'
        }
        mode={drawerMode}
        footerButtons={drawerButtons}
        size="lg"
      >
        <div className="space-y-6">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Test Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="e.g., CBC, CXR"
              value={formData.code || ''}
              onChange={(e) => {
                console.log('Code changed to:', e.target.value);
                setFormData({ ...formData, code: e.target.value });
              }}
              disabled={drawerMode === 'view'}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Test Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Complete Blood Count"
              value={formData.name || ''}
              onChange={(e) => {
                console.log('Name changed to:', e.target.value);
                setFormData({ ...formData, name: e.target.value });
              }}
              disabled={drawerMode === 'view'}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as InvestigationCategory })
              }
              disabled={drawerMode === 'view'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Base Charge */}
          <div className="space-y-2">
            <Label htmlFor="base_charge">
              Base Charge (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="base_charge"
              type="number"
              placeholder="e.g., 500.00"
              value={formData.base_charge || ''}
              onChange={(e) => {
                console.log('Base charge changed to:', e.target.value);
                setFormData({ ...formData, base_charge: e.target.value });
              }}
              disabled={drawerMode === 'view'}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter test description..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={drawerMode === 'view'}
              rows={4}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={drawerMode === 'view'}
              className="h-4 w-4"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>
        </div>
      </SideDrawer>
    </div>
  );
};

export default Investigations;
