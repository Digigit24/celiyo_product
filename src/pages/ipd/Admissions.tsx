// src/pages/ipd/Admissions.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { useIPD } from '@/hooks/useIPD';
import { Admission, ADMISSION_STATUS_LABELS } from '@/types/ipd.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { AdmissionFormDrawer } from '@/components/ipd/AdmissionFormDrawer';

export default function Admissions() {
  const navigate = useNavigate();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [dischargeData, setDischargeData] = useState({
    discharge_type: 'Normal',
    discharge_summary: '',
  });

  const { useAdmissions, dischargePatient } = useIPD();

  const { data: admissionsData, isLoading, error: fetchError, mutate } = useAdmissions({ search: searchQuery });

  const admissions = admissionsData?.results || [];

  // Show error state if data fetch fails
  if (fetchError && !isLoading && admissions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">IPD Admissions</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-destructive">Failed to load admissions</p>
            <p className="text-sm text-muted-foreground mt-2">{fetchError.message || 'An error occurred'}</p>
            <Button className="mt-4" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Discharge
  const handleDischarge = async () => {
    if (!selectedAdmission) return;

    try {
      await dischargePatient(selectedAdmission.id, dischargeData);
      toast({
        title: 'Success',
        description: 'Patient discharged successfully',
      });
      setIsDischargeDialogOpen(false);
      setSelectedAdmission(null);
      setDischargeData({ discharge_type: 'Normal', discharge_summary: '' });
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to discharge patient',
        variant: 'destructive',
      });
    }
  };

  // Open Discharge Dialog
  const openDischargeDialog = (admission: Admission) => {
    setSelectedAdmission(admission);
    setIsDischargeDialogOpen(true);
  };

  // View Details
  const viewDetails = (admission: Admission) => {
    navigate(`/ipd/admissions/${admission.id}`);
  };

  // DataTable columns
  const columns: DataTableColumn<Admission>[] = [
    {
      header: 'Admission ID',
      key: 'admission_id',
      sortable: true,
      filterable: true,
      accessor: (row) => row.admission_id,
      cell: (row) => (
        <span className="font-mono font-medium">{row.admission_id}</span>
      ),
    },
    {
      header: 'Patient',
      key: 'patient_name',
      sortable: true,
      filterable: true,
      accessor: (row) => row.patient_name || '',
      cell: (row) => (
        <span className="font-medium">{row.patient_name}</span>
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
      header: 'Bed',
      key: 'bed_number',
      sortable: true,
      accessor: (row) => row.bed_number || '',
      cell: (row) => (
        <span className="font-mono text-sm">{row.bed_number || '-'}</span>
      ),
    },
    {
      header: 'Admission Date',
      key: 'admission_date',
      sortable: true,
      accessor: (row) => row.admission_date,
      cell: (row) => {
        try {
          return (
            <span className="text-sm">
              {format(new Date(row.admission_date), 'dd MMM yyyy HH:mm')}
            </span>
          );
        } catch {
          return <span className="text-sm text-muted-foreground">Invalid date</span>;
        }
      },
    },
    {
      header: 'Length of Stay',
      key: 'length_of_stay',
      sortable: true,
      accessor: (row) => row.length_of_stay || 0,
      cell: (row) => (
        <span className="text-sm">
          {row.length_of_stay} {row.length_of_stay === 1 ? 'day' : 'days'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      filterable: true,
      accessor: (row) => row.status,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            row.status === 'admitted'
              ? 'bg-blue-100 text-blue-700'
              : row.status === 'discharged'
              ? 'bg-green-100 text-green-700'
              : row.status === 'transferred'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {ADMISSION_STATUS_LABELS[row.status]}
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
            <h1 className="text-2xl font-bold">IPD Admissions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage patient admissions and discharges
            </p>
          </div>
          <Button onClick={() => setIsCreateDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Admission
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <Input
            placeholder="Search admissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <DataTable
          rows={admissions}
          isLoading={isLoading}
          columns={columns}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${row.admission_id} - ${row.patient_name}`}
          onView={viewDetails}
          extraActions={(row) => (
            <>
              {row.status === 'admitted' && (
                <button
                  onClick={() => openDischargeDialog(row)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Discharge
                </button>
              )}
            </>
          )}
          renderMobileCard={(row, actions) => (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold text-sm">{row.admission_id}</span>
                {actions.dropdown}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-medium">{row.patient_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ward:</span>
                  <span>{row.ward_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bed:</span>
                  <span className="font-mono text-xs">{row.bed_number || '-'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admitted:</span>
                  <span className="text-xs">
                    {format(new Date(row.admission_date), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length of Stay:</span>
                  <span>{row.length_of_stay} days</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      row.status === 'admitted'
                        ? 'bg-blue-100 text-blue-700'
                        : row.status === 'discharged'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ADMISSION_STATUS_LABELS[row.status]}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => viewDetails(row)} className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                {row.status === 'admitted' && (
                  <Button size="sm" variant="outline" onClick={() => openDischargeDialog(row)} className="flex-1">
                    <FileText className="h-3 w-3 mr-1" />
                    Discharge
                  </Button>
                )}
              </div>
            </div>
          )}
          emptyTitle="No admissions found"
          emptySubtitle="Create a new admission to get started"
        />
      </div>

      {/* Create Admission Drawer */}
      <AdmissionFormDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onSuccess={mutate}
      />

      {/* Discharge Dialog */}
      <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Discharge Patient</DialogTitle>
            <DialogDescription>
              Discharge {selectedAdmission?.patient_name} from {selectedAdmission?.ward_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="discharge_type">Discharge Type *</Label>
              <Input
                id="discharge_type"
                value={dischargeData.discharge_type}
                onChange={(e) => setDischargeData({ ...dischargeData, discharge_type: e.target.value })}
                placeholder="e.g., Normal, Against Medical Advice"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discharge_summary">Discharge Summary</Label>
              <Textarea
                id="discharge_summary"
                value={dischargeData.discharge_summary}
                onChange={(e) => setDischargeData({ ...dischargeData, discharge_summary: e.target.value })}
                placeholder="Enter discharge summary and instructions"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDischargeDialogOpen(false);
              setSelectedAdmission(null);
              setDischargeData({ discharge_type: 'Normal', discharge_summary: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleDischarge}>Discharge Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}