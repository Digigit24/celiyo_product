// src/pages/CRMLeads.tsx
import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { LeadsFormDrawer } from '@/components/LeadsFormDrawer';
import { LeadStatusFormDrawer } from '@/components/LeadStatusFormDrawer';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, Building2, Phone, Mail, DollarSign, LayoutGrid, List, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Lead, LeadsQueryParams, PriorityEnum, LeadStatus } from '@/types/crmTypes';
import type { RowActions } from '@/components/DataTable';
import { exportLeadsToExcel, importLeadsFromExcel, downloadLeadsTemplate } from '@/utils/excelUtils';

type DrawerMode = 'view' | 'edit' | 'create';
type ViewMode = 'list' | 'kanban';

export const CRMLeads: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasModuleAccess } = useAuth();
  const { hasCRMAccess, useLeads, useLeadStatuses, useFieldConfigurations, deleteLead, patchLead, updateLeadStatus, deleteLeadStatus, bulkCreateLeads } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Query parameters state
  const [queryParams, setQueryParams] = useState<LeadsQueryParams>({
    page: 1,
    page_size: viewMode === 'kanban' ? 1000 : 20, // Load more leads for kanban view
    ordering: '-created_at',
  });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');

  // Status drawer state
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statusDrawerMode, setStatusDrawerMode] = useState<DrawerMode>('view');

  // Fetch leads and statuses
  const { data: leadsData, error, isLoading, mutate } = useLeads(queryParams);
  const { data: statusesData, mutate: mutateStatuses } = useLeadStatuses({
    page_size: 100,
    ordering: 'order_index',
    is_active: true
  });

  // Fetch field configurations for dynamic columns
  const { data: configurationsData } = useFieldConfigurations({
    is_active: true,
    ordering: 'display_order',
    page_size: 200,
  });

  // Check access
  if (!hasCRMAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">CRM Access Required</h2>
              <p className="text-gray-600">
                CRM module is not enabled for your account. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handlers
  const handleCreateLead = useCallback((statusId?: number) => {
    setSelectedLeadId(null);
    setDrawerMode('create');
    setDrawerOpen(true);
    // TODO: Pass statusId to the drawer for pre-selecting status
  }, []);

  const handleCreateLeadClick = useCallback(() => {
    handleCreateLead();
  }, [handleCreateLead]);

  const handleViewLead = useCallback((lead: Lead) => {
    navigate(`/crm/leads/${lead.id}`);
  }, [navigate]);

  const handleEditLead = useCallback((lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDrawerMode('edit');
    setDrawerOpen(true);
  }, []);

  const handleDeleteLead = useCallback(
    async (lead: Lead) => {
      try {
        await deleteLead(lead.id);
        toast.success(`Lead "${lead.name}" deleted successfully`);
        mutate(); // Refresh the list
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete lead');
        throw error;
      }
    },
    [deleteLead, mutate]
  );

  const handleDrawerSuccess = useCallback(() => {
    mutate(); // Refresh the list
    mutateStatuses(); // Refresh statuses too
  }, [mutate, mutateStatuses]);

  const handleModeChange = useCallback((mode: DrawerMode) => {
    setDrawerMode(mode);
  }, []);

  // Kanban-specific handlers with optimistic updates
  const handleUpdateLeadStatus = useCallback(
    async (leadId: number, newStatusId: number) => {
      // Get current data
      const currentData = leadsData;
      if (!currentData) {
        throw new Error('No leads data available');
      }

      // Create optimistic update
      const optimisticData = {
        ...currentData,
        results: currentData.results.map(lead =>
          lead.id === leadId
            ? { ...lead, status: newStatusId, updated_at: new Date().toISOString() }
            : lead
        )
      };

      try {
        // Optimistically update the cache immediately
        await mutate(optimisticData, false); // false = don't revalidate immediately
        
        // Make the API call
        await patchLead(leadId, { status: newStatusId });
        
        // Revalidate to get fresh data from server
        await mutate();
      } catch (error: any) {
        // Rollback on error by revalidating with current server data
        await mutate();
        throw new Error(error?.message || 'Failed to update lead status');
      }
    },
    [patchLead, mutate, leadsData]
  );

  const handleEditStatus = useCallback((status: LeadStatus) => {
    setSelectedStatusId(status.id);
    setStatusDrawerMode('edit');
    setStatusDrawerOpen(true);
  }, []);

  const handleDeleteStatus = useCallback(
    async (status: LeadStatus) => {
      if (window.confirm(`Are you sure you want to delete status "${status.name}"?`)) {
        try {
          await deleteLeadStatus(status.id);
          toast.success(`Status "${status.name}" deleted successfully`);
          mutateStatuses();
        } catch (error: any) {
          toast.error(error?.message || 'Failed to delete status');
        }
      }
    },
    [deleteLeadStatus, mutateStatuses]
  );

  const handleCreateStatus = useCallback(() => {
    setSelectedStatusId(null);
    setStatusDrawerMode('create');
    setStatusDrawerOpen(true);
  }, []);

  const handleStatusDrawerSuccess = useCallback(() => {
    mutateStatuses(); // Refresh statuses
  }, [mutateStatuses]);

  const handleStatusModeChange = useCallback((mode: DrawerMode) => {
    setStatusDrawerMode(mode);
  }, []);

  const handleMoveStatus = useCallback(
    async (status: LeadStatus, direction: 'up' | 'down') => {
      const statuses = statusesData?.results || [];
      const currentIndex = statuses.findIndex(s => s.id === status.id);
      
      if (currentIndex === -1) return;
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= statuses.length) return;

      const targetStatus = statuses[targetIndex];
      
      try {
        // Swap order_index values
        await Promise.all([
          updateLeadStatus(status.id, {
            ...status,
            order_index: targetStatus.order_index
          }),
          updateLeadStatus(targetStatus.id, {
            ...targetStatus,
            order_index: status.order_index
          })
        ]);
        
        toast.success('Status order updated successfully');
        mutateStatuses();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update status order');
      }
    },
    [statusesData, updateLeadStatus, mutateStatuses]
  );

  // View mode change handler
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
    setQueryParams(prev => ({
      ...prev,
      page: 1,
      page_size: newMode === 'kanban' ? 1000 : 20
    }));
  }, []);

  // Export leads to Excel
  const handleExportLeads = useCallback(() => {
    try {
      if (!leadsData || leadsData.results.length === 0) {
        toast.error('No leads to export');
        return;
      }

      exportLeadsToExcel(leadsData.results);
      toast.success(`Exported ${leadsData.results.length} leads successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export leads');
    }
  }, [leadsData]);

  // Download import template
  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadLeadsTemplate();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download template');
    }
  }, []);

  // Trigger file input click
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection and import
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        event.target.value = '';
        return;
      }

      try {
        toast.info('Processing Excel file...');

        // Parse Excel file
        const { leads: parsedLeads, errors: parseErrors } = await importLeadsFromExcel(file);

        if (parseErrors.length > 0) {
          toast.warning(`File parsed with ${parseErrors.length} warning(s)`, {
            description: parseErrors.slice(0, 3).join('; ') + (parseErrors.length > 3 ? '...' : ''),
            duration: 5000,
          });
        }

        if (parsedLeads.length === 0) {
          toast.error('No valid leads found in the file');
          event.target.value = '';
          return;
        }

        toast.info(`Creating ${parsedLeads.length} leads...`);

        // Bulk create leads
        const results = await bulkCreateLeads(parsedLeads);

        // Show results
        const successCount = results.created.length;
        const errorCount = results.errors.length;

        if (successCount > 0 && errorCount === 0) {
          toast.success(`Successfully created ${successCount} leads!`);
        } else if (successCount > 0 && errorCount > 0) {
          toast.warning(`Created ${successCount} leads, ${errorCount} failed`, {
            description: results.errors.slice(0, 2).map(e => `Row ${e.index + 1}: ${e.error}`).join('; '),
            duration: 7000,
          });
        } else {
          toast.error('Failed to create any leads', {
            description: results.errors.slice(0, 2).map(e => `Row ${e.index + 1}: ${e.error}`).join('; '),
            duration: 7000,
          });
        }

        // Refresh the leads list
        mutate();
      } catch (error: any) {
        toast.error(error.message || 'Failed to import leads');
      } finally {
        // Reset file input
        event.target.value = '';
      }
    },
    [bulkCreateLeads, mutate]
  );

  // Priority badge helper
  const getPriorityBadge = (priority: PriorityEnum) => {
    const variants = {
      LOW: 'bg-gray-100 text-gray-800 border-gray-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      HIGH: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority}
      </Badge>
    );
  };

  // Status badge helper
  const getStatusBadge = (status?: LeadStatus | number) => {
    if (!status) return <Badge variant="outline">No Status</Badge>;

    // If status is a number, find the status object from statusesData
    let statusObj: LeadStatus | undefined;
    if (typeof status === 'number') {
      statusObj = statusesData?.results.find(s => s.id === status);
    } else {
      statusObj = status;
    }

    if (!statusObj) return <Badge variant="outline">Unknown Status</Badge>;

    const bgColor = statusObj.color_hex || '#6B7280';
    const textColor = getContrastColor(bgColor);

    return (
      <Badge
        variant="outline"
        style={{
          backgroundColor: `${bgColor}20`,
          borderColor: bgColor,
          color: bgColor,
        }}
      >
        {statusObj.name}
      </Badge>
    );
  };

  // Helper to get contrasting text color
  const getContrastColor = (hexColor: string): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Format currency
  const formatCurrency = (amount?: string, currency?: string) => {
    if (!amount) return '-';
    const formatted = parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency || '$'}${formatted}`;
  };

  // Create field visibility map
  const fieldVisibilityMap = useMemo(() => {
    const allFields = configurationsData?.results || [];
    return new Map(
      allFields
        .filter((field) => field.is_standard)
        .map((field) => [field.field_name, field.is_visible])
    );
  }, [configurationsData?.results]);

  // Helper to check if a field is visible
  const isFieldVisible = useCallback((fieldName: string): boolean => {
    // Default to visible if no configuration exists
    return fieldVisibilityMap.get(fieldName) ?? true;
  }, [fieldVisibilityMap]);

  // Build dynamic columns based on field configurations
  const dynamicColumns = useMemo(() => {
    const allFields = configurationsData?.results || [];
    // Map ALL standard fields (don't filter by visibility yet)
    const standardFieldsMap = new Map(
      allFields
        .filter((field) => field.is_standard)
        .map((field) => [field.field_name, { order: field.display_order, visible: field.is_visible, config: field }])
    );

    // Column definitions for each standard field
    const columnDefinitions: Record<string, DataTableColumn<Lead>> = {
      name: {
        header: 'Name',
        key: 'name',
        cell: (lead) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{lead.name}</span>
            {lead.title && standardFieldsMap.has('title') && (
              <span className="text-xs text-muted-foreground">{lead.title}</span>
            )}
          </div>
        ),
        className: 'w-[200px]',
      },
      company: {
        header: 'Company',
        key: 'company',
        cell: (lead) => (
          <div className="flex items-center gap-2">
            {lead.company ? (
              <>
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{lead.company}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      phone: {
        header: 'Contact',
        key: 'contact',
        cell: (lead) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
            {lead.email && standardFieldsMap.has('email') && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{lead.email}</span>
              </div>
            )}
          </div>
        ),
      },
      status: {
        header: 'Status',
        key: 'status',
        cell: (lead) => getStatusBadge(lead.status),
      },
      priority: {
        header: 'Priority',
        key: 'priority',
        cell: (lead) => getPriorityBadge(lead.priority),
      },
      value_amount: {
        header: 'Value',
        key: 'value',
        cell: (lead) => (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">
              {formatCurrency(lead.value_amount, lead.value_currency)}
            </span>
          </div>
        ),
        className: 'text-right',
      },
    };

    // Build columns array - show all fields by default, hide only if explicitly set to invisible
    const visibleColumns: Array<{ column: DataTableColumn<Lead>; order: number }> = [];

    // Define default order for fields (fallback if no config exists)
    const defaultFieldOrder: Record<string, number> = {
      name: 0,
      phone: 1,
      company: 2,
      status: 3,
      priority: 4,
      value_amount: 5,
    };

    // Iterate through all column definitions
    Object.entries(columnDefinitions).forEach(([fieldName, columnDef]) => {
      const fieldConfig = standardFieldsMap.get(fieldName);

      // Show field if:
      // 1. No config exists (default to visible), OR
      // 2. Config exists AND is_visible is true
      const shouldShow = !fieldConfig || fieldConfig.visible;

      if (shouldShow) {
        const order = fieldConfig?.order ?? defaultFieldOrder[fieldName] ?? 999;
        visibleColumns.push({ column: columnDef, order });
      }
    });

    // Sort by display_order and extract just the column definitions
    const sortedColumns = visibleColumns
      .sort((a, b) => a.order - b.order)
      .map((item) => item.column);

    // Always add the "Last Updated" column at the end
    sortedColumns.push({
      header: 'Last Updated',
      key: 'updated',
      cell: (lead) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
        </span>
      ),
    });

    return sortedColumns;
  }, [configurationsData?.results, statusesData?.results]);

  // Desktop table columns
  const columns: DataTableColumn<Lead>[] = dynamicColumns;

  // Mobile card renderer
  const renderMobileCard = (lead: Lead, actions: RowActions<Lead>) => (
    <>
      {/* Header */}
      {isFieldVisible('name') && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{lead.name}</h3>
            {lead.title && isFieldVisible('title') && (
              <p className="text-xs text-muted-foreground mt-0.5">{lead.title}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isFieldVisible('priority') && getPriorityBadge(lead.priority)}
          </div>
        </div>
      )}

      {/* Company & Status */}
      {(isFieldVisible('company') || isFieldVisible('status')) && (
        <div className="flex flex-wrap items-center gap-2">
          {lead.company && isFieldVisible('company') && (
            <div className="flex items-center gap-1.5 text-sm">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{lead.company}</span>
            </div>
          )}
          {isFieldVisible('status') && getStatusBadge(lead.status)}
        </div>
      )}

      {/* Contact Info */}
      {(isFieldVisible('phone') || isFieldVisible('email')) && (
        <div className="space-y-1">
          {isFieldVisible('phone') && (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && isFieldVisible('email') && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Value */}
      {lead.value_amount && isFieldVisible('value_amount') && (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{formatCurrency(lead.value_amount, lead.value_currency)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
        </span>
        <div className="flex gap-2">
          {actions.edit && (
            <Button variant="outline" size="sm" onClick={actions.edit}>
              Edit
            </Button>
          )}
          {actions.view && (
            <Button variant="default" size="sm" onClick={actions.view}>
              View
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CRM Leads</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your sales leads and pipeline
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLeads}
            disabled={!leadsData || leadsData.results.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateLeadClick} size="default" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Stats Cards */}
      {leadsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-xl sm:text-2xl font-bold">{leadsData.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">This Page</p>
                  <p className="text-xl sm:text-2xl font-bold">{leadsData.results.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <LayoutGrid className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Pages</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {Math.ceil(leadsData.count / (queryParams.page_size || 20))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <List className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Current Page</p>
                  <p className="text-xl sm:text-2xl font-bold">{queryParams.page || 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Toggle */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Kanban Board
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <DataTable
              rows={leadsData?.results || []}
              isLoading={isLoading}
              columns={columns}
              renderMobileCard={renderMobileCard}
              getRowId={(lead) => lead.id}
              getRowLabel={(lead) => lead.name}
              onView={handleViewLead}
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
              emptyTitle="No leads found"
              emptySubtitle="Get started by creating your first lead"
            />

            {/* Pagination */}
            {!isLoading && leadsData && leadsData.count > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {leadsData.results.length} of {leadsData.count} lead(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!leadsData.previous}
                    onClick={() =>
                      setQueryParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!leadsData.next}
                    onClick={() =>
                      setQueryParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <KanbanBoard
              leads={leadsData?.results || []}
              statuses={statusesData?.results || []}
              onViewLead={handleViewLead}
              onCreateLead={handleCreateLead}
              onEditStatus={handleEditStatus}
              onDeleteStatus={handleDeleteStatus}
              onCreateStatus={handleCreateStatus}
              onMoveStatus={handleMoveStatus}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Form Drawer */}
      <LeadsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        leadId={selectedLeadId}
        mode={drawerMode}
        onSuccess={handleDrawerSuccess}
        onDelete={(id) => {
          // Already handled in handleDeleteLead
        }}
        onModeChange={handleModeChange}
      />

      {/* Status Form Drawer */}
      <LeadStatusFormDrawer
        open={statusDrawerOpen}
        onOpenChange={setStatusDrawerOpen}
        statusId={selectedStatusId}
        mode={statusDrawerMode}
        onSuccess={handleStatusDrawerSuccess}
        onDelete={(id) => {
          // Already handled in handleDeleteStatus
        }}
        onModeChange={handleStatusModeChange}
      />
    </div>
  );
};