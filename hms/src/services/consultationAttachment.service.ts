// src/services/consultationAttachment.service.ts
import { hmsClient } from '@/lib/client';

export interface ConsultationAttachment {
  id: number;
  tenant_id: string;
  encounter_type: 'visit' | 'admission';
  object_id: number;
  file: string; // URL to the file
  file_name: string;
  file_type: string;
  file_size: number;
  description: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultationAttachmentCreate {
  encounter_type: 'visit' | 'admission';
  object_id: number;
  file: File;
  description?: string;
}

export interface ConsultationAttachmentListParams {
  encounter_type?: 'visit' | 'admission';
  object_id?: number;
  page?: number;
  page_size?: number;
}

export interface ConsultationAttachmentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConsultationAttachment[];
}

class ConsultationAttachmentService {
  private baseURL = '/opd/visit-attachments';

  /**
   * Get list of consultation attachments with optional filters
   */
  async getAttachments(params?: ConsultationAttachmentListParams): Promise<ConsultationAttachmentListResponse> {
    console.log('[ConsultationAttachment] Fetching attachments with params:', params);
    try {
      const response = await hmsClient.get<ConsultationAttachmentListResponse>(
        `${this.baseURL}/`,
        { params }
      );
      console.log('[ConsultationAttachment] Fetched attachments:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ConsultationAttachment] Error fetching attachments:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch consultation attachments';
      throw new Error(message);
    }
  }

  /**
   * Get a single consultation attachment by ID
   */
  async getAttachmentById(id: number): Promise<ConsultationAttachment> {
    try {
      const response = await hmsClient.get<ConsultationAttachment>(
        `${this.baseURL}/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch consultation attachment';
      throw new Error(message);
    }
  }

  /**
   * Upload a new consultation attachment
   */
  async uploadAttachment(data: ConsultationAttachmentCreate): Promise<ConsultationAttachment> {
    console.log('[ConsultationAttachment] Uploading attachment:', {
      encounter_type: data.encounter_type,
      object_id: data.object_id,
      fileName: data.file.name,
      fileSize: data.file.size,
      description: data.description,
    });

    const formData = new FormData();
    formData.append('encounter_type', data.encounter_type);
    formData.append('object_id', data.object_id.toString());
    formData.append('file', data.file);
    if (data.description) {
      formData.append('description', data.description);
    }

    try {
      console.log('[ConsultationAttachment] Making POST request to:', `${this.baseURL}/`);
      const response = await hmsClient.post<ConsultationAttachment>(
        `${this.baseURL}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('[ConsultationAttachment] Upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ConsultationAttachment] Upload failed:', error);
      console.error('[ConsultationAttachment] Error response:', error.response?.data);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to upload consultation attachment';
      throw new Error(message);
    }
  }

  /**
   * Update an existing consultation attachment (description only)
   */
  async updateAttachment(id: number, description: string): Promise<ConsultationAttachment> {
    try {
      const response = await hmsClient.patch<ConsultationAttachment>(
        `${this.baseURL}/${id}/`,
        { description }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update consultation attachment';
      throw new Error(message);
    }
  }

  /**
   * Delete a consultation attachment
   */
  async deleteAttachment(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete consultation attachment';
      throw new Error(message);
    }
  }

  /**
   * Download a consultation attachment
   */
  downloadAttachment(file: ConsultationAttachment): void {
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const consultationAttachmentService = new ConsultationAttachmentService();
