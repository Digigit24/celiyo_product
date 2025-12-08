// src/services/clinicalNote.service.ts
import { hmsClient } from '@/lib/client';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import type {
  ClinicalNote,
  ClinicalNoteCreateData,
  ClinicalNoteUpdateData,
  ClinicalNoteListParams,
  PaginatedResponse,
} from '@/types/clinicalNote.types';

interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

class ClinicalNoteService {
  // ==================== CLINICAL NOTES ====================

  // Get clinical notes with optional query parameters
  async getClinicalNotes(params?: ClinicalNoteListParams): Promise<PaginatedResponse<ClinicalNote>> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<PaginatedResponse<ClinicalNote>>(
        `${API_CONFIG.HMS.OPD.CLINICAL_NOTES.LIST}${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch clinical notes';
      throw new Error(message);
    }
  }

  // Get single clinical note by ID
  async getClinicalNoteById(id: number): Promise<ClinicalNote> {
    try {
      const response = await hmsClient.get<ClinicalNote>(
        API_CONFIG.HMS.OPD.CLINICAL_NOTES.DETAIL.replace(':id', id.toString())
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch clinical note';
      throw new Error(message);
    }
  }

  // Create new clinical note
  async createClinicalNote(noteData: ClinicalNoteCreateData): Promise<ClinicalNote> {
    try {
      const response = await hmsClient.post<ApiResponse<ClinicalNote>>(
        API_CONFIG.HMS.OPD.CLINICAL_NOTES.CREATE,
        noteData
      );
      // Handle both wrapped and direct responses
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create clinical note';
      throw new Error(message);
    }
  }

  // Update clinical note
  async updateClinicalNote(id: number, noteData: ClinicalNoteUpdateData): Promise<ClinicalNote> {
    try {
      const response = await hmsClient.patch<ApiResponse<ClinicalNote>>(
        API_CONFIG.HMS.OPD.CLINICAL_NOTES.UPDATE.replace(':id', id.toString()),
        noteData
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update clinical note';
      throw new Error(message);
    }
  }

  // Delete clinical note
  async deleteClinicalNote(id: number): Promise<void> {
    try {
      await hmsClient.delete(
        API_CONFIG.HMS.OPD.CLINICAL_NOTES.DELETE.replace(':id', id.toString())
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete clinical note';
      throw new Error(message);
    }
  }

  // Get clinical note by visit ID
  async getClinicalNoteByVisit(visitId: number): Promise<ClinicalNote | null> {
    try {
      const queryString = buildQueryString({ visit: visitId });
      const response = await hmsClient.get<PaginatedResponse<ClinicalNote>>(
        `${API_CONFIG.HMS.OPD.CLINICAL_NOTES.LIST}${queryString}`
      );
      // Clinical notes have OneToOne relationship with visits, so return first result
      return response.data.results?.[0] || null;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch clinical note by visit';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const clinicalNoteService = new ClinicalNoteService();
export default clinicalNoteService;
