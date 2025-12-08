import { whatsappClient } from "@/lib/whatsappClient";
import { API_CONFIG, buildUrl } from "@/lib/apiConfig";

export type MediaMessagePayload = {
  to: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  media_id: string;
  caption?: string;
};

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await whatsappClient.post(API_CONFIG.WHATSAPP.UPLOAD_MEDIA, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const sendMediaMessage = async (payload: MediaMessagePayload) => {
  const response = await whatsappClient.post(API_CONFIG.WHATSAPP.SEND_MEDIA, payload);
  return response.data;
};

export const getMediaUrl = (media_id: string) => {
  return buildUrl(API_CONFIG.WHATSAPP.GET_MEDIA, { media_id }, 'whatsapp');
};
