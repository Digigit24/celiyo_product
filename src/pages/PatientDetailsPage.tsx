// src/pages/PatientDetailsPage.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Trash2, Phone, Mail, Loader2, Calendar, IndianRupee, Activity } from 'lucide-react';
import { toast } from 'sonner';

import { usePatient } from '@/hooks/usePatient';
import PatientBasicInfo, { PatientBasicInfoHandle } from '@/components/patient-drawer/PatientBasicInfo';
import PatientVisitHistory from '@/components/patient-drawer/PatientVisitHistory';
import PatientBillingHistory from '@/components/patient-drawer/PatientBillingHistory';
import PatientAppointments from '@/components/patient-drawer/PatientAppointments';
import OPDVisitFormDrawer from '@/components/OPDVisitFormDrawer';
import AppointmentFormDrawer from '@/components/AppointmentFormDrawer';
import { OPDBillFormDrawer } from '@/components/OPDBillFormDrawer';
import type { PatientUpdateData } from '@/types/patient.types';

export const PatientDetailsPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Visit drawer state
  const [visitDrawerOpen, setVisitDrawerOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  // Appointment drawer state
  const [appointmentDrawerOpen, setAppointmentDrawerOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [appointmentDrawerMode, setAppointmentDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  // Bill drawer state
  const [billDrawerOpen, setBillDrawerOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [billDrawerMode, setBillDrawerMode] = useState<'view' | 'edit' | 'create'>('view');

  // Hooks
  const { usePatientById, updatePatient, deletePatient } = usePatient();

  // Parse patientId to number
  const patientIdNum = patientId ? parseInt(patientId, 10) : null;

  // Fetch patient data
  const {
    data: patient,
    error: patientError,
    isLoading: patientLoading,
    mutate: mutatePatient
  } = usePatientById(patientIdNum);

  // Form ref
  const formRef = useRef<PatientBasicInfoHandle | null>(null);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/patients');
  }, [navigate]);

  // Handle edit mode toggle
  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!patient || !formRef.current) return;

    try {
      setIsSaving(true);
      const formValues = await formRef.current.getFormValues();

      if (!formValues) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Update the patient
      await updatePatient(patient.id, formValues as PatientUpdateData);
      await mutatePatient();
      toast.success('Patient updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update patient');
      console.error('Failed to update patient:', error);
    } finally {
      setIsSaving(false);
    }
  }, [patient, updatePatient, mutatePatient]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!patient) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${patient.full_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deletePatient(patient.id);
      toast.success('Patient deleted successfully');
      navigate('/patients');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete patient');
      console.error('Failed to delete patient:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [patient, deletePatient, navigate]);

  // Handle call
  const handleCall = useCallback(() => {
    if (patient?.mobile_primary) {
      window.location.href = `tel:${patient.mobile_primary}`;
    }
  }, [patient]);

  // Handle email
  const handleEmail = useCallback(() => {
    if (patient?.email) {
      window.location.href = `mailto:${patient.email}`;
    }
  }, [patient]);

  // Handle new visit
  const handleNewVisit = useCallback(() => {
    setSelectedVisitId(null);
    setVisitDrawerOpen(true);
  }, []);

  // Handle visit drawer success
  const handleVisitSuccess = useCallback(() => {
    // Refresh patient data if needed
    mutatePatient();
  }, [mutatePatient]);

  // Handle new appointment
  const handleNewAppointment = useCallback(() => {
    setSelectedAppointmentId(null);
    setAppointmentDrawerMode('create');
    setAppointmentDrawerOpen(true);
  }, []);

  // Handle appointment drawer success
  const handleAppointmentSuccess = useCallback(() => {
    mutatePatient();
  }, [mutatePatient]);

  // Handle view appointment
  const handleViewAppointment = useCallback((appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setAppointmentDrawerMode('view');
    setAppointmentDrawerOpen(true);
  }, []);

  // Handle new bill
  const handleNewBill = useCallback(() => {
    setSelectedBillId(null);
    setBillDrawerMode('create');
    setBillDrawerOpen(true);
  }, []);

  // Handle bill drawer success
  const handleBillSuccess = useCallback(() => {
    mutatePatient();
  }, [mutatePatient]);

  // Note: handleViewVisit removed - visits now navigate directly to consultation page

  // Loading state
  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (patientError || !patient) {
    return (
      <div className="p-6 max-w-8xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive text-lg">
            {patientError ? 'Failed to load patient details' : 'Patient not found'}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    active: { label: 'Active', className: 'bg-green-600' },
    inactive: { label: 'Inactive', className: 'bg-gray-600' },
    deceased: { label: 'Deceased', className: 'bg-red-600' },
  };
  const config = statusConfig[patient.status];

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            onClick={handleBack}
            variant="outline"
            size="icon"
            className="mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{patient.full_name}</h1>
              <Badge variant="default" className={config.className}>
                {config.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{patient.patient_id}</span>
              {patient.mobile_primary && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {patient.mobile_primary}
                  </span>
                </>
              )}
              {patient.age && (
                <>
                  <span>•</span>
                  <span>{patient.age} years</span>
                </>
              )}
              {patient.gender && (
                <>
                  <span>•</span>
                  <span className="capitalize">{patient.gender}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              {patient.mobile_primary && (
                <Button onClick={handleCall} variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              {patient.email && (
                <Button onClick={handleEmail} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
              <Button onClick={handleNewVisit} variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                New Visit
              </Button>
              <Button onClick={handleEditToggle} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEditToggle} variant="outline" size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats Card */}
      {!isEditing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                  <p className="text-lg font-bold">{patient.total_visits || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                  <p className="text-sm font-semibold">
                    {patient.last_visit_date
                      ? new Date(patient.last_visit_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-lg font-bold font-mono">{patient.blood_group || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Insurance</p>
                  <p className="text-sm font-semibold truncate">
                    {patient.insurance_provider || 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="visits">OPD Visits</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        {/* Patient Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <PatientBasicInfo
                patient={patient}
                mode={isEditing ? 'edit' : 'view'}
                ref={formRef}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPD Visits Tab */}
        <TabsContent value="visits" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>OPD Visit History</CardTitle>
                <Button onClick={handleNewVisit} size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  New Visit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PatientVisitHistory
                patientId={patient.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Billing History</CardTitle>
                <Button onClick={handleNewBill} size="sm">
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Add Bill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PatientBillingHistory patientId={patient.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appointments</CardTitle>
                <Button onClick={handleNewAppointment} size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PatientAppointments
                patientId={patient.id}
                onViewAppointment={handleViewAppointment}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visit Drawer */}
      <OPDVisitFormDrawer
        open={visitDrawerOpen}
        onOpenChange={setVisitDrawerOpen}
        visitId={selectedVisitId}
        mode={selectedVisitId ? 'view' : 'create'}
        onSuccess={handleVisitSuccess}
        initialPatientId={patientIdNum}
      />

      {/* Appointment Drawer */}
      <AppointmentFormDrawer
        open={appointmentDrawerOpen}
        onOpenChange={setAppointmentDrawerOpen}
        appointmentId={selectedAppointmentId}
        mode={appointmentDrawerMode}
        onSuccess={handleAppointmentSuccess}
        onModeChange={setAppointmentDrawerMode}
        initialPatientId={patientIdNum}
      />

      {/* Bill Drawer */}
      <OPDBillFormDrawer
        isOpen={billDrawerOpen}
        onClose={() => setBillDrawerOpen(false)}
        billId={selectedBillId}
        mode={billDrawerMode}
        onSuccess={handleBillSuccess}
      />
    </div>
  );
};

export default PatientDetailsPage;
