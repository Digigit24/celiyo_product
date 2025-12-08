// src/components/PatientsFormDrawer.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Phone, Mail, FileText, Calendar, DollarSign, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import type { Patient, PatientCreateData, PatientUpdateData } from '@/types/patient.types';
import { usePatient } from '@/hooks/usePatient';

import PatientBasicInfo from './patient-drawer/PatientBasicInfo';
import PatientVisitHistory from './patient-drawer/PatientVisitHistory';
import PatientBillingHistory from './patient-drawer/PatientBillingHistory';
import PatientAppointments from './patient-drawer/PatientAppointments';
import OPDVisitFormDrawer from './OPDVisitFormDrawer';
import { SideDrawer, type DrawerActionButton, type DrawerHeaderAction } from '@/components/SideDrawer';

// Form handle interface for collecting form values
export interface PatientBasicInfoHandle {
  getFormValues: () => Promise<PatientCreateData | PatientUpdateData | null>;
}

interface PatientsFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number | null;
  mode: 'view' | 'edit' | 'create';
  onSuccess?: () => void;
  onDelete?: (id: number) => void;
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;
}

export default function PatientsFormDrawer({
  open,
  onOpenChange,
  patientId,
  mode,
  onSuccess,
  onDelete,
  onModeChange,
}: PatientsFormDrawerProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentMode, setCurrentMode] = useState(mode);
  const [isSaving, setIsSaving] = useState(false);

  // Visit drawer state
  const [visitDrawerOpen, setVisitDrawerOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  // Hooks
  const {
    usePatientById,
    createPatient,
    updatePatient,
    deletePatient,
  } = usePatient();

  const { data: patient, isLoading: patientLoading, mutate: revalidatePatient } = usePatientById(patientId);

  // Form ref to collect values
  const formRef = useRef<PatientBasicInfoHandle | null>(null);

  // Sync internal mode with prop
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Reset tab when opening
  useEffect(() => {
    if (open) {
      setActiveTab('basic');
    }
  }, [open]);

  const handleSuccess = useCallback(() => {
    if (currentMode !== 'create') {
      revalidatePatient();
    }
    onSuccess?.();
  }, [currentMode, onSuccess, revalidatePatient]);

  const handleClose = useCallback(() => {
    setActiveTab('basic');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSwitchToEdit = useCallback(() => {
    setCurrentMode('edit');
    onModeChange?.('edit');
  }, [onModeChange]);

  const handleSwitchToView = useCallback(() => {
    setCurrentMode('view');
    onModeChange?.('view');
  }, [onModeChange]);

  const handleDelete = useCallback(async () => {
    if (!patientId) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${patient?.full_name}? This action cannot be undone.`
      )
    ) {
      try {
        await deletePatient(patientId);
        toast.success('Patient deleted successfully');
        onDelete?.(patientId);
        handleClose();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to delete patient');
      }
    }
  }, [patientId, patient, deletePatient, onDelete, handleClose]);

  const handleViewVisit = useCallback((visitId: number) => {
    setSelectedVisitId(visitId);
    setVisitDrawerOpen(true);
  }, []);

  const handleViewAppointment = useCallback((appointmentId: number) => {
    // You can implement appointment drawer navigation here if needed
    console.log('View appointment:', appointmentId);
    toast.info('Appointment details coming soon');
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (currentMode === 'create') {
        // CREATE FLOW
        const values = await formRef.current?.getFormValues();

        if (!values) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Creating patient with values:', values);

        await createPatient(values as PatientCreateData);

        toast.success('Patient created successfully');
        handleSuccess();
        handleClose();
      } else if (currentMode === 'edit') {
        // EDIT FLOW
        const values = await formRef.current?.getFormValues();

        if (!values || !patientId) {
          toast.error('Please fill in all required fields correctly');
          return;
        }

        console.log('Updating patient with values:', values);

        await updatePatient(patientId, values as PatientUpdateData);

        toast.success('Patient updated successfully');
        handleSuccess();
        handleSwitchToView();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save patient'
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMode, patientId, createPatient, updatePatient, handleSuccess, handleClose, handleSwitchToView]);

  const drawerTitle =
    currentMode === 'create'
      ? 'Register New Patient'
      : patient
      ? patient.full_name
      : 'Patient Details';

  const drawerDescription =
    currentMode === 'create'
      ? undefined
      : patient
      ? `${patient.patient_id} • Age: ${patient.age} • ${patient.gender}`
      : undefined;

  const headerActions: DrawerHeaderAction[] =
    currentMode === 'view' && patient
      ? [
          {
            icon: Phone,
            onClick: () => {
              console.log('Call patient');
              window.open(`tel:${patient.mobile_primary}`, '_self');
            },
            label: 'Call patient',
            variant: 'ghost',
          },
          {
            icon: Mail,
            onClick: () => {
              if (patient.email) {
                window.open(`mailto:${patient.email}`, '_self');
              } else {
                toast.info('No email address available');
              }
            },
            label: 'Email patient',
            variant: 'ghost',
          },
          {
            icon: FileText,
            onClick: () => {
              console.log('View medical records');
              toast.info('Medical records feature coming soon');
            },
            label: 'View records',
            variant: 'ghost',
          },
          {
            icon: Pencil,
            onClick: handleSwitchToEdit,
            label: 'Edit patient',
            variant: 'ghost',
          },
          {
            icon: Trash2,
            onClick: handleDelete,
            label: 'Delete patient',
            variant: 'ghost',
          },
        ]
      : [];

  const footerButtons: DrawerActionButton[] =
    currentMode === 'view'
      ? [
          {
            label: 'Close',
            onClick: handleClose,
            variant: 'outline',
          },
        ]
      : currentMode === 'edit'
      ? [
          {
            label: 'Cancel',
            onClick: handleSwitchToView,
            variant: 'outline',
            disabled: isSaving,
          },
          {
            label: 'Save Changes',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ]
      : [
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'outline',
            disabled: isSaving,
          },
          {
            label: 'Register Patient',
            onClick: handleSave,
            variant: 'default',
            loading: isSaving,
          },
        ];

  const isLoading = patientLoading;

  const drawerContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${currentMode === 'view' && patient ? 'grid-cols-4' : 'grid-cols-1'}`}>
          <TabsTrigger value="basic">
            <FileText className="h-4 w-4 mr-2" />
            Information
          </TabsTrigger>
          {currentMode === 'view' && patient && (
            <>
              <TabsTrigger value="visits">
                <ClipboardList className="h-4 w-4 mr-2" />
                Visits
              </TabsTrigger>
              <TabsTrigger value="billing">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <Calendar className="h-4 w-4 mr-2" />
                Appointments
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="basic" className="mt-6 space-y-6">
          <PatientBasicInfo
            ref={formRef}
            patient={patient}
            mode={currentMode}
            onSuccess={handleSuccess}
          />
        </TabsContent>

        {currentMode === 'view' && patient && (
          <>
            <TabsContent value="visits" className="mt-6">
              <PatientVisitHistory patientId={patient.id} onViewVisit={handleViewVisit} />
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <PatientBillingHistory patientId={patient.id} />
            </TabsContent>

            <TabsContent value="appointments" className="mt-6">
              <PatientAppointments patientId={patient.id} onViewAppointment={handleViewAppointment} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );

  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={drawerTitle}
        description={drawerDescription}
        mode={currentMode}
        headerActions={headerActions}
        isLoading={isLoading}
        loadingText="Loading patient data..."
        size="lg"
        footerButtons={footerButtons}
        footerAlignment="right"
        showBackButton={true}
        resizable={true}
        storageKey="patient-drawer-width"
        onClose={handleClose}
      >
        {drawerContent}
      </SideDrawer>

      {/* Visit Details Drawer */}
      {patient && (
        <OPDVisitFormDrawer
          open={visitDrawerOpen}
          onOpenChange={setVisitDrawerOpen}
          visitId={selectedVisitId}
          mode="view"
          onSuccess={() => {
            // Refresh visit history when visit is updated
            setVisitDrawerOpen(false);
          }}
        />
      )}
    </>
  );
}
