// src/pages/opd-production/OPDVisitDetails.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { Loader2, User, Calendar, Activity, Droplet, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { toast } from 'sonner';
import { OPDVisitHeader, OPDVisitTabs } from '@/components/opd/shared';
import { OPDBillingContent } from '@/components/opd/OPDBillingContent';

export const OPDVisitDetails: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    useOpdVisitById,
    useTodayVisits,
    patchOpdVisit,
    completeOpdVisit,
  } = useOpdVisit();

  const numericVisitId = useMemo(
    () => (visitId ? parseInt(visitId, 10) : null),
    [visitId]
  );

  // Determine active tab from the current route
  const getActiveTabFromPath = () => {
    if (location.pathname.includes('/billing/')) return 'billing';
    return 'consultation';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Header states (needed for the sticky header actions)
  const [isSaving, setIsSaving] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeNote, setCompleteNote] = useState('');

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  // Handle back navigation - go to the previous page if state is provided, otherwise go to visits
  const handleBack = () => {
    const from = (location.state as any)?.from;
    if (from) navigate(from);
    else navigate('/opd/visits');
  };

  // Handle tab change - navigate to the appropriate route
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'billing') {
      navigate(`/opd/billing/${visitId}`, { state: location.state });
    } else if (tab === 'consultation') {
      navigate(`/opd/consultation/${visitId}`, { state: location.state });
    } else {
      // history/profile are local tabs only (no route change needed)
      // but we keep state in sync
    }
  };

  // Fetch visit
  const {
    data: visit,
    isLoading,
    error,
    // some implementations return mutate; keeping it optional so code stays safe
    mutate: mutateVisit,
  } = (useOpdVisitById as any)(numericVisitId);

  // Fetch Today's visits for prev/next navigation (same behavior as consultation page)
  const { data: todayVisitsData } = useTodayVisits({ page_size: 100 });
  const todayVisits = todayVisitsData?.results || [];

  const currentIndex = todayVisits.findIndex((v: any) => v.id === numericVisitId);
  const prevVisitId = currentIndex > 0 ? todayVisits[currentIndex - 1]?.id : null;
  const nextVisitId =
    currentIndex !== -1 && currentIndex < todayVisits.length - 1
      ? todayVisits[currentIndex + 1]?.id
      : null;

  const getVisitRouteForTab = (tab: string, id: number) => {
    if (tab === 'billing') return `/opd/billing/${id}`;
    return `/opd/consultation/${id}`;
  };

  const handlePrevVisit = () => {
    if (!prevVisitId) return;
    navigate(getVisitRouteForTab(activeTab, prevVisitId), { state: location.state });
  };

  const handleNextVisit = () => {
    if (!nextVisitId) return;
    navigate(getVisitRouteForTab(activeTab, nextVisitId), { state: location.state });
  };

  const handleStartConsultation = async () => {
    if (!visit) return;
    setIsSaving(true);
    try {
      await patchOpdVisit(visit.id, {
        status: 'in_consultation',
        started_at: new Date().toISOString(),
      });
      toast.success('Consultation started');
      if (typeof mutateVisit === 'function') mutateVisit();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start consultation');
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
        notes: completeNote,
      });
      toast.success('Consultation completed');
      setShowCompleteDialog(false);
      if (typeof mutateVisit === 'function') mutateVisit();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete consultation');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate BMI if height and weight are available
  const calculateBMI = () => 'N/A';

  // Format visit date
  const formatVisitDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
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
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive text-lg">
            {error ? 'Failed to load visit details' : 'Visit not found'}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const patient = visit.patient_details;
  const doctor = visit.doctor_details;

  return (
    <div className="flex flex-col h-full bg-background/95">
      <OPDVisitHeader
        visit={visit}
        currentIndex={currentIndex}
        totalVisits={todayVisits.length}
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
        {/* Quick Stats Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="text-sm font-semibold">{doctor?.full_name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-lg font-bold">{patient?.blood_group || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Visit Type</p>
                  <p className="text-sm font-semibold">
                    {visit.visit_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <Badge
                    variant={visit.priority === 'urgent' || visit.priority === 'high' ? 'destructive' : 'outline'}
                    className={`${visit.priority === 'high' ? 'bg-orange-600 text-white' : ''}`}
                  >
                    {visit.priority?.toUpperCase() || 'NORMAL'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <OPDVisitTabs
          visit={visit}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          billingContent={<OPDBillingContent visit={visit} />}
        />
      </div>
    </div>
  );
};

export default OPDVisitDetails;
