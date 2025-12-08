// src/pages/opd-production/ClinicalNotes.tsx
import React, { useState } from 'react';
import { useClinicalNote } from '@/hooks/useClinicalNote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Loader2, Plus, Search, FileText, ClipboardList } from 'lucide-react';
import { ClinicalNote, ClinicalNoteListParams } from '@/types/clinicalNote.types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ClinicalNoteFormDrawer } from '@/components/ClinicalNoteFormDrawer';

export const ClinicalNotes: React.FC = () => {
  const { useClinicalNotes, deleteNote } = useClinicalNote();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  const queryParams: ClinicalNoteListParams = {
    page: currentPage,
    search: searchTerm || undefined,
  };

  const { data: notesData, error, isLoading, mutate } = useClinicalNotes(queryParams);

  const notes = notesData?.results || [];
  const totalCount = notesData?.count || 0;
  const hasNext = !!notesData?.next;
  const hasPrevious = !!notesData?.previous;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (note: ClinicalNote) => {
    if (window.confirm(`Delete clinical note for visit ${note.visit_number}?`)) {
      try {
        await deleteNote(note.id);
        toast.success('Clinical note deleted');
        mutate();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const columns: DataTableColumn<ClinicalNote>[] = [
    {
      header: 'Visit',
      key: 'visit_number',
      cell: (note) => (
        <div className="flex flex-col">
          <span className="font-medium font-mono text-sm">{note.visit_number || `Visit #${note.visit}`}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(note.note_date), 'MMM dd, yyyy')}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient',
      key: 'patient_name',
      cell: (note) => (
        <div className="flex flex-col">
          <span className="font-medium">{note.patient_name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">EHR: {note.ehr_number}</span>
        </div>
      ),
    },
    {
      header: 'Complaints',
      key: 'present_complaints',
      cell: (note) => (
        <div className="max-w-xs">
          <p className="text-sm truncate">{note.present_complaints || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Diagnosis',
      key: 'diagnosis',
      cell: (note) => (
        <div className="max-w-xs">
          <p className="text-sm truncate">{note.diagnosis || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Doctor',
      key: 'referred_doctor_name',
      cell: (note) => (
        <span className="text-sm">{note.referred_doctor_name || 'N/A'}</span>
      ),
    },
    {
      header: 'Follow-up',
      key: 'next_followup_date',
      cell: (note) => (
        <span className="text-sm">
          {note.next_followup_date ? format(new Date(note.next_followup_date), 'MMM dd, yyyy') : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clinical Notes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage clinical documentation
          </p>
        </div>
        <Button onClick={() => { setDrawerMode('create'); setSelectedNoteId(null); setDrawerOpen(true); }} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Notes</p>
                <p className="text-xl sm:text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                <p className="text-xl sm:text-2xl font-bold">{notes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Follow-ups</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {notes.filter(n => n.next_followup_date).length}
                </p>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient, visit, diagnosis..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Clinical Notes List</CardTitle>
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
                rows={notes}
                isLoading={isLoading}
                columns={columns}
                getRowId={(note) => note.id}
                getRowLabel={(note) => note.visit_number || `Visit #${note.visit}`}
                onView={(note) => { setDrawerMode('view'); setSelectedNoteId(note.id); setDrawerOpen(true); }}
                onEdit={(note) => { setDrawerMode('edit'); setSelectedNoteId(note.id); setDrawerOpen(true); }}
                onDelete={handleDelete}
                emptyTitle="No clinical notes found"
                emptySubtitle="Try adjusting your filters"
              />

              {!isLoading && notes.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {notes.length} of {totalCount} note(s)
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

      <ClinicalNoteFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        noteId={selectedNoteId}
        onSuccess={mutate}
      />
    </div>
  );
};

export default ClinicalNotes;
