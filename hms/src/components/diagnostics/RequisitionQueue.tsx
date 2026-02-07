// src/components/diagnostics/RequisitionQueue.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { SideDrawer, DrawerActionButton } from '@/components/SideDrawer';
import { PatientSelect } from '@/components/form/PatientSelect';
import { DoctorSelect } from '@/components/form/DoctorSelect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { patientService } from '@/services/patient.service';
import { doctorService } from '@/services/doctorService';
import type {
  CreateRequisitionPayload,
  EncounterType,
  Investigation,
  Requisition,
  RequisitionPriority,
  RequisitionStatus,
} from '@/types/diagnostics.types';

const ENCOUNTER_OPTIONS: { value: EncounterType; label: string }[] = [
  { value: 'opd.visit', label: 'OPD Visit' },
  { value: 'ipd.admission', label: 'IPD Admission' },
];

const PRIORITY_LABELS: Record<RequisitionPriority, string> = {
  routine: 'Routine',
  urgent: 'Urgent',
  stat: 'STAT',
};

const PRIORITY_STYLES: Record<RequisitionPriority, string> = {
  routine: 'bg-slate-100 text-slate-700',
  urgent: 'bg-amber-100 text-amber-800',
  stat: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<RequisitionStatus, string> = {
  ordered: 'Ordered',
  sample_collected: 'Sample Collected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<RequisitionStatus, string> = {
  ordered: 'bg-blue-100 text-blue-700',
  sample_collected: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

type RequisitionFormState = {
  patient?: number | null;
  requesting_doctor_id?: string | null;
  priority: RequisitionPriority;
  clinical_notes?: string;
  encounter_type?: EncounterType;
  encounter_id?: number | null;
  status?: RequisitionStatus;
};

const defaultFormState: RequisitionFormState = {
  priority: 'routine',
  clinical_notes: '',
  encounter_type: undefined,
  encounter_id: null,
  patient: null,
  requesting_doctor_id: null,
  status: 'ordered',
};

export const RequisitionQueue: React.FC = () => {
  const { useRequisitions, updateRequisition, createRequisition, useInvestigations } =
    useDiagnostics();
  const navigate = useNavigate();

  const { data: requisitionsData, isLoading, mutate } = useRequisitions({
    status: 'ordered',
    ordering: '-priority,-order_date',
  });
  const { data: investigationsData, isLoading: isLoadingInvestigations } = useInvestigations({
    is_active: true,
  });

  const requisitions = requisitionsData?.results || [];
  const investigations = investigationsData?.results || [];

  const [drawerMode, setDrawerMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<RequisitionFormState>(defaultFormState);
  const [selectedInvestigations, setSelectedInvestigations] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientNames, setPatientNames] = useState<Record<number, string>>({});
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  // Prefetch patient and doctor names for nicer list display
  useEffect(() => {
    if (!requisitions.length) return;

    const loadNames = async () => {
      const patientIds = Array.from(new Set(requisitions.map((r) => r.patient).filter(Boolean))) as number[];
      const doctorUserIds = Array.from(
        new Set(requisitions.map((r) => r.requesting_doctor_id).filter(Boolean))
      ) as string[];

      // Patients
      const patientEntries = await Promise.all(
        patientIds
          .filter((id) => !patientNames[id])
          .map(async (id) => {
            try {
              const p = await patientService.getPatient(id);
              const fullName =
                (p as any).full_name ||
                (p as any).user?.full_name ||
                `${(p as any).user?.first_name || ''} ${(p as any).user?.last_name || ''}`.trim();
              return [id, fullName || `Patient #${id}`] as const;
            } catch {
              return [id, `Patient #${id}`] as const;
            }
          })
      );
      if (patientEntries.length) {
        setPatientNames((prev) => ({ ...prev, ...Object.fromEntries(patientEntries) }));
      }

      // Doctors: try search by user_id (UUID) via doctorService list
      const doctorEntries = await Promise.all(
        doctorUserIds
          .filter((id) => !doctorNames[id])
          .map(async (userId) => {
            try {
              const res = await doctorService.getDoctors({ search: userId, page_size: 1 });
              const doc = res.results?.[0];
              const name =
                doc?.full_name ||
                `${doc?.user?.first_name || ''} ${doc?.user?.last_name || ''}`.trim();
              return [userId, name || `Doctor ${userId.slice(0, 6)}`] as const;
            } catch {
              return [userId, `Doctor ${userId.slice(0, 6)}`] as const;
            }
          })
      );
      if (doctorEntries.length) {
        setDoctorNames((prev) => ({ ...prev, ...Object.fromEntries(doctorEntries) }));
      }
    };

    loadNames();
  }, [requisitions, patientNames, doctorNames]);

  const columns: DataTableColumn<Requisition>[] = useMemo(
    () => [
      {
        key: 'requisition_number',
        header: 'Req #',
        accessor: (row) => row.requisition_number,
        cell: (row) => <span className="font-mono font-semibold text-sm">{row.requisition_number}</span>,
        sortable: true,
        filterable: true,
      },
      {
        key: 'patient_name',
        header: 'Patient',
        accessor: (row) => row.patient_name,
        cell: (row) => (
          <div className="space-y-0.5">
            <button
              className="font-medium text-primary hover:underline text-left"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/patients/${row.patient}`);
              }}
            >
              {row.patient_name || patientNames[row.patient] || `Patient #${row.patient}`}
            </button>
            <div className="text-xs text-muted-foreground">#{row.patient}</div>
          </div>
        ),
        sortable: true,
        filterable: true,
      },
      {
        key: 'priority',
        header: 'Priority',
        accessor: (row) => row.priority,
        cell: (row) => (
          <Badge className={PRIORITY_STYLES[row.priority]}>
            {PRIORITY_LABELS[row.priority]}
          </Badge>
        ),
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        accessor: (row) => row.status,
        cell: (row) => (
          <Badge className={STATUS_STYLES[row.status]}>
            {STATUS_LABELS[row.status]}
          </Badge>
        ),
        sortable: true,
      },
      {
        key: 'investigation_orders',
        header: 'Tests',
        accessor: (row) => row.investigation_orders?.length || 0,
        cell: (row) => <span className="text-sm">{row.investigation_orders?.length || 0} tests</span>,
        sortable: true,
      },
      {
        key: 'billing_target',
        header: 'Billing Target',
        accessor: (row) => row.billing_target || '',
        cell: (row) =>
          row.billing_target ? (
            <Badge variant="outline">{row.billing_target}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
    ],
    [navigate, patientNames]
  );

  const handleStatusUpdate = async (id: number, status: RequisitionStatus) => {
    try {
      await updateRequisition(id, { status });
      toast.success(`Requisition updated to ${STATUS_LABELS[status]}`);
      mutate();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const handleToggleInvestigation = (investigationId: number) => {
    if (drawerMode !== 'create') return;
    setSelectedInvestigations((prev) =>
      prev.includes(investigationId)
        ? prev.filter((id) => id !== investigationId)
        : [...prev, investigationId]
    );
  };

  const handleSubmit = async () => {
    if (!formData.patient) {
      toast.error('Please select a patient.');
      return;
    }
    if (!formData.requesting_doctor_id) {
      toast.error('Please select a requesting doctor.');
      return;
    }

    const basePayload = {
      patient: formData.patient,
      requesting_doctor_id: formData.requesting_doctor_id,
      priority: formData.priority,
      clinical_notes: formData.clinical_notes || '',
      status: formData.status || 'ordered',
    };

    setIsSubmitting(true);
    try {
      if (drawerMode === 'create') {
        if (!formData.encounter_type || !formData.encounter_id) {
          toast.error('Encounter type and ID are required.');
          setIsSubmitting(false);
          return;
        }
        if (selectedInvestigations.length === 0) {
          toast.error('Select at least one investigation.');
          setIsSubmitting(false);
          return;
        }

        const payload: CreateRequisitionPayload = {
          ...basePayload,
          encounter_type: formData.encounter_type,
          encounter_id: formData.encounter_id,
          investigation_ids: selectedInvestigations,
        };
        await createRequisition(payload);
        toast.success('Requisition created');
      } else if (drawerMode === 'edit' && selectedRequisition) {
        await updateRequisition(selectedRequisition.id, basePayload);
        toast.success('Requisition updated');
      }

      setDrawerOpen(false);
      setFormData(defaultFormState);
      setSelectedInvestigations([]);
      setSelectedRequisition(null);
      setDrawerMode('create');
      mutate();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerButtons: DrawerActionButton[] = [
    {
      label: 'Cancel',
      onClick: () => {
        setDrawerOpen(false);
        setFormData(defaultFormState);
        setSelectedInvestigations([]);
        setSelectedRequisition(null);
        setDrawerMode('create');
      },
      variant: 'outline',
    },
    {
      label:
        drawerMode === 'create'
          ? 'Create Requisition'
          : drawerMode === 'edit'
          ? 'Save Changes'
          : 'Edit',
      onClick: () => {
        if (drawerMode === 'view') {
          setDrawerMode('edit');
        } else {
          handleSubmit();
        }
      },
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
              <CardTitle>Requisition Queue</CardTitle>
              <CardDescription>
                Ordered diagnostic tests waiting for sample collection and processing.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setFormData(defaultFormState);
                setSelectedInvestigations([]);
                setSelectedRequisition(null);
                setDrawerMode('create');
                setDrawerOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={requisitions}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.requisition_number}
            onRowClick={(row) => {
              setSelectedRequisition(row);
              setFormData({
                patient: row.patient,
                requesting_doctor_id: row.requesting_doctor_id,
                priority: row.priority,
                clinical_notes: row.clinical_notes,
                status: row.status,
              });
              setSelectedInvestigations(row.investigation_orders.map((o) => o.investigation));
              setDrawerMode('view');
              setDrawerOpen(true);
            }}
            onDelete={(row) => handleStatusUpdate(row.id, 'cancelled')}
            extraActions={(row) => (
              <>
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate((row as Requisition).id, 'sample_collected')}
                  disabled={(row as Requisition).status !== 'ordered'}
                >
                  Mark Sample Collected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate((row as Requisition).id, 'completed')}
                  disabled={(row as Requisition).status !== 'sample_collected'}
                >
                  Mark Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleStatusUpdate((row as Requisition).id, 'cancelled')}
                >
                  Cancel Requisition
                </DropdownMenuItem>
              </>
            )}
            renderMobileCard={(row) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-semibold text-sm text-primary">
                      {row.requisition_number}
                    </div>
                    <div className="font-medium">{row.patient_name}</div>
                  </div>
                  <Badge className={STATUS_STYLES[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <Badge variant="outline">{PRIORITY_LABELS[row.priority]}</Badge>
                  <span>{row.investigation_orders?.length || 0} tests</span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onClose={() => {
          setFormData(defaultFormState);
          setSelectedInvestigations([]);
          setSelectedRequisition(null);
          setDrawerMode('create');
        }}
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
        <div className="space-y-6">
          <PatientSelect
            value={formData.patient || null}
            onChange={(patientId) => setFormData({ ...formData, patient: patientId })}
            label="Patient"
            required
            disabled={drawerMode === 'view'}
          />

          <DoctorSelect
            value={formData.requesting_doctor_id || null}
            onChange={(doctorUserId) =>
              setFormData({ ...formData, requesting_doctor_id: doctorUserId as string })
            }
            label="Requesting Doctor"
            required
            returnUserId
            disabled={drawerMode === 'view'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="encounter_type">Encounter Type</Label>
              <Select
                value={formData.encounter_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, encounter_type: value as EncounterType })
                }
                disabled={drawerMode !== 'create'}
              >
                <SelectTrigger id="encounter_type">
                  <SelectValue placeholder="Select encounter type" />
                </SelectTrigger>
                <SelectContent>
                  {ENCOUNTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="encounter_id">Encounter ID</Label>
              <Input
                id="encounter_id"
                type="number"
                min="1"
                placeholder="Visit or admission ID"
                value={formData.encounter_id ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, encounter_id: Number(e.target.value) || null })
                }
                disabled={drawerMode !== 'create'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value as RequisitionPriority })
                }
                disabled={drawerMode === 'view'}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes for the lab team"
                value={formData.clinical_notes || ''}
                onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Investigations</Label>
              <Badge variant="outline">{selectedInvestigations.length} selected</Badge>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border p-3 space-y-2">
              {isLoadingInvestigations ? (
                <p className="text-sm text-muted-foreground">Loading investigations...</p>
              ) : investigations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No investigations available.</p>
              ) : (
                investigations.map((inv: Investigation) => {
                  const checked = selectedInvestigations.includes(inv.id);
                  return (
                    <label
                      key={inv.id}
                      className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:border-primary/60"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => handleToggleInvestigation(inv.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{inv.name}</div>
                          <span className="text-sm font-semibold">
                            Rs. {Number.parseFloat(inv.base_charge).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{inv.code}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-md border p-3 bg-muted/30 text-sm text-muted-foreground">
            Payload uses smart fields:
            <span className="font-semibold text-foreground"> encounter_type</span> (e.g.,{' '}
            <code className="font-mono text-xs">opd.visit</code>) and{' '}
            <span className="font-semibold text-foreground">encounter_id</span>. Selected tests are
            sent as <code className="font-mono text-xs">investigation_ids</code>.
          </div>
        </div>
      </SideDrawer>
    </>
  );
};
