// src/pages/diagnostics/Requisitions.tsx
import React, { useState, useMemo } from 'react';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { PatientSelect } from '@/components/form/PatientSelect';
import { DoctorSelect } from '@/components/form/DoctorSelect';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, ClipboardList, Clock, AlertCircle, CheckCircle2, XCircle, Activity, Microscope, Pill, Stethoscope, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Requisition, RequisitionStatus, RequisitionPriority, RequisitionType, CreateRequisitionPayload } from '@/types/diagnostics.types';

const STATUS_OPTIONS: { value: RequisitionStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'ordered', label: 'Ordered', icon: <Clock className="h-3 w-3" /> },
  { value: 'sample_collected', label: 'Sample Collected', icon: <Activity className="h-3 w-3" /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" /> },
  { value: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-3 w-3" /> },
];

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'stat', label: 'STAT (Immediate)' },
];

const TYPE_OPTIONS: { value: RequisitionType | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Types', icon: <ClipboardList className="h-3 w-3" /> },
  { value: 'investigation', label: 'Investigations', icon: <Microscope className="h-3 w-3" /> },
  { value: 'medicine', label: 'Medicines', icon: <Pill className="h-3 w-3" /> },
  { value: 'procedure', label: 'Procedures', icon: <Stethoscope className="h-3 w-3" /> },
  { value: 'package', label: 'Packages', icon: <Package className="h-3 w-3" /> },
];

