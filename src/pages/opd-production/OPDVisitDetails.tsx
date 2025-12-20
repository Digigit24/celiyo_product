// src/pages/opd-production/OPDVisitDetails.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Calendar,
  Activity,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
} from 'lucide-react';

import { format } from 'date-fns';
import { toast } from 'sonner';

import { ConsultationTab } from '@/components/consultation/ConsultationTab';
import { HistoryTab } from '@/components/consultation/HistoryTab';
import { ProfileTab } from '@/components/consultation/ProfileTab';
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
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      {/* Sticky Header (same style as consultation page) */}
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {patient?.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1
                  className="text-lg font-bold leading-none cursor-pointer hover:underline decoration-primary/50 underline-offset-4"
                  onClick={() => navigate(`/patients/${visit.patient}`)}
                >
                  {patient?.full_name || 'Unknown Patient'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="font-mono bg-muted px-1 rounded">
                    PID: {patient?.patient_id || 'N/A'}
                  </span>
                  <span>•</span>
                  <span>
                    {patient?.age || '-'} yrs / {patient?.gender || '-'}
                  </span>
                  <span>•</span>
                  <Phone className="h-3 w-3" /> {patient?.mobile_primary || 'N/A'}
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center bg-muted/50 rounded-lg border p-0.5 ml-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handlePrevVisit}
                disabled={!prevVisitId}
                title="Previous Patient"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 text-xs font-medium border-x border-muted-foreground/20">
                {todayVisits.length ? currentIndex + 1 : 0} / {todayVisits.length}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNextVisit}
                disabled={!nextVisitId}
                title="Next Patient"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={visit.status === 'completed' ? 'default' : 'secondary'}
              className={`px-3 py-1 text-xs uppercase tracking-wide ${
                visit.status === 'completed'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : visit.status === 'in_consultation' || visit.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {visit.status?.replace('_', ' ')}
            </Badge>

            {/* Action Buttons based on Status */}
            {visit.status === 'waiting' && (
              <Button
                onClick={handleStartConsultation}
                disabled={isSaving}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Consultation
              </Button>
            )}

            {(visit.status === 'in_consultation' || visit.status === 'in_progress') && (
              <Button
                onClick={() => setShowCompleteDialog(true)}
                disabled={isSaving}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Complete Visit
              </Button>
            )}
          </div>
        </div>
      </div>

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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consultation">Consultation</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="consultation" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ConsultationTab visit={visit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <OPDBillingContent visit={visit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <HistoryTab patientId={visit.patient} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <ProfileTab patientId={visit.patient} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Visit Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Consultation</DialogTitle>
            <DialogDescription>
              Finalize this visit. This will move the patient to the completed list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="complete-note">Final Diagnosis / Notes</Label>
            <Input
              id="complete-note"
              placeholder="Enter diagnosis or completion summary..."
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteConsultation}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OPDVisitDetails;
