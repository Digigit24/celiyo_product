import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Loader2, User, Phone, Calendar, Activity, Droplet,
  PlusCircle, Eye, ChevronLeft, ChevronRight, Play, CheckCircle, CalendarPlus, X
} from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationTab } from '@/components/consultation/ConsultationTab';
import { OPDBillingContent } from '@/components/opd/OPDBillingContent';
import { HistoryTab } from '@/components/consultation/HistoryTab';
import { ProfileTab } from '@/components/consultation/ProfileTab';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  TemplateResponse,
  CreateTemplateResponsePayload,
} from '@/types/opdTemplate.types';

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
  
  const { user } = useAuth();
  const {
    useTemplates,
    useTemplateResponses,
    createTemplateResponse,
  } = useOPDTemplate();

  // Get tab from URL hash or default to consultation
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (['consultation', 'billing', 'history', 'profile'].includes(hash)) {
      return hash;
    }
    return 'consultation';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeResponse, setActiveResponse] = useState<TemplateResponse | null>(null);
  const [showNewResponseDialog, setShowNewResponseDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [newResponseReason, setNewResponseReason] = useState('');
  const [isDefaultTemplateApplied, setIsDefaultTemplateApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completeNote, setCompleteNote] = useState('');
  const [followupDate, setFollowupDate] = useState<Date | undefined>(undefined);
  const [followupNotes, setFollowupNotes] = useState('');
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);

  // Update URL hash when tab changes
  const handleTabChange = (tab: string) => {
    console.log('Tab change requested:', tab, 'Current:', activeTab);
    setActiveTab(tab);
    navigate(`#${tab}`, { replace: true });
  };

  // Sync tab with URL hash changes
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['consultation', 'billing', 'history', 'profile'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Fetch current visit
  const { data: visit, isLoading, error, mutate: mutateVisit } = useOpdVisitById(visitId ? parseInt(visitId) : null);

  // Fetch context for navigation (Today's visits)
  const { data: todayVisitsData } = useTodayVisits({ page_size: 100 });
  const todayVisits = todayVisitsData?.results || [];

  // Determine Prev/Next IDs
  const currentIndex = todayVisits.findIndex(v => v.id === parseInt(visitId || '0'));
  const prevVisitId = currentIndex > 0 ? todayVisits[currentIndex - 1].id : null;
  const nextVisitId = currentIndex !== -1 && currentIndex < todayVisits.length - 1 ? todayVisits[currentIndex + 1].id : null;

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
    if (prevVisitId) navigate(`/opd/consultation/${prevVisitId}`);
  };

  const handleNextVisit = () => {
    if (nextVisitId) navigate(`/opd/consultation/${nextVisitId}`);
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

  // Initialize followup state from visit data
  useEffect(() => {
    if (visit) {
      if (visit.follow_up_date) {
        setFollowupDate(new Date(visit.follow_up_date));
      } else {
        setFollowupDate(undefined);
      }
      setFollowupNotes(visit.follow_up_notes || '');
    }
  }, [visit?.id, visit?.follow_up_date, visit?.follow_up_notes]);

  const handleSaveFollowup = async () => {
    if (!visit) return;
    setIsSavingFollowup(true);
    try {
      await patchOpdVisit(visit.id, {
        follow_up_required: !!followupDate,
        follow_up_date: followupDate ? format(followupDate, 'yyyy-MM-dd') : null,
        follow_up_notes: followupNotes || null,
      });
      toast.success(followupDate ? 'Follow-up scheduled' : 'Follow-up cleared');
      setIsFollowupOpen(false);
      mutateVisit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save follow-up');
    } finally {
      setIsSavingFollowup(false);
    }
  };

  const handleClearFollowup = async () => {
    setFollowupDate(undefined);
    setFollowupNotes('');
  };

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({ is_active: true });

  const { data: responsesData, isLoading: isLoadingResponses, mutate: mutateResponses } = useTemplateResponses({
    visit: visit?.id,
    template: selectedTemplate ? parseInt(selectedTemplate) : undefined,
  });

  const templateResponses = useMemo(() => responsesData?.results || [], [responsesData]);

  // Effect to load default template from user preferences
  useEffect(() => {
    if (
      !isDefaultTemplateApplied &&
      !isLoadingTemplates &&
      visit &&
      templatesData?.results &&
      templatesData.results.length > 0
    ) {
      if (user?.preferences?.defaultOPDTemplate) {
        const defaultTemplateId = String(user.preferences.defaultOPDTemplate);
        const templateExists = templatesData.results.some(t => String(t.id) === defaultTemplateId);

        if (templateExists) {
          setSelectedTemplate(defaultTemplateId);
          setIsDefaultTemplateApplied(true);
          return;
        }
      }

      const firstTemplate = templatesData.results[0];
      if (firstTemplate && !selectedTemplate) {
        setSelectedTemplate(String(firstTemplate.id));
        setIsDefaultTemplateApplied(true);
      } else {
        setIsDefaultTemplateApplied(true);
      }
    }
  }, [user?.preferences?.defaultOPDTemplate, templatesData, visit, isDefaultTemplateApplied, isLoadingTemplates, selectedTemplate]);

  const handleViewResponse = useCallback((response: TemplateResponse) => {
    setActiveResponse(response);
  }, []);

  const handleAddNewResponse = useCallback(async (isAutoCreation = false) => {
    if (!selectedTemplate || !visit?.id) return;

    if (!isAutoCreation && templateResponses.length > 0) {
        setShowNewResponseDialog(true);
        return;
    }

    setIsSaving(true);
    try {
      const payload: CreateTemplateResponsePayload = {
        encounter_type: 'visit',
        object_id: visit.id,
        template: parseInt(selectedTemplate),
        doctor_switched_reason: !isAutoCreation && newResponseReason ? newResponseReason : undefined,
      };
      const newResponse = await createTemplateResponse(payload);
      await mutateResponses();
      handleViewResponse(newResponse);
      toast.success('New consultation form ready.');
      setShowNewResponseDialog(false);
      setNewResponseReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create new response.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTemplate, visit?.id, newResponseReason, templateResponses, createTemplateResponse, mutateResponses, handleViewResponse]);

  useEffect(() => {
    if (!selectedTemplate || isLoadingResponses || !visit) {
      return;
    }

    if (templateResponses.length > 0) {
      if (!activeResponse || !templateResponses.find(r => r.id === activeResponse.id)) {
        const sortedResponses = [...templateResponses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        handleViewResponse(sortedResponses[0]);
      }
    } else {
      setActiveResponse(null);
      handleAddNewResponse(true);
    }
  }, [selectedTemplate, templateResponses, isLoadingResponses, activeResponse, handleAddNewResponse, handleViewResponse, visit]);

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
  const doctor = visit.doctor_details;

  const calculateBMI = () => 'N/A';

  return (
    <div className="flex flex-col h-full bg-background/95">
      {/* Modern Sticky Header */}
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
                  <span className="font-mono bg-muted px-1 rounded">PID: {patient?.patient_id || 'N/A'}</span>
                  <span>•</span>
                  <span>{patient?.age || '-'} yrs / {patient?.gender || '-'}</span>
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
                {currentIndex + 1} / {todayVisits.length}
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
                visit.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                visit.status === 'in_consultation' || visit.status === 'in_progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                'bg-orange-100 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {visit.status?.replace('_', ' ')}
            </Badge>

            {/* Action Buttons based on Status */}
            {visit.status === 'waiting' && (
              <Button onClick={handleStartConsultation} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Consultation
              </Button>
            )}
            
            {(visit.status === 'in_consultation' || visit.status === 'in_progress') && (
              <Button onClick={() => setShowCompleteDialog(true)} disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Complete Visit
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Navigation - Part of Sticky Header */}
        <div className="border-t px-4 bg-muted/30 relative z-10">
          <div className="flex gap-6">
            {['consultation', 'billing', 'history', 'profile'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-2 py-3 text-sm font-medium capitalize transition-colors border-b-2 relative z-10 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-8xl mx-auto w-full space-y-6">
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 gap-6">
          {/* Patient Quick Info Card */}
          <Card className="bg-card/50">
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Blood Group</span>
                <span className="font-medium flex items-center gap-2">
                  <Droplet className="h-3 w-3 text-red-500" /> {patient?.blood_group || 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Vitals (BMI)</span>
                <span className="font-medium flex items-center gap-2">
                  <Activity className="h-3 w-3 text-blue-500" /> {calculateBMI()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Visit Type</span>
                <Badge variant="outline" className="w-fit text-[10px] font-normal">
                  {visit.visit_type?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Priority</span>
                <span className={`font-medium ${visit.priority === 'high' || visit.priority === 'urgent' ? 'text-red-600' : ''}`}>
                  {visit.priority?.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection & Consultation Responses */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Consultation Workspace</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 max-w-sm">
                  <Select
                    onValueChange={setSelectedTemplate}
                    value={selectedTemplate || undefined}
                    disabled={isLoadingTemplates}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select clinical template..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTemplates ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        (templatesData?.results || []).map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplate && (
                  <Button variant="outline" size="sm" onClick={() => setShowNewResponseDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Note
                  </Button>
                )}
              </div>

              {/* Active Responses Chips */}
              <div className="flex flex-wrap gap-2">
                {templateResponses.map(res => (
                  <Button
                    key={res.id}
                    variant={activeResponse?.id === res.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewResponse(res)}
                    className="h-8 text-xs"
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    Note #{res.response_sequence} ({res.status})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          <Card>
            <CardContent className="p-6">
              {activeTab === 'consultation' && (
                <ConsultationTab visit={visit} onVisitUpdate={() => mutateVisit()} />
              )}
              {activeTab === 'billing' && (
                <OPDBillingContent visit={visit} />
              )}
              {activeTab === 'history' && (
                <HistoryTab patientId={visit.patient} />
              )}
              {activeTab === 'profile' && (
                <ProfileTab patientId={visit.patient} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Response Dialog */}
      <Dialog open={showNewResponseDialog} onOpenChange={setShowNewResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Clinical Note</DialogTitle>
            <DialogDescription>
              Create a new note for this consultation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Reason / Context (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g., Handover, Second Opinion"
              value={newResponseReason}
              onChange={(e) => setNewResponseReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewResponseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddNewResponse(false)} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={isFollowupOpen} onOpenChange={setIsFollowupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Schedule Follow-up
            </DialogTitle>
            <DialogDescription>
              Set the next follow-up date for this patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={followupDate}
                onSelect={setFollowupDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                placeholder="Follow-up instructions..."
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                className="mt-2 h-20 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {visit.follow_up_date && (
              <Button
                variant="outline"
                onClick={() => {
                  handleClearFollowup();
                  handleSaveFollowup();
                }}
                className="text-destructive hover:text-destructive"
              >
                Clear Follow-up
              </Button>
            )}
            <Button
              onClick={handleSaveFollowup}
              disabled={isSavingFollowup || !followupDate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSavingFollowup && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Consultation Dialog */}
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
            <Button onClick={handleCompleteConsultation} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OPDConsultation;
