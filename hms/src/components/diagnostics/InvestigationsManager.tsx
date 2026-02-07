// src/components/diagnostics/InvestigationsManager.tsx
import React, { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import type {
  CreateInvestigationPayload,
  Investigation,
  InvestigationCategory,
} from '@/types/diagnostics.types';

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

const defaultFormState: Partial<CreateInvestigationPayload> & { is_active: boolean } = {
  name: '',
  code: '',
  category: 'laboratory',
  base_charge: '',
  description: '',
  is_active: true,
};

export const InvestigationsManager: React.FC = () => {
  const {
    useInvestigations,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,
  } = useDiagnostics();

  const { data, isLoading, mutate } = useInvestigations();
  const investigations = data?.results || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [formData, setFormData] = useState<
    Partial<CreateInvestigationPayload> & { is_active?: boolean }
  >(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns: DataTableColumn<Investigation>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        accessor: (row) => row.code,
        cell: (row) => <span className="font-mono font-semibold text-sm">{row.code}</span>,
        sortable: true,
        filterable: true,
      },
      {
        key: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        cell: (row) => <span className="font-medium">{row.name}</span>,
        sortable: true,
        filterable: true,
      },
      {
        key: 'category',
        header: 'Category',
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
        key: 'base_charge',
        header: 'Base Charge',
        accessor: (row) => parseFloat(row.base_charge),
        cell: (row) => (
          <span className="font-semibold">
            Rs. {Number.parseFloat(row.base_charge).toLocaleString()}
          </span>
        ),
        sortable: true,
        className: 'text-right',
      },
      {
        key: 'is_active',
        header: 'Status',
        accessor: (row) => row.is_active,
        cell: (row) => (
          <Badge variant={row.is_active ? 'default' : 'secondary'}>
            {row.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
        sortable: true,
      },
    ],
    []
  );

  const resetForm = () => {
    setFormData(defaultFormState);
    setSelectedInvestigation(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleEdit = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    setFormData({
      name: investigation.name,
      code: investigation.code,
      category: investigation.category,
      base_charge: investigation.base_charge,
      description: investigation.description,
      is_active: investigation.is_active,
    });
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleDelete = async (investigation: Investigation) => {
    if (!window.confirm('Delete this investigation?')) return;
    try {
      await deleteInvestigation(investigation.id);
      toast.success('Investigation deleted');
      mutate();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete investigation');
    }
  };

  const handleSubmit = async () => {
    const name = formData.name?.trim() || '';
    const code = formData.code?.trim() || '';
    const baseCharge = formData.base_charge?.toString().trim() || '';
    const category = formData.category;

    if (!name || !code || !baseCharge || !category) {
      toast.error('Code, name, category and base charge are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (drawerMode === 'edit' && selectedInvestigation) {
        await updateInvestigation(selectedInvestigation.id, {
          ...formData,
          base_charge: baseCharge,
        });
        toast.success('Investigation updated');
      } else {
        await createInvestigation({
          ...formData,
          base_charge: baseCharge,
        } as CreateInvestigationPayload);
        toast.success('Investigation created');
      }
      setDrawerOpen(false);
      resetForm();
      mutate();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerButtons: DrawerActionButton[] = [
    {
      label: 'Cancel',
      onClick: () => {
        setDrawerOpen(false);
        resetForm();
      },
      variant: 'outline',
    },
    {
      label: drawerMode === 'create' ? 'Create Investigation' : 'Update Investigation',
      onClick: handleSubmit,
      loading: isSubmitting,
      disabled: isSubmitting,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Investigations Master</CardTitle>
              <CardDescription>
                Manage tests and base charges used while creating requisitions.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Investigation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={investigations}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            onRowClick={handleEdit}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyTitle="No investigations found"
            emptySubtitle="Create your first investigation to get started"
            renderMobileCard={(row) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-semibold text-sm text-primary">{row.code}</div>
                    <div className="font-medium">{row.name}</div>
                  </div>
                  <Badge variant={row.is_active ? 'default' : 'secondary'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">
                    {CATEGORY_OPTIONS.find((c) => c.value === row.category)?.label || row.category}
                  </Badge>
                  <span className="font-semibold">
                    Rs. {Number.parseFloat(row.base_charge).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClose={resetForm}
        title={drawerMode === 'create' ? 'Add Investigation' : 'Edit Investigation'}
        mode={drawerMode}
        footerButtons={drawerButtons}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g., CBC, CXR"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Complete Blood Count"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as InvestigationCategory })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
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
            <div className="space-y-2">
              <Label htmlFor="base_charge">
                Base Charge (Rs.) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="base_charge"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 500.00"
                value={formData.base_charge || ''}
                onChange={(e) => setFormData({ ...formData, base_charge: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add notes or preparation instructions"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Active</p>
              <p className="text-sm text-muted-foreground">
                Toggle off to hide this test from selection lists.
              </p>
            </div>
            <Switch
              checked={!!formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>
      </SideDrawer>
    </>
  );
};
