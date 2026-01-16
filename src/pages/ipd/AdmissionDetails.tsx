// src/pages/ipd/AdmissionDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useIPD } from '@/hooks/useIPD';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Bed as BedIcon, IndianRupee, Activity, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { ADMISSION_STATUS_LABELS } from '@/types/ipd.types';
import AdmissionInfo from '@/components/ipd/AdmissionInfo';
import BedTransfersTab from '@/components/ipd/BedTransfersTab';
import BillingTab from '@/components/ipd/BillingTab';
import { IPDConsultationTab } from '@/components/ipd/IPDConsultationTab';

export default function AdmissionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'info');

  const { useAdmissionById } = useIPD();
  const { data: admission, isLoading, error: fetchError, mutate } = useAdmissionById(id ? parseInt(id) : null);

  // Update active tab when tab query parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading admission details...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !admission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {fetchError ? 'Failed to load admission' : 'Admission not found'}
          </p>
          {fetchError && (
            <p className="text-sm text-muted-foreground mt-2">{fetchError.message || 'An error occurred'}</p>
          )}
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={() => navigate('/ipd/admissions')}>
              Go Back
            </Button>
            {fetchError && (
              <Button onClick={() => mutate()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipd/admissions')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admissions
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{admission.admission_id}</h1>
            <p className="text-muted-foreground mt-1">
              Patient: <span className="font-medium text-foreground">{admission.patient_name}</span>
            </p>
          </div>

          <Badge
            variant={admission.status === 'admitted' ? 'default' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {ADMISSION_STATUS_LABELS[admission.status]}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{admission.length_of_stay}</div>
              <p className="text-xs text-muted-foreground mt-1">Days in Hospital</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium flex items-center gap-2">
                <BedIcon className="h-4 w-4" />
                {admission.ward_name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bed: {admission.bed_number || 'Not assigned'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium">
                {(() => {
                  try {
                    return format(new Date(admission.admission_date), 'dd MMM yyyy');
                  } catch {
                    return 'Invalid date';
                  }
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Admission Date</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium">
                {(() => {
                  try {
                    return admission.discharge_date
                      ? format(new Date(admission.discharge_date), 'dd MMM yyyy')
                      : '-';
                  } catch {
                    return 'Invalid date';
                  }
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Discharge Date</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="bg-transparent">
              <TabsTrigger value="consultation" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                Consultation
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <IndianRupee className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="transfers" className="gap-2">
                <BedIcon className="h-4 w-4" />
                Bed Transfers
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-2">
                <FileText className="h-4 w-4" />
                Admission Info
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="consultation" className="mt-0 h-full">
              <IPDConsultationTab admission={admission} />
            </TabsContent>

            <TabsContent value="billing" className="mt-0 h-full">
              <BillingTab admissionId={admission.id} />
            </TabsContent>

            <TabsContent value="transfers" className="mt-0 h-full">
              <BedTransfersTab admissionId={admission.id} />
            </TabsContent>

            <TabsContent value="info" className="mt-0 h-full">
              <AdmissionInfo admission={admission} onUpdate={mutate} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
