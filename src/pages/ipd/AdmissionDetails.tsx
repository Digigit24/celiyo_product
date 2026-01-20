// src/pages/ipd/AdmissionDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useIPD } from '@/hooks/useIPD';
import { Loader2, Activity, User, Calendar, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ADMISSION_STATUS_LABELS } from '@/types/ipd.types';
import { IPDAdmissionHeader } from '@/components/ipd/IPDAdmissionHeader';
import { IPDPatientQuickInfo } from '@/components/ipd/IPDPatientQuickInfo';
import { IPDAdmissionTabs } from '@/components/ipd/IPDAdmissionTabs';

export default function AdmissionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const { useAdmissionById, dischargePatient } = useIPD();

  // Get initial tab from query parameter, default to 'consultation'
  const initialTab = tabParam || 'consultation';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dischargeData, setDischargeData] = useState({
    discharge_type: 'Normal',
    discharge_summary: '',
  });

  // Update active tab when tab query parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch current admission
  const { data: admission, isLoading, error, mutate: mutateAdmission } = useAdmissionById(id ? parseInt(id) : null);

  // Handle back navigation
  const handleBack = () => {
    navigate('/ipd/admissions');
  };

  const handleDischargePatient = async () => {
    if (!admission) return;
    setIsSaving(true);
    try {
      await dischargePatient(admission.id, dischargeData);
      toast.success('Patient discharged successfully');
      setShowDischargeDialog(false);
      mutateAdmission();
    } catch (err: any) {
      toast.error(err.message || 'Failed to discharge patient');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !admission) {
    return (
      <div className="p-6 max-w-8xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Failed to load admission details</p>
            <Button onClick={handleBack} className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/95">
      <IPDAdmissionHeader
        admission={admission}
        isSaving={isSaving}
        showDischargeDialog={showDischargeDialog}
        dischargeData={dischargeData}
        onBack={handleBack}
        onDischarge={handleDischargePatient}
        setShowDischargeDialog={setShowDischargeDialog}
        setDischargeData={setDischargeData}
      />

      <div className="flex-1 overflow-auto p-6 max-w-8xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <IPDPatientQuickInfo admission={admission} />
          <IPDAdmissionTabs
            admission={admission}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}
