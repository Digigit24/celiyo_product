// src/pages/opd/Consultation.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { OPDVisitHeader, OPDPatientQuickInfo, OPDVisitTabs } from '@/components/opd/shared';
import { OPDBillingContent } from '@/components/opd/OPDBillingContent';

export const OPDConsultation: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    useOpdVisitById,
    useTodayVisits,
    patchOpdVisit,
    completeOpdVisit
  } = useOpdVisit();

  // Get initial tab from location state, default to 'consultation'
  const initialTab = (location.state as any)?.activeTab || 'consultation';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completeNote, setCompleteNote] = useState('');

  // Update active tab when location state changes
  useEffect(() => {
    const newTab = (location.state as any)?.activeTab;
    if (newTab) {
      setActiveTab(newTab);
    }
  }, [location.state]);

  // Fetch current visit
  const { data: visit, isLoading, error, mutate: mutateVisit } = useOpdVisitById(visitId ? parseInt(visitId) : null);

  // Get visit IDs from navigation state (passed from previous page) or fallback to today's visits
  const visitIdsFromState = (location.state as any)?.visitIds as number[] | undefined;

  // Fetch context for navigation (Today's visits) - only if no visitIds passed
  const { data: todayVisitsData } = useTodayVisits({ page_size: 100 });
  const todayVisits = todayVisitsData?.results || [];

  // Use visitIds from state if available, otherwise use today's visits
  const visitIds = visitIdsFromState || todayVisits.map(v => v.id);

  // Determine Prev/Next IDs based on the visit queue
  const currentIndex = visitIds.findIndex(id => id === parseInt(visitId || '0'));
  const prevVisitId = currentIndex > 0 ? visitIds[currentIndex - 1] : null;
  const nextVisitId = currentIndex !== -1 && currentIndex < visitIds.length - 1 ? visitIds[currentIndex + 1] : null;

  // Handle back navigation
  const handleBack = () => {
    const from = (location.state as any)?.from;
    if (from) {
      navigate(from);
    } else {
      navigate('/opd/visits');
    }
  };

  const handlePrevVisit = () => {
    if (prevVisitId) {
      navigate(`/opd/consultation/${prevVisitId}`, {
        state: { visitIds, from: location.state?.from || '/opd/visits' }
      });
    }
  };

  const handleNextVisit = () => {
    if (nextVisitId) {
      navigate(`/opd/consultation/${nextVisitId}`, {
        state: { visitIds, from: location.state?.from || '/opd/visits' }
      });
    }
  };

  const handleStartConsultation = async () => {
    if (!visit) return;
    setIsSaving(true);
    try {
      await patchOpdVisit(visit.id, { 
        status: 'in_consultation', 
        started_at: new Date().toISOString() 
      });
      toast.success('Consultation started');
      mutateVisit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start consultation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!visit) return;
    setIsSaving(true);
    try {
      await completeOpdVisit(visit.id, {
        diagnosis: completeNote || 'Completed',
        notes: completeNote
      });
      toast.success('Consultation completed');
      setShowCompleteDialog(false);
      mutateVisit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete consultation');
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

  if (error || !visit) {
    return (
      <div className="p-6 max-w-8xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Failed to load visit details</p>
            <Button onClick={handleBack} className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patient = visit.patient_details;

  return (
    <div className="flex flex-col h-full bg-background/95">
      <OPDVisitHeader
        visit={visit}
        currentIndex={currentIndex}
        totalVisits={visitIds.length}
        prevVisitId={prevVisitId}
        nextVisitId={nextVisitId}
        isSaving={isSaving}
        showCompleteDialog={showCompleteDialog}
        completeNote={completeNote}
        onBack={handleBack}
        onPrevVisit={handlePrevVisit}
        onNextVisit={handleNextVisit}
        onStartConsultation={handleStartConsultation}
        onCompleteConsultation={handleCompleteConsultation}
        setShowCompleteDialog={setShowCompleteDialog}
        setCompleteNote={setCompleteNote}
      />

      <div className="flex-1 overflow-auto p-6 max-w-8xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <OPDPatientQuickInfo visit={visit} patient={patient} />
          <OPDVisitTabs
            visit={visit}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            billingContent={<OPDBillingContent visit={visit} />}
          />
        </div>
      </div>
    </div>
  );
};

export default OPDConsultation;
