// src/pages/opd/Consultation.tsx
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
import { ArrowLeft, Loader2, User, Phone, Calendar, Activity, Droplet, PlusCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationTab } from '@/components/consultation/ConsultationTab';
import { BillingTab } from '@/components/consultation/BillingTab';
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
  const { useOpdVisitById } = useOpdVisit();
  const { user } = useAuth();
  const {
    useTemplates,
    useTemplateResponses,
    createTemplateResponse,
  } = useOPDTemplate();

  const [activeTab, setActiveTab] = useState('consultation');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeResponse, setActiveResponse] = useState<TemplateResponse | null>(null);
  const [showNewResponseDialog, setShowNewResponseDialog] = useState(false);
  const [newResponseReason, setNewResponseReason] = useState('');
  const [isDefaultTemplateApplied, setIsDefaultTemplateApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle back navigation - go to the previous page if state is provided, otherwise go to visits
  const handleBack = () => {
    const from = (location.state as any)?.from;
    if (from) {
      navigate(from);
    } else {
      navigate('/opd/visits');
    }
  };

  const { data: visit, isLoading, error } = useOpdVisitById(visitId ? parseInt(visitId) : null);

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({ is_active: true });

  const { data: responsesData, isLoading: isLoadingResponses, mutate: mutateResponses } = useTemplateResponses({
    visit: visit?.id,
    template: selectedTemplate ? parseInt(selectedTemplate) : undefined,
  });

  const templateResponses = useMemo(() => responsesData?.results || [], [responsesData]);

  // Effect to load default template from user preferences
  useEffect(() => {
    // Only apply default template once when all data is loaded
    if (
      !isDefaultTemplateApplied &&
      visit &&
      templatesData?.results &&
      templatesData.results.length > 0 &&
      user?.preferences?.defaultOPDTemplate
    ) {
      const defaultTemplateId = String(user.preferences.defaultOPDTemplate);
      const templateExists = templatesData.results.some(t => String(t.id) === defaultTemplateId);

      if (templateExists) {
        setSelectedTemplate(defaultTemplateId);
        setIsDefaultTemplateApplied(true);
        toast.info('Default OPD template loaded.');
      } else {
        // If default template doesn't exist, just mark as applied to avoid repeated checks
        setIsDefaultTemplateApplied(true);
      }
    }
  }, [user?.preferences?.defaultOPDTemplate, templatesData, visit, isDefaultTemplateApplied]);

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
        visit: visit.id,
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
    if (!selectedTemplate || isLoadingResponses || !visit) return;

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

  // Calculate BMI if height and weight are available
  const calculateBMI = () => {
    // Placeholder - would need height and weight from patient data
    return 'N/A';
  };

  // Format visit date
  const formatVisitDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  return (
    <div className="p-4 max-w-8xl mx-auto space-y-3">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Patient Consultation</h1>
          <p className="text-muted-foreground text-xs">
            Visit: {visit.visit_number} • {formatVisitDate(visit.visit_date)}
          </p>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl font-semibold bg-primary/10">
                  {patient?.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold">{patient?.full_name || 'N/A'}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>ID: {patient?.patient_id || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{patient?.mobile_primary || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Patient Details Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Age & Gender */}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Age / Gender
                </p>
                <p className="font-semibold text-sm">
                  {patient?.age || 'N/A'} yrs • {patient?.gender || 'N/A'}
                </p>
              </div>

              {/* Blood Group */}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Droplet className="h-3 w-3" />
                  Blood Group
                </p>
                <p className="font-semibold text-sm">
                  {patient?.blood_group || 'N/A'}
                </p>
              </div>

              {/* BMI */}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  BMI
                </p>
                <p className="font-semibold text-sm">{calculateBMI()}</p>
              </div>

              {/* Visit Status */}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant={visit.status === 'completed' ? 'default' : 'secondary'}
                  className={`text-xs ${
                    visit.status === 'completed'
                      ? 'bg-green-600'
                      : visit.status === 'in_progress'
                      ? 'bg-blue-600'
                      : 'bg-orange-600'
                  }`}
                >
                  {visit.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Doctor & Visit Info */}
          <div className="mt-2 pt-2 border-t grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Consulting Doctor</p>
              <p className="font-medium text-sm">{doctor?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visit Type</p>
              <Badge variant="secondary" className="mt-0.5 text-xs">
                {visit.visit_type?.replace('_', ' ').toUpperCase() || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Priority</p>
              <Badge
                variant={visit.priority === 'urgent' || visit.priority === 'high' ? 'destructive' : 'outline'}
                className={`mt-0.5 text-xs ${visit.priority === 'high' ? 'bg-orange-600 text-white' : ''}`}
              >
                {visit.priority?.toUpperCase() || 'NORMAL'}
              </Badge>
            </div>
          </div>

          {/* Template Selection & Consultation Responses */}
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Template Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Select Template</h3>
              <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Select a template..." />
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

            {/* Consultation Responses */}
            {selectedTemplate && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Consultation Responses</h3>
                  {templateResponses.length > 0 && (
                    <Dialog open={showNewResponseDialog} onOpenChange={setShowNewResponseDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Response</DialogTitle>
                          <DialogDescription>
                            Create a new response form for a handover or new consultation.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason (optional)</Label>
                          <Input
                            id="reason"
                            value={newResponseReason}
                            onChange={(e) => setNewResponseReason(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setShowNewResponseDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleAddNewResponse(false)} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="w-full md:w-auto">
                  {isLoadingResponses ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full md:w-96" />
                      <Skeleton className="h-12 w-full md:w-96" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templateResponses.map(res => (
                        <div
                          key={res.id}
                          className={`flex items-center justify-between p-2 rounded-md border w-full md:w-auto ${
                            activeResponse?.id === res.id ? 'bg-muted border-primary' : 'border-border'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              Response #{res.response_sequence} - Dr. {res.filled_by_name}
                            </p>
                            <p className="text-xs text-muted-foreground">Status: {res.status}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleViewResponse(res)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Button>
                        </div>
                      ))}
                      {templateResponses.length === 0 && !isLoadingResponses && (
                        <div className="text-center py-3 text-sm text-muted-foreground">
                          <p>No responses yet. The first response form has been created automatically.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Consultation, Billing, History, Profile */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger
                value="consultation"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Consultation
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Billing
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4">
            <TabsContent value="consultation" className="mt-0">
              <ConsultationTab
                visit={visit}
                selectedTemplate={selectedTemplate}
                activeResponse={activeResponse}
                onResponseUpdate={mutateResponses}
              />
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <BillingTab visit={visit} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <HistoryTab patientId={visit.patient} />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <ProfileTab patientId={visit.patient} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default OPDConsultation;
