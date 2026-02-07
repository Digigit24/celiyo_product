// src/components/consultation/HistoryTab.tsx
import React, { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Activity, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { opdVisitService } from '@/services/opdVisit.service';
import { opdTemplateService } from '@/services/opdTemplate.service';
import { OpdVisit } from '@/types/opdVisit.types';
import { TemplateResponse } from '@/types/opdTemplate.types';
import { format } from 'date-fns';

interface HistoryTabProps {
  patientId: number;
}

interface VisitWithResponses extends OpdVisit {
  templateResponses?: TemplateResponse[];
  loadingResponses?: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ patientId }) => {
  const [expandedVisits, setExpandedVisits] = useState<Set<number>>(new Set());

  // Fetch patient visits
  const { data: visitsData, isLoading: loadingVisits } = useSWR(
    patientId ? ['patient-visits', patientId] : null,
    () => opdVisitService.getOpdVisits({
      patient_id: patientId,
      page_size: 50,
      ordering: '-visit_date,-visit_time'
    })
  );

  // Fetch template responses for all visits
  const { data: allTemplateResponses, isLoading: loadingResponses } = useSWR(
    visitsData?.results ? ['all-template-responses'] : null,
    async () => {
      if (!visitsData?.results) return [];
      const responses = await opdTemplateService.getTemplateResponses({
        page_size: 200,
        ordering: '-created_at'
      });
      return responses.results;
    }
  );

  const visitHistory: VisitWithResponses[] = visitsData?.results || [];

  // Group template responses by visit
  const responsesByVisit = React.useMemo(() => {
    const map = new Map<number, TemplateResponse[]>();
    if (allTemplateResponses) {
      allTemplateResponses.forEach(response => {
        const existing = map.get(response.visit) || [];
        existing.push(response);
        map.set(response.visit, existing);
      });
    }
    return map;
  }, [allTemplateResponses]);

  const toggleVisit = (visitId: number) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'in-progress':
        return 'bg-blue-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTemplateResponseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string | null | undefined, formatString: string = 'MMM dd, yyyy'): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatString);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Visits</p>
                <p className="text-xl font-bold">
                  {loadingVisits ? <Loader2 className="h-5 w-5 animate-spin" /> : visitsData?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Visit</p>
                <p className="text-sm font-semibold">
                  {loadingVisits ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : visitHistory[0] ? (
                    formatDate(visitHistory[0].visit_date, 'MMM dd, yyyy')
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Template Records</p>
                <p className="text-xl font-bold">
                  {loadingResponses ? <Loader2 className="h-5 w-5 animate-spin" /> : allTemplateResponses?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visit History List */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Visits & Template Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingVisits ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading visits...</span>
            </div>
          ) : visitHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No previous visits found
            </p>
          ) : (
            visitHistory.map((visit, index) => {
              const visitResponses = responsesByVisit.get(visit.id) || [];
              const isExpanded = expandedVisits.has(visit.id);

              return (
                <div key={visit.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{visit.visit_number}</p>
                          {visitResponses.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {visitResponses.length} {visitResponses.length === 1 ? 'Record' : 'Records'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(visit.visit_date, 'MMM dd, yyyy')} • {visit.doctor_details?.full_name || 'N/A'}
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className={getStatusBadgeColor(visit.status)}
                      >
                        {visit.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      {visit.chief_complaint && (
                        <p>
                          <span className="text-muted-foreground">Chief Complaint: </span>
                          <span>{visit.chief_complaint}</span>
                        </p>
                      )}
                      {visit.diagnosis && (
                        <p>
                          <span className="text-muted-foreground">Diagnosis: </span>
                          <span>{visit.diagnosis}</span>
                        </p>
                      )}
                    </div>

                    {/* Template Responses Section */}
                    {visitResponses.length > 0 && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisit(visit.id)}
                          className="w-full justify-between"
                        >
                          <span className="text-xs font-medium">
                            View Template Records ({visitResponses.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {isExpanded && (
                          <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {visitResponses.map((response) => (
                              <div
                                key={response.id}
                                className="p-3 bg-muted/50 rounded-md space-y-2"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {response.template_name || `Template #${response.template}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(response.created_at, 'MMM dd, yyyy HH:mm')}
                                      {response.filled_by_name && ` • by ${response.filled_by_name}`}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={getTemplateResponseStatusColor(response.status)}
                                  >
                                    {response.status}
                                  </Badge>
                                </div>

                                {response.field_responses && response.field_responses.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {response.field_responses.length} field{response.field_responses.length !== 1 ? 's' : ''} recorded
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
