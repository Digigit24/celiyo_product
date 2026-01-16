// src/hooks/useConsultationAttachment.ts
import useSWR, { mutate } from 'swr';
import {
  consultationAttachmentService,
  ConsultationAttachment,
  ConsultationAttachmentCreate,
  ConsultationAttachmentListParams,
  ConsultationAttachmentListResponse,
} from '@/services/consultationAttachment.service';

/**
 * Hook for managing consultation attachments
 */
export const useConsultationAttachment = () => {
  /**
   * Get list of consultation attachments
   */
  const useAttachments = (params?: ConsultationAttachmentListParams) => {
    const key = params
      ? [`/hms/consultation-attachments`, params]
      : null;

    return useSWR<ConsultationAttachmentListResponse, Error>(
      key,
      () => consultationAttachmentService.getAttachments(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }
    );
  };

  /**
   * Get a single consultation attachment by ID
   */
  const useAttachmentById = (id: number | null) => {
    const key = id ? `/hms/consultation-attachments/${id}` : null;

    return useSWR<ConsultationAttachment, Error>(
      key,
      () => consultationAttachmentService.getAttachmentById(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }
    );
  };

  /**
   * Upload a new consultation attachment
   */
  const uploadAttachment = async (data: ConsultationAttachmentCreate): Promise<ConsultationAttachment> => {
    const result = await consultationAttachmentService.uploadAttachment(data);

    // Revalidate the list for this specific encounter
    mutate(
      (key: any) =>
        Array.isArray(key) &&
        key[0] === '/hms/consultation-attachments' &&
        key[1]?.encounter_type === data.encounter_type &&
        key[1]?.object_id === data.object_id
    );

    return result;
  };

  /**
   * Update an existing consultation attachment
   */
  const updateAttachment = async (id: number, description: string): Promise<ConsultationAttachment> => {
    const result = await consultationAttachmentService.updateAttachment(id, description);

    // Revalidate the specific attachment
    mutate(`/hms/consultation-attachments/${id}`);

    // Revalidate all lists containing this attachment
    mutate(
      (key: any) =>
        Array.isArray(key) && key[0] === '/hms/consultation-attachments'
    );

    return result;
  };

  /**
   * Delete a consultation attachment
   */
  const deleteAttachment = async (id: number): Promise<void> => {
    await consultationAttachmentService.deleteAttachment(id);

    // Revalidate all attachment lists
    mutate(
      (key: any) =>
        Array.isArray(key) && key[0] === '/hms/consultation-attachments'
    );
  };

  /**
   * Download a consultation attachment
   */
  const downloadAttachment = (file: ConsultationAttachment): void => {
    consultationAttachmentService.downloadAttachment(file);
  };

  return {
    useAttachments,
    useAttachmentById,
    uploadAttachment,
    updateAttachment,
    deleteAttachment,
    downloadAttachment,
  };
};
