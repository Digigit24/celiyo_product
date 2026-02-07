// src/hooks/useClinicalNote.ts
// ==================== CLINICAL NOTE HOOKS ====================
// Mirrors the Visit/OPDBill hooks pattern (SWR + callback mutations)

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { clinicalNoteService } from '@/services/clinicalNote.service';
import {
  ClinicalNote,
  ClinicalNoteListParams,
  ClinicalNoteCreateData,
  ClinicalNoteUpdateData,
  PaginatedResponse,
} from '@/types/clinicalNote.types';
import { useAuth } from './useAuth';

export const useClinicalNote = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== CLINICAL NOTES HOOKS ====================

  /**
   * Fetch list of clinical notes with filters & pagination.
   *
   * @example
   * const { data, error, isLoading, mutate } = useClinicalNotes({
   *   visit: 123,
   *   page: 1,
   *   page_size: 20,
   * });
   */
  const useClinicalNotes = (params?: ClinicalNoteListParams) => {
    const key = ['clinical-notes', params];

    return useSWR<PaginatedResponse<ClinicalNote>>(
      key,
      () => clinicalNoteService.getClinicalNotes(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        keepPreviousData: true,
        onError: (err) => {
          console.error('Failed to fetch clinical notes:', err);
          setError(err.message || 'Failed to fetch clinical notes');
        },
      }
    );
  };

  /**
   * Fetch single clinical note by ID.
   *
   * @example
   * const { data, error, isLoading, mutate } = useClinicalNoteById(12);
   */
  const useClinicalNoteById = (id: number | null) => {
    const key = id ? ['clinical-note', id] : null;

    return useSWR<ClinicalNote>(
      key,
      () => clinicalNoteService.getClinicalNoteById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch clinical note:', err);
          setError(err.message || 'Failed to fetch clinical note');
        },
      }
    );
  };

  /**
   * Fetch clinical note by visit ID.
   * Useful for getting the clinical note associated with a specific visit.
   *
   * @example
   * const { data, error, isLoading, mutate } = useClinicalNoteByVisit(123);
   */
  const useClinicalNoteByVisit = (visitId: number | null) => {
    const key = visitId ? ['clinical-note-by-visit', visitId] : null;

    return useSWR<ClinicalNote | null>(
      key,
      () => clinicalNoteService.getClinicalNoteByVisit(visitId!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch clinical note by visit:', err);
          setError(err.message || 'Failed to fetch clinical note by visit');
        },
      }
    );
  };

  // ==================== MUTATION CALLBACKS ====================

  /**
   * Create a new clinical note.
   *
   * @example
   * const { createNote } = useClinicalNote();
   * await createNote({
   *   visit: 123,
   *   present_complaints: 'Fever and cough',
   *   diagnosis: 'Upper respiratory infection',
   * });
   */
  const createNote = useCallback(
    async (noteData: ClinicalNoteCreateData): Promise<ClinicalNote | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const newNote = await clinicalNoteService.createClinicalNote(noteData);
        return newNote;
      } catch (err: any) {
        setError(err.message || 'Failed to create clinical note');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing clinical note.
   *
   * @example
   * const { updateNote } = useClinicalNote();
   * await updateNote(123, { treatment_plan: 'Updated treatment' });
   */
  const updateNote = useCallback(
    async (id: number, noteData: ClinicalNoteUpdateData): Promise<ClinicalNote | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedNote = await clinicalNoteService.updateClinicalNote(id, noteData);
        return updatedNote;
      } catch (err: any) {
        setError(err.message || 'Failed to update clinical note');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a clinical note.
   *
   * @example
   * const { deleteNote } = useClinicalNote();
   * await deleteNote(123);
   */
  const deleteNote = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await clinicalNoteService.deleteClinicalNote(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete clinical note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Query hooks
    useClinicalNotes,
    useClinicalNoteById,
    useClinicalNoteByVisit,

    // Mutation callbacks
    createNote,
    updateNote,
    deleteNote,

    // State
    isLoading,
    error,
    hasHMSAccess,
  };
};
