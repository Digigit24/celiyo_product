// src/pages/LeadDetailsPage.tsx
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Trash2, Phone, Mail, Loader2, MapPin, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday } from 'date-fns';

import { useCRM } from '@/hooks/useCRM';
import { useMeeting } from '@/hooks/useMeeting';
import LeadDetailsForm from '@/components/lead-drawer/LeadDetailsForm';
import LeadActivities from '@/components/lead-drawer/LeadActivities';
import type { Lead } from '@/types/crmTypes';
import type { Meeting } from '@/types/meeting.types';
import { LeadFormHandle } from '@/components/LeadsFormDrawer';

export const LeadDetailsPage = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hooks
  const { useLead, updateLead, deleteLead, useLeadStatuses } = useCRM();
  const { useMeetingsByLead } = useMeeting();

  // Parse leadId to number
  const leadIdNum = leadId ? parseInt(leadId, 10) : null;

  // Fetch lead data
  const {
    data: lead,
    error: leadError,
    isLoading: leadLoading,
    mutate: mutateLead
  } = useLead(leadIdNum);

  // Fetch statuses for status display
  const { data: statusesData } = useLeadStatuses();
  const statuses = statusesData?.results || [];

  // Fetch meetings for this lead
  const {
    data: meetingsData,
    isLoading: meetingsLoading
  } = useMeetingsByLead(leadIdNum);
  const meetings = meetingsData?.results || [];

  // Form ref
  const [formRef, setFormRef] = useState<LeadFormHandle | null>(null);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/crm/leads');
  }, [navigate]);

  // Handle edit mode toggle
  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!lead || !formRef) return;

    try {
      setIsSaving(true);
      const formValues = await formRef.getFormValues();

      if (!formValues) {
        toast.error('Please fill in all required fields');
        return;
      }

      await updateLead(lead.id, formValues);
      await mutateLead();
      toast.success('Lead updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update lead');
      console.error('Failed to update lead:', error);
    } finally {
      setIsSaving(false);
    }
  }, [lead, formRef, updateLead, mutateLead]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!lead) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${lead.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteLead(lead.id);
      toast.success('Lead deleted successfully');
      navigate('/crm/leads');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lead');
      console.error('Failed to delete lead:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [lead, deleteLead, navigate]);

  // Handle call
  const handleCall = useCallback(() => {
    if (lead?.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
  }, [lead]);

  // Handle email
  const handleEmail = useCallback(() => {
    if (lead?.email) {
      window.location.href = `mailto:${lead.email}`;
    }
  }, [lead]);

  // Get meeting status badge
  const getMeetingStatusBadge = (meeting: Meeting) => {
    const now = new Date();
    const start = new Date(meeting.start_at);
    const end = new Date(meeting.end_at);

    if (isPast(end)) {
      return <Badge variant="secondary" className="bg-gray-600">Completed</Badge>;
    } else if (now >= start && now <= end) {
      return <Badge variant="default" className="bg-green-600">In Progress</Badge>;
    } else if (isToday(start)) {
      return <Badge variant="default" className="bg-blue-600">Today</Badge>;
    } else if (isFuture(start)) {
      return <Badge variant="default" className="bg-purple-600">Upcoming</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  // Format meeting time
  const formatMeetingTime = (startAt: string, endAt: string) => {
    try {
      const start = new Date(startAt);
      const end = new Date(endAt);
      const dateStr = format(start, 'MMM dd, yyyy');
      const timeStr = `${format(start, 'hh:mm a')} - ${format(end, 'hh:mm a')}`;
      return { dateStr, timeStr };
    } catch {
      return { dateStr: 'Invalid date', timeStr: 'Invalid time' };
    }
  };

  // Loading state
  if (leadLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (leadError || !lead) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-destructive text-lg">
            {leadError ? 'Failed to load lead details' : 'Lead not found'}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
            <h1 className="text-2xl sm:text-3xl font-bold">{lead.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
              {lead.company && (
                <span>• {lead.company}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              {lead.phone && (
                <Button onClick={handleCall} variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              {lead.email && (
                <Button onClick={handleEmail} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Lead Details</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        {/* Lead Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <LeadDetailsForm
                lead={lead}
                mode={isEditing ? 'edit' : 'view'}
                ref={(ref) => {
                  if (ref && 'getFormValues' in ref) {
                    // @ts-ignore
                    setFormRef(ref);
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <LeadActivities leadId={lead.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <p className="text-lg font-semibold mt-1">
                      {statuses.find(s => s.id === lead.status)?.name || 'Unknown'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: statuses.find(s => s.id === lead.status)?.color + '20',
                      borderColor: statuses.find(s => s.id === lead.status)?.color,
                      color: statuses.find(s => s.id === lead.status)?.color,
                    }}
                  >
                    {statuses.find(s => s.id === lead.status)?.name || 'Unknown'}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="text-lg font-semibold mt-1 capitalize">
                    {lead.priority || 'Not set'}
                  </p>
                </div>

                {lead.next_follow_up && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Next Follow-up</p>
                    <p className="text-lg font-semibold mt-1">
                      {format(new Date(lead.next_follow_up), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-semibold mt-1">
                    {format(new Date(lead.updated_at), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-lg font-semibold mt-1">
                    {format(new Date(lead.created_at), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              {meetingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No meetings scheduled for this lead
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => {
                    const { dateStr, timeStr } = formatMeetingTime(meeting.start_at, meeting.end_at);
                    return (
                      <div
                        key={meeting.id}
                        className="p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{meeting.title}</h3>
                              {getMeetingStatusBadge(meeting)}
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>{dateStr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>{timeStr}</span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{meeting.location}</span>
                                </div>
                              )}
                            </div>

                            {meeting.description && (
                              <p className="mt-2 text-sm">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadDetailsPage;
