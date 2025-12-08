// src/pages/opd-production/VisitFindings.tsx
import React, { useState } from 'react';
import { useVisitFinding } from '@/hooks/useVisitFinding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, Activity, Heart, Thermometer } from 'lucide-react';
import { VisitFinding, VisitFindingListParams, FindingType } from '@/types/visitFinding.types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { VisitFindingFormDrawer } from '@/components/VisitFindingFormDrawer';

export const VisitFindings: React.FC = () => {
  const { useVisitFindings, deleteFinding } = useVisitFinding();

  const [searchTerm, setSearchTerm] = useState('');
  const [findingTypeFilter, setFindingTypeFilter] = useState<FindingType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);

  const queryParams: VisitFindingListParams = {
    page: currentPage,
    search: searchTerm || undefined,
    finding_type: findingTypeFilter || undefined,
  };

  const { data: findingsData, error, isLoading, mutate } = useVisitFindings(queryParams);

  const findings = findingsData?.results || [];
  const totalCount = findingsData?.count || 0;
  const hasNext = !!findingsData?.next;
  const hasPrevious = !!findingsData?.previous;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (finding: VisitFinding) => {
    if (window.confirm(`Delete finding for visit ${finding.visit_number}?`)) {
      try {
        await deleteFinding(finding.id);
        toast.success('Visit finding deleted');
        mutate();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const columns: DataTableColumn<VisitFinding>[] = [
    {
      header: 'Visit',
      key: 'visit_number',
      cell: (finding) => (
        <div className="flex flex-col">
          <span className="font-medium font-mono text-sm">{finding.visit_number || `Visit #${finding.visit}`}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(finding.finding_date), 'MMM dd, yyyy')}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient',
      key: 'patient_name',
      cell: (finding) => (
        <span className="font-medium">{finding.patient_name || 'N/A'}</span>
      ),
    },
    {
      header: 'Type',
      key: 'finding_type',
      cell: (finding) => (
        <Badge variant={finding.finding_type === 'examination' ? 'default' : 'secondary'} className="text-xs">
          {finding.finding_type.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Vitals',
      key: 'vitals',
      cell: (finding) => (
        <div className="flex flex-col text-xs space-y-1">
          {finding.temperature && (
            <span>Temp: {finding.temperature}°F</span>
          )}
          {finding.blood_pressure && (
            <span>BP: {finding.blood_pressure}</span>
          )}
          {finding.pulse && (
            <span>Pulse: {finding.pulse} bpm</span>
          )}
        </div>
      ),
    },
    {
      header: 'BMI',
      key: 'bmi',
      cell: (finding) => (
        <div className="flex flex-col text-xs">
          {finding.bmi && <span className="font-medium">{finding.bmi}</span>}
          {finding.bmi_category && (
            <Badge variant="outline" className="text-xs w-fit">
              {finding.bmi_category}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Recorded By',
      key: 'recorded_by_name',
      cell: (finding) => (
        <span className="text-sm">{finding.recorded_by_name || 'N/A'}</span>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Visit Findings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage patient vitals and examination findings
          </p>
        </div>
        <Button onClick={() => { setDrawerMode('create'); setSelectedFindingId(null); setDrawerOpen(true); }} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Finding
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Findings</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Thermometer className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Examinations</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {findings.filter(f => f.finding_type === 'examination').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Heart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Systemic</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {findings.filter(f => f.finding_type === 'systemic').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
                <p className="text-xl sm:text-2xl font-bold">{findings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, visit..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant={findingTypeFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFindingTypeFilter('')}>
                All
              </Button>
              <Button variant={findingTypeFilter === 'examination' ? 'default' : 'outline'} size="sm" onClick={() => setFindingTypeFilter('examination')}>
                Examination
              </Button>
              <Button variant={findingTypeFilter === 'systemic' ? 'default' : 'outline'} size="sm" onClick={() => setFindingTypeFilter('systemic')}>
                Systemic
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Findings List</CardTitle>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">{error.message}</p>
            </div>
          ) : (
            <>
              <DataTable
                rows={findings}
                isLoading={isLoading}
                columns={columns}
                getRowId={(finding) => finding.id}
                getRowLabel={(finding) => finding.visit_number || `Visit #${finding.visit}`}
                onView={(finding) => { setDrawerMode('view'); setSelectedFindingId(finding.id); setDrawerOpen(true); }}
                onEdit={(finding) => { setDrawerMode('edit'); setSelectedFindingId(finding.id); setDrawerOpen(true); }}
                onDelete={handleDelete}
                emptyTitle="No visit findings found"
                emptySubtitle="Try adjusting your filters"
              />

              {!isLoading && findings.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {findings.length} of {totalCount} finding(s)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => setCurrentPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setCurrentPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <VisitFindingFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        findingId={selectedFindingId}
        onSuccess={mutate}
      />
    </div>
  );
};

export default VisitFindings;
