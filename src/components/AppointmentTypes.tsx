// src/components/AppointmentTypes.tsx
import React, { useState } from 'react';
import { useAppointmentType } from '@/hooks/useAppointmentType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentType } from '@/types/appointmentType.types';
import AppointmentTypeDetailsDrawer from '@/components/appointment-type-drawer/AppointmentTypeDetailsDrawer';

export const AppointmentTypes: React.FC = () => {
  const {
    useAppointmentTypes,
    deleteAppointmentType,
  } = useAppointmentType();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Fetch appointment types
  const { data: typesData, isLoading, mutate } = useAppointmentTypes({
    search: searchTerm || undefined,
    page_size: 100,
  });

  const appointmentTypes = typesData?.results || [];

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreate = () => {
    setSelectedTypeId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleView = (type: AppointmentType) => {
    setSelectedTypeId(type.id);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (type: AppointmentType) => {
    setSelectedTypeId(type.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleDelete = async (type: AppointmentType) => {
    if (window.confirm(`Are you sure you want to delete "${type.name}"? This action cannot be undone.`)) {
      try {
        await deleteAppointmentType(type.id);
        toast.success('Appointment type deleted successfully');
        mutate();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete appointment type');
      }
    }
  };

  const handleDrawerSuccess = () => {
    mutate(); // Refresh the list
  };

  const handleDrawerDelete = (id: number) => {
    mutate(); // Refresh the list after deletion
  };

  // DataTable columns
  const columns: DataTableColumn<AppointmentType>[] = [
    {
      header: 'Name',
      key: 'name',
      cell: (type) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: type.color || '#3b82f6' }}
          />
          <span className="font-medium">{type.name}</span>
        </div>
      ),
    },
    {
      header: 'Code',
      key: 'code',
      cell: (type) => (
        <Badge variant="outline" className="font-mono">
          {type.code}
        </Badge>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      cell: (type) => (
        <span className="text-sm text-muted-foreground">
          {type.description || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      cell: (type) => (
        <Badge variant={type.is_active ? 'default' : 'secondary'}>
          {type.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (type: AppointmentType, actions: any) => {
    return (
      <>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: type.color || '#3b82f6' }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{type.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{type.code}</p>
            </div>
          </div>
          <Badge variant={type.is_active ? 'default' : 'secondary'} className="ml-2">
            {type.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {type.description && (
          <p className="text-sm text-muted-foreground">{type.description}</p>
        )}

        <div className="flex gap-2 pt-2">
          {actions.edit && (
            <Button size="sm" variant="outline" onClick={actions.edit} className="flex-1">
              Edit
            </Button>
          )}
          {actions.askDelete && (
            <Button size="sm" variant="destructive" onClick={actions.askDelete}>
              Delete
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Appointment Types
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage appointment type configurations
          </p>
        </div>
        <Button onClick={handleCreate} size="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search appointment types..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Appointment Types</CardTitle>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            rows={appointmentTypes}
            isLoading={isLoading}
            columns={columns}
            renderMobileCard={renderMobileCard}
            getRowId={(type) => type.id}
            getRowLabel={(type) => type.name}
            onRowClick={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyTitle="No appointment types found"
            emptySubtitle="Create your first appointment type to get started"
          />
        </CardContent>
      </Card>

      {/* Appointment Type Details Drawer */}
      <AppointmentTypeDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        appointmentTypeId={selectedTypeId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={handleDrawerDelete}
        onModeChange={setDrawerMode}
      />
    </div>
  );
};

export default AppointmentTypes;
