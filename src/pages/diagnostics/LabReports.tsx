// src/pages/diagnostics/LabReports.tsx
import React, { useState, useMemo } from 'react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Search, FileText, CheckCircle2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { LabReport, CreateLabReportPayload } from '@/types/diagnostics.types';

export const LabReports: React.FC = () => {
  const {
    useLabReports,
    createLabReport,
    updateLabReport,
    deleteLabReport,
    useDiagnosticOrders,
  } = useDiagnostics();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateLabReportPayload>>({
    result_data: {},
  });

  // Fetch data
  const { data, isLoading, mutate } = useLabReports();
  const { data: ordersData } = useDiagnosticOrders();

  const reports = data?.results || [];
  const orders = ordersData?.results || [];

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.id.toString().includes(searchTerm);
      return matchesSearch;
    });
  }, [reports, searchTerm]);

  // DataTable columns
  const columns: DataTableColumn<LabReport>[] = [
    {
      header: 'Report ID',
      key: 'id',
      accessor: (row) => row.id,
      cell: (row) => <span className="font-mono font-semibold text-sm">#{row.id}</span>,
      sortable: true,
    },
    {
      header: 'Test Order',
      key: 'diagnostic_order',
      accessor: (row) => row.diagnostic_order,
      cell: (row) => <span className="text-sm">Order #{row.diagnostic_order}</span>,
      sortable: true,
    },
    {
      header: 'Created At',
      key: 'created_at',
      accessor: (row) => row.created_at,
      cell: (row) => <span className="text-sm">{format(new Date(row.created_at), 'MMM dd, yyyy HH:mm')}</span>,
      sortable: true,
    },
    {
      header: 'Verified',
      key: 'verified_by',
      accessor: (row) => row.verified_by,
      cell: (row) => {
        if (row.verified_by) {
          return (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          );
        }
        return <Badge variant="secondary">Pending</Badge>;
      },
      sortable: true,
    },
    {
      header: 'Attachment',
      key: 'attachment',
      accessor: (row) => row.attachment,
      cell: (row) => {
        if (row.attachment) {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(row.attachment!, '_blank');
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              View
            </Button>
          );
        }
        return <span className="text-muted-foreground text-sm">No attachment</span>;
      },
    },
  ];

  // Handlers
  const handleCreate = () => {
    setFormData({ result_data: {} });
    setSelectedFile(null);
    setSelectedReport(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleView = (report: LabReport) => {
    setSelectedReport(report);
    setFormData({
      diagnostic_order: report.diagnostic_order,
      result_data: report.result_data,
      technician_id: report.technician_id || undefined,
      verified_by: report.verified_by || undefined,
      verified_at: report.verified_at || undefined,
    });
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleEdit = (report: LabReport) => {
    setSelectedReport(report);
    setFormData({
      diagnostic_order: report.diagnostic_order,
      result_data: report.result_data,
      technician_id: report.technician_id || undefined,
      verified_by: report.verified_by || undefined,
      verified_at: report.verified_at || undefined,
    });
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleDelete = async (report: LabReport) => {
    try {
      await deleteLabReport(report.id);
      toast.success('Lab report deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lab report');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.diagnostic_order) {
      toast.error('Please select a diagnostic order');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        attachment: selectedFile || undefined,
      };

      if (drawerMode === 'create') {
        await createLabReport(submitData as CreateLabReportPayload);
        toast.success('Lab report created successfully');
      } else if (drawerMode === 'edit' && selectedReport) {
        await updateLabReport(selectedReport.id, submitData);
        toast.success('Lab report updated successfully');
      }
      setDrawerOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save lab report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setFormData({ result_data: {} });
    setSelectedFile(null);
    setSelectedReport(null);
  };

  // Result data fields management
  const [resultKey, setResultKey] = useState('');
  const [resultValue, setResultValue] = useState('');

  const handleAddResultField = () => {
    if (resultKey && resultValue) {
      setFormData({
        ...formData,
        result_data: {
          ...formData.result_data,
          [resultKey]: resultValue,
        },
      });
      setResultKey('');
      setResultValue('');
    }
  };

  const handleRemoveResultField = (key: string) => {
    const newResultData = { ...formData.result_data };
    delete newResultData[key];
    setFormData({ ...formData, result_data: newResultData });
  };

  // Drawer action buttons
  const drawerButtons: DrawerActionButton[] = useMemo(() => {
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
  }, [drawerMode, isSubmitting]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              Lab Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              View and verify test results
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Report
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by report ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <DataTable
          rows={filteredReports}
          columns={columns}
          isLoading={isLoading}
          onRowClick={handleView}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `Report #${row.id}`}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyTitle="No lab reports found"
          emptySubtitle="Create your first lab report to get started"
          renderMobileCard={(row, actions) => (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-semibold text-sm text-primary">Report #{row.id}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Order #{row.diagnostic_order}
                  </div>
                </div>
                {row.verified_by ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(row.created_at), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          )}
        />
      </div>

      {/* Side Drawer */}
      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClose={handleDrawerClose}
        title={
          drawerMode === 'create'
            ? 'Add Lab Report'
            : drawerMode === 'edit'
            ? 'Edit Lab Report'
            : 'Lab Report Details'
        }
        mode={drawerMode}
        footerButtons={drawerButtons}
        size="lg"
      >
        <div className="space-y-6">
          {/* Diagnostic Order */}
          <div className="space-y-2">
            <Label htmlFor="diagnostic_order">
              Diagnostic Order <span className="text-destructive">*</span>
            </Label>
            {drawerMode === 'create' ? (
              <select
                id="diagnostic_order"
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
                value={formData.diagnostic_order || ''}
                onChange={(e) =>
                  setFormData({ ...formData, diagnostic_order: parseInt(e.target.value) })
                }
              >
                <option value="">Select order</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id} - {order.investigation_name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="diagnostic_order"
                value={`Order #${formData.diagnostic_order}`}
                disabled
              />
            )}
          </div>

          {/* Result Data */}
          <div className="space-y-2">
            <Label>Test Results</Label>
            {drawerMode !== 'view' && (
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Parameter name"
                  value={resultKey}
                  onChange={(e) => setResultKey(e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                />
                <Button onClick={handleAddResultField} variant="outline" size="sm">
                  Add
                </Button>
              </div>
            )}
            <Card className="p-4">
              {Object.entries(formData.result_data || {}).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(formData.result_data || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{key}:</span>
                      <div className="flex items-center gap-2">
                        <span>{String(value)}</span>
                        {drawerMode !== 'view' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveResultField(key)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No results added yet
                </div>
              )}
            </Card>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment</Label>
            {drawerMode !== 'view' ? (
              <div className="space-y-2">
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>
            ) : (
              selectedReport?.attachment && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedReport.attachment!, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Attachment
                </Button>
              )
            )}
          </div>

          {/* Technician ID */}
          <div className="space-y-2">
            <Label htmlFor="technician_id">Technician ID</Label>
            <Input
              id="technician_id"
              placeholder="Enter technician UUID"
              value={formData.technician_id || ''}
              onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
              disabled={drawerMode === 'view'}
            />
          </div>

          {/* Verified By */}
          <div className="space-y-2">
            <Label htmlFor="verified_by">Verified By</Label>
            <Input
              id="verified_by"
              placeholder="Enter verifier UUID"
              value={formData.verified_by || ''}
              onChange={(e) => setFormData({ ...formData, verified_by: e.target.value })}
              disabled={drawerMode === 'view'}
            />
          </div>

          {/* Verification Date/Time */}
          {selectedReport?.verified_at && drawerMode === 'view' && (
            <div className="space-y-2">
              <Label>Verified At</Label>
              <Input
                value={format(new Date(selectedReport.verified_at), 'MMM dd, yyyy HH:mm')}
                disabled
              />
            </div>
          )}
        </div>
      </SideDrawer>
    </div>
  );
};

export default LabReports;