const STATUS_COLORS: Record<RequisitionStatus, string> = {
  ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  sample_collected: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const TYPE_COLORS: Record<RequisitionType, string> = {
  investigation: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  medicine: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  procedure: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  package: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

export const Requisitions: React.FC = () => {
  const {
    useRequisitions,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    useInvestigations,
    createDiagnosticOrder,
  } = useDiagnostics();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RequisitionType | 'all'>('all');
  const [activeTab, setActiveTab] = useState('details');

  // Form state
  const [formData, setFormData] = useState<Partial<CreateRequisitionPayload>>({
    priority: 'routine',
    status: 'ordered',
  });

  // Selected investigations for new requisition
  const [selectedInvestigations, setSelectedInvestigations] = useState<number[]>([]);

  // Fetch data
  const { data, isLoading, mutate } = useRequisitions();
  const { data: investigationsData } = useInvestigations();

  const requisitions = data?.results || [];
  const investigations = investigationsData?.results || [];

  // Filtered requisitions
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesSearch =
        req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesType = typeFilter === 'all' || req.requisition_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requisitions, searchTerm, statusFilter, typeFilter]);

  // DataTable columns
  const columns: DataTableColumn<Requisition>[] = [
    {
      header: 'Req. Number',
      key: 'requisition_number',
      accessor: (row) => row.requisition_number,
      cell: (row) => <span className="font-mono font-semibold text-sm">{row.requisition_number}</span>,
      sortable: true,
      filterable: true,
    },
    {
      header: 'Patient',
      key: 'patient_name',
      accessor: (row) => row.patient_name,
      cell: (row) => <span className="font-medium">{row.patient_name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      header: 'Order Date',
      key: 'order_date',
      accessor: (row) => row.order_date,
      cell: (row) => <span className="text-sm">{format(new Date(row.order_date), 'MMM dd, yyyy HH:mm')}</span>,
      sortable: true,
    },
    {
      header: 'Priority',
      key: 'priority',
      accessor: (row) => row.priority,
      cell: (row) => (
        <Badge variant={row.priority === 'stat' ? 'destructive' : 'outline'}>
          {PRIORITY_OPTIONS.find((p) => p.value === row.priority)?.label}
        </Badge>
      ),
      sortable: true,
      filterable: true,
    },
    {
      header: 'Status',
      key: 'status',
      accessor: (row) => row.status,
      cell: (row) => {
        const statusOption = STATUS_OPTIONS.find((s) => s.value === row.status);
        return (
          <Badge className={STATUS_COLORS[row.status]}>
            <span className="flex items-center gap-1">
              {statusOption?.icon}
              {statusOption?.label}
            </span>
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      header: 'Type',
      key: 'requisition_type',
      accessor: (row) => row.requisition_type,
      cell: (row) => {
        const typeOption = TYPE_OPTIONS.find((t) => t.value === row.requisition_type);
        return (
          <Badge className={TYPE_COLORS[row.requisition_type]}>
            <span className="flex items-center gap-1">
              {typeOption?.icon}
              {typeOption?.label}
            </span>
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
    },
    {
      header: 'Items',
      key: 'items',
      accessor: (row) => {
        const counts = {
          investigation: row.investigation_orders?.length || 0,
          medicine: row.medicine_orders?.length || 0,
          procedure: row.procedure_orders?.length || 0,
          package: row.package_orders?.length || 0,
        };
        return counts[row.requisition_type] || 0;
      },
      cell: (row) => {
        const counts = {
          investigation: row.investigation_orders?.length || 0,
          medicine: row.medicine_orders?.length || 0,
          procedure: row.procedure_orders?.length || 0,
          package: row.package_orders?.length || 0,
        };
        const count = counts[row.requisition_type] || 0;
        const labels = {
          investigation: 'tests',
          medicine: 'medicines',
          procedure: 'procedures',
          package: 'packages',
        };
        const label = labels[row.requisition_type] || 'items';
        return <span className="text-sm">{count} {label}</span>;
      },
      sortable: true,
    },
  ];

  // Handlers
  const handleCreate = () => {
    setFormData({ priority: 'routine', status: 'ordered' });
    setSelectedInvestigations([]);
    setSelectedRequisition(null);
    setDrawerMode('create');
    setActiveTab('details');
    setDrawerOpen(true);
  };

  const handleView = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setFormData({
      patient: requisition.patient,
      requesting_doctor_id: requisition.requesting_doctor_id,
      status: requisition.status,
      priority: requisition.priority,
      clinical_notes: requisition.clinical_notes,
      content_type: requisition.content_type,
      object_id: requisition.object_id,
    });
    setDrawerMode('view');
    setActiveTab('details');
    setDrawerOpen(true);
  };

  const handleEdit = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setFormData({
      patient: requisition.patient,
      requesting_doctor_id: requisition.requesting_doctor_id,
      status: requisition.status,
      priority: requisition.priority,
      clinical_notes: requisition.clinical_notes,
      content_type: requisition.content_type,
      object_id: requisition.object_id,
    });
    setDrawerMode('edit');
    setActiveTab('details');
    setDrawerOpen(true);
  };

  const handleDelete = async (requisition: Requisition) => {
    try {
      await deleteRequisition(requisition.id);
      toast.success('Requisition deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete requisition');
    }
  };

  const handleSubmit = async () => {
    if (!formData.patient || !formData.requesting_doctor_id || !formData.content_type || !formData.object_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (drawerMode === 'create') {
        const createdRequisition = await createRequisition(formData as CreateRequisitionPayload);

        // Create diagnostic orders for selected investigations
        for (const investigationId of selectedInvestigations) {
          await createDiagnosticOrder({
            requisition: createdRequisition.id,
            investigation: investigationId,
            status: 'pending',
          });
        }

        toast.success('Requisition created successfully');
      } else if (drawerMode === 'edit' && selectedRequisition) {
        await updateRequisition(selectedRequisition.id, formData);
        toast.success('Requisition updated successfully');
      }
      setDrawerOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setFormData({ priority: 'routine', status: 'ordered' });
    setSelectedInvestigations([]);
    setSelectedRequisition(null);
  };

  const handleInvestigationToggle = (investigationId: number) => {
    setSelectedInvestigations((prev) =>
      prev.includes(investigationId)
        ? prev.filter((id) => id !== investigationId)
        : [...prev, investigationId]
    );
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
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              Requisitions
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage test orders
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Requisition
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by requisition number or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as RequisitionStatus | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as RequisitionType | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <DataTable
          rows={filteredRequisitions}
          columns={columns}
          isLoading={isLoading}
          onRowClick={handleView}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.requisition_number}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyTitle="No requisitions found"
          emptySubtitle="Create your first requisition to get started"
          renderMobileCard={(row, actions) => {
            const counts = {
              investigation: row.investigation_orders?.length || 0,
              medicine: row.medicine_orders?.length || 0,
              procedure: row.procedure_orders?.length || 0,
              package: row.package_orders?.length || 0,
            };
            const count = counts[row.requisition_type] || 0;
            const labels = {
              investigation: 'tests',
              medicine: 'medicines',
              procedure: 'procedures',
              package: 'packages',
            };
            const label = labels[row.requisition_type] || 'items';

            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-semibold text-sm text-primary">{row.requisition_number}</div>
                    <div className="font-medium mt-1">{row.patient_name}</div>
                  </div>
                  <div className="flex gap-1 flex-col items-end">
                    <Badge className={STATUS_COLORS[row.status]}>
                      <span className="flex items-center gap-1">
                        {STATUS_OPTIONS.find((s) => s.value === row.status)?.icon}
                        {STATUS_OPTIONS.find((s) => s.value === row.status)?.label}
                      </span>
                    </Badge>
                    <Badge className={TYPE_COLORS[row.requisition_type]}>
                      <span className="flex items-center gap-1">
                        {TYPE_OPTIONS.find((t) => t.value === row.requisition_type)?.icon}
                        {TYPE_OPTIONS.find((t) => t.value === row.requisition_type)?.label}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{format(new Date(row.order_date), 'MMM dd, yyyy')}</span>
                  <span>{count} {label}</span>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Side Drawer */}
      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClose={handleDrawerClose}
        title={
          drawerMode === 'create'
            ? 'New Requisition'
            : drawerMode === 'edit'
            ? 'Edit Requisition'
            : 'Requisition Details'
        }
        mode={drawerMode}
        footerButtons={drawerButtons}
        size="xl"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            {drawerMode === 'view' && <TabsTrigger value="orders">Orders</TabsTrigger>}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Patient */}
            <PatientSelect
              value={formData.patient || null}
              onChange={(patientId) => setFormData({ ...formData, patient: patientId })}
              disabled={drawerMode === 'view'}
              label="Patient"
              required={true}
            />

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value as RequisitionPriority })
                }
                disabled={drawerMode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            {drawerMode !== 'create' && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as RequisitionStatus })
                  }
                  disabled={drawerMode === 'view'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Clinical Notes */}
            <div className="space-y-2">
              <Label htmlFor="clinical_notes">Clinical Notes</Label>
              <Textarea
                id="clinical_notes"
                placeholder="Enter clinical notes..."
                value={formData.clinical_notes || ''}
                onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                disabled={drawerMode === 'view'}
                rows={4}
              />
            </div>

            {/* Encounter fields - simplified for now */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="content_type">
                  Content Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="content_type"
                  type="number"
                  placeholder="Content Type ID"
                  value={formData.content_type || ''}
                  onChange={(e) => setFormData({ ...formData, content_type: parseInt(e.target.value) })}
                  disabled={drawerMode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="object_id">
                  Object ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="object_id"
                  type="number"
                  placeholder="Object ID"
                  value={formData.object_id || ''}
                  onChange={(e) => setFormData({ ...formData, object_id: parseInt(e.target.value) })}
                  disabled={drawerMode === 'view'}
                />
              </div>
            </div>

            {/* Requesting Doctor */}
            <DoctorSelect
              value={formData.requesting_doctor_id || null}
              onChange={(doctorUserId) => setFormData({ ...formData, requesting_doctor_id: doctorUserId as string })}
              disabled={drawerMode === 'view'}
              label="Requesting Doctor"
              required={true}
              returnUserId={true}
            />
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="tests" className="space-y-4 mt-6">
            <div className="text-sm text-muted-foreground mb-4">
              {drawerMode === 'create' ? 'Select items for this requisition:' : 'Items in this requisition:'}
            </div>
            {drawerMode === 'create' ? (
              <div className="space-y-2">
                {investigations.filter(inv => inv.is_active).map((investigation) => (
                  <Card
                    key={investigation.id}
                    className={`cursor-pointer transition-all ${
                      selectedInvestigations.includes(investigation.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleInvestigationToggle(investigation.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{investigation.name}</div>
                          <div className="text-sm text-muted-foreground">{investigation.code}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{parseFloat(investigation.base_charge).toLocaleString()}</div>
                          <input
                            type="checkbox"
                            checked={selectedInvestigations.includes(investigation.id)}
                            onChange={() => handleInvestigationToggle(investigation.id)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Investigation Orders */}
                {selectedRequisition?.requisition_type === 'investigation' && selectedRequisition?.investigation_orders && selectedRequisition.investigation_orders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Investigations ({selectedRequisition.investigation_orders.length})
                    </h4>
                    {selectedRequisition.investigation_orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{order.investigation_name}</div>
                              <div className="text-sm text-muted-foreground">Sample ID: {order.sample_id || 'N/A'}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</div>
                              <Badge variant="outline" className="mt-1">{order.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Medicine Orders */}
                {selectedRequisition?.requisition_type === 'medicine' && selectedRequisition?.medicine_orders && selectedRequisition.medicine_orders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medicines ({selectedRequisition.medicine_orders.length})
                    </h4>
                    {selectedRequisition.medicine_orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{order.product_name}</div>
                              <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</div>
                              <Badge variant="outline" className="mt-1">{order.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Procedure Orders */}
                {selectedRequisition?.requisition_type === 'procedure' && selectedRequisition?.procedure_orders && selectedRequisition.procedure_orders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Procedures ({selectedRequisition.procedure_orders.length})
                    </h4>
                    {selectedRequisition.procedure_orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{order.procedure_name}</div>
                              <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</div>
                              <Badge variant="outline" className="mt-1">{order.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Package Orders */}
                {selectedRequisition?.requisition_type === 'package' && selectedRequisition?.package_orders && selectedRequisition.package_orders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Packages ({selectedRequisition.package_orders.length})
                    </h4>
                    {selectedRequisition.package_orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{order.package_name}</div>
                              <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</div>
                              <Badge variant="outline" className="mt-1">{order.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab - Only in view mode */}
          {drawerMode === 'view' && (
            <TabsContent value="orders" className="space-y-4 mt-6">
              {/* Investigation Orders */}
              {selectedRequisition?.requisition_type === 'investigation' && selectedRequisition?.investigation_orders && selectedRequisition.investigation_orders.length > 0 ? (
                <div className="space-y-3">
                  {selectedRequisition.investigation_orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{order.investigation_name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Order ID: #{order.id}
                              </div>
                            </div>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sample ID:</span>{' '}
                              <span className="font-mono">{order.sample_id || 'N/A'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">Price:</span>{' '}
                              <span className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : selectedRequisition?.requisition_type === 'medicine' && selectedRequisition?.medicine_orders && selectedRequisition.medicine_orders.length > 0 ? (
                <div className="space-y-3">
                  {selectedRequisition.medicine_orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{order.product_name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Order ID: #{order.id}
                              </div>
                            </div>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Quantity:</span>{' '}
                              <span className="font-mono">{order.quantity}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">Price:</span>{' '}
                              <span className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : selectedRequisition?.requisition_type === 'procedure' && selectedRequisition?.procedure_orders && selectedRequisition.procedure_orders.length > 0 ? (
                <div className="space-y-3">
                  {selectedRequisition.procedure_orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{order.procedure_name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Order ID: #{order.id}
                              </div>
                            </div>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Quantity:</span>{' '}
                              <span className="font-mono">{order.quantity}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">Price:</span>{' '}
                              <span className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : selectedRequisition?.requisition_type === 'package' && selectedRequisition?.package_orders && selectedRequisition.package_orders.length > 0 ? (
                <div className="space-y-3">
                  {selectedRequisition.package_orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{order.package_name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Order ID: #{order.id}
                              </div>
                            </div>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Quantity:</span>{' '}
                              <span className="font-mono">{order.quantity}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">Price:</span>{' '}
                              <span className="font-semibold">₹{parseFloat(order.price).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No orders found
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </SideDrawer>
    </div>
  );
};

export default Requisitions;
