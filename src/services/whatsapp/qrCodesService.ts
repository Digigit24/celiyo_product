// src/services/whatsapp/qrCodesService.ts
import { whatsappClient } from '@/lib/whatsappClient';
import { API_CONFIG, buildUrl, buildQueryString } from '@/lib/apiConfig';
import {
  QRCode,
  QRCodeCreate,
  QRCodeUpdate,
  QRCodeListResponse,
  QRCodeDeleteResponse,
  ImageType,
} from '@/types/whatsappTypes';

class QRCodesService {
  /**
   * Get all QR codes with pagination
   */
  async getQRCodes(skip = 0, limit = 50): Promise<QRCodeListResponse> {
    try {

      const queryString = buildQueryString({ skip, limit });
      const url = `${API_CONFIG.WHATSAPP.QR_CODES}${queryString}`;

      const response = await whatsappClient.get<QRCodeListResponse>(url);

        total: response.data.total,
        count: response.data.items.length,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch QR codes';
      throw new Error(message);
    }
  }

  /**
   * Fetch QR codes from WhatsApp API and sync with database
   */
  async fetchQRCodesFromWhatsApp(imageType?: ImageType): Promise<QRCodeListResponse> {
    try {

      const queryString = imageType ? buildQueryString({ image_type: imageType }) : '';
      const url = `${API_CONFIG.WHATSAPP.QR_CODE_FETCH}${queryString}`;

      const response = await whatsappClient.get<QRCodeListResponse>(url);

        total: response.data.total,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch QR codes from WhatsApp';
      throw new Error(message);
    }
  }

  /**
   * Get single QR code by code
   */
  async getQRCode(code: string, imageType?: ImageType): Promise<QRCode> {
    try {

      const url = buildUrl(
        API_CONFIG.WHATSAPP.QR_CODE_DETAIL,
        { code },
        'whatsapp'
      );

      const queryString = imageType ? buildQueryString({ image_type: imageType }) : '';
      const fullUrl = `${url}${queryString}`;

      const response = await whatsappClient.get<QRCode>(fullUrl);


      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch QR code';
      throw new Error(message);
    }
  }

  /**
   * Create a new QR code
   */
  async createQRCode(payload: QRCodeCreate): Promise<QRCode> {
    try {

      const url = API_CONFIG.WHATSAPP.QR_CODE_CREATE;

      const response = await whatsappClient.post<QRCode>(url, payload);


      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create QR code';
      throw new Error(message);
    }
  }

  /**
   * Update QR code prefilled message
   */
  async updateQRCode(code: string, payload: QRCodeUpdate): Promise<QRCode> {
    try {

      const url = buildUrl(
        API_CONFIG.WHATSAPP.QR_CODE_UPDATE,
        { code },
        'whatsapp'
      );

      const response = await whatsappClient.put<QRCode>(url, payload);


      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update QR code';
      throw new Error(message);
    }
  }

  /**
   * Delete a QR code
   */
  async deleteQRCode(code: string): Promise<QRCodeDeleteResponse> {
    try {

      const url = buildUrl(
        API_CONFIG.WHATSAPP.QR_CODE_DELETE,
        { code },
        'whatsapp'
      );

      const response = await whatsappClient.delete<QRCodeDeleteResponse>(url);


      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete QR code';
      throw new Error(message);
    }
  }
}

export const qrCodesService = new QRCodesService();
