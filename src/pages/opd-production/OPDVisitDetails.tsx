// src/pages/opd-production/OPDVisitDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, User, Phone, Calendar, Activity, Droplet } from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationTab } from '@/components/consultation/ConsultationTab';
import { HistoryTab } from '@/components/consultation/HistoryTab';
import { ProfileTab } from '@/components/consultation/ProfileTab';
import { OPDBillingContent } from '@/components/opd/OPDBillingContent';

export const OPDVisitDetails: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { useOpdVisitById } = useOpdVisit();

  // Determine active tab from the current route
  const getActiveTabFromPath = () => {
    if (location.pathname.includes('/billing/')) {
      return 'billing';
    }
    return 'consultation';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  // Handle back navigation - go to the previous page if state is provided, otherwise go to visits
  const handleBack = () => {
    const from = (location.state as any)?.from;
    if (from) {
      navigate(from);
    } else {
      navigate('/opd/visits');
    }
  };

  // Handle tab change - navigate to the appropriate route
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'billing') {
      navigate(`/opd/billing/${visitId}`, { state: location.state });
    } else if (tab === 'consultation') {
      navigate(`/opd/consultation/${visitId}`, { state: location.state });
    }
  };

  const { data: visit, isLoading, error } = useOpdVisitById(visitId ? parseInt(visitId) : null);

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
              <h1 className="text-2xl sm:text-3xl font-bold">{patient?.full_name || 'N/A'}</h1>
              <Badge
                variant={visit.status === 'completed' ? 'default' : 'secondary'}
                className={
                  visit.status === 'completed'
                    ? 'bg-green-600'
                    : visit.status === 'in_progress'
                    ? 'bg-blue-600'
                    : 'bg-orange-600'
                }
              >
                {visit.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{patient?.patient_id || 'N/A'}</span>
              {patient?.mobile_primary && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {patient.mobile_primary}
                  </span>
                </>
              )}
              {patient?.age && (
                <>
                  <span>•</span>
                  <span>{patient.age} years</span>
                </>
              )}
              {patient?.gender && (
                <>
                  <span>•</span>
                  <span className="capitalize">{patient.gender}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Visit Info Badge */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            Visit: {visit.visit_number}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {formatVisitDate(visit.visit_date)}
          </Badge>
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
                <p className="text-sm font-semibold">{visit.visit_type?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
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
    </div>
  );
};

export default OPDVisitDetails;
