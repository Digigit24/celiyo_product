// src/services/externalWhatsappService.ts
// External WhatsApp API Service - Uses Laravel backend with vendor UID in URL path
// API Base: https://whatsappapi.celiyo.com/api/{vendorUid}/...

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG } from '@/lib/apiConfig';
import { tokenManager } from '@/lib/client';

const USER_KEY = 'celiyo_user';

// ==================== HELPER FUNCTIONS ====================

export const getWhatsappVendorUid = (): string | null => {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      const user = JSON.parse(userJson);
      return user?.tenant?.whatsapp_vendor_uid || null;
    }
  } catch (error) {
    console.error('Failed to get WhatsApp Vendor UID:', error);
  }
  return null;
};

export const getWhatsappApiToken = (): string | null => {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      const user = JSON.parse(userJson);
      return user?.tenant?.whatsapp_api_token || null;
    }
  } catch (error) {
    console.error('Failed to get WhatsApp API Token:', error);
  }
  return null;
};

// ==================== API CLIENT ====================

const createExternalWhatsappClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.WHATSAPP_EXTERNAL_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      const whatsappApiToken = getWhatsappApiToken();
      const userAuthToken = tokenManager.getAccessToken();
      const token = whatsappApiToken || userAuthToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

const externalWhatsappClient = createExternalWhatsappClient();

// ==================== RESPONSE HANDLERS ====================

interface ApiResponse<T = any> {
  result?: 'success' | 'failed';
  data?: T;
  message?: string;
  error?: string;
}

const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  const { data } = response;

  // Check for failed result
  if (data.result === 'failed') {
    throw new Error(data.message || data.error || 'API request failed');
  }

  // For GET requests, data is typically in response.data.data
  if (data.data !== undefined) {
    return data.data;
  }

  // Return full response data if no nested data
  return data as unknown as T;
};

const buildVendorUrl = (endpoint: string): string => {
  const vendorUid = getWhatsappVendorUid();
  if (!vendorUid) {
    throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
  }
  return `/${vendorUid}${endpoint}`;
};

// ==================== TYPE DEFINITIONS ====================

// Template Types
export interface CreateTemplatePayload {
  template_name: string;
  language_code: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  template_type?: string;
  template_body: string;
  header_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  header_text?: string;
  footer_text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {}

// Campaign Types
export interface CreateCampaignPayload {
  title: string;
  template_uid: string;
  contact_group: string; // group-id or 'all_contacts'
  timezone?: string;
  schedule_at?: string; // ISO datetime
  expire_at?: string; // ISO datetime
}

export interface CampaignStatusResponse {
  total_recipients?: number;
  sent?: number;
  delivered?: number;
  read?: number;
  failed?: number;
  pending?: number;
  status?: string;
}

// Contact Types
export interface ImportContactItem {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
}

export interface ImportContactsPayload {
  contacts: ImportContactItem[];
  group_uids?: string[];
}

export interface CreateContactPayload {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateContactPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string;
  custom_fields?: Record<string, any>;
}

// Label Types
export interface CreateLabelPayload {
  title: string;
  text_color?: string;
  bg_color?: string;
}

export interface UpdateLabelPayload extends Partial<CreateLabelPayload> {}

// Contact Group Types
export interface CreateContactGroupPayload {
  title: string;
  description?: string;
}

export interface UpdateContactGroupPayload extends Partial<CreateContactGroupPayload> {}

export interface AddContactsToGroupPayload {
  contact_uids: string[];
}

// Message Types
export interface SendMessagePayload {
  from_phone_number_id?: string;
  phone_number: string;
  message_body: string;
  contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    country?: string;
    language_code?: string;
    groups?: string;
    custom_fields?: Record<string, any>;
  };
}

export interface SendTemplateMessagePayload {
  from_phone_number_id?: string;
  phone_number: string;
  template_name: string;
  template_language: string;
  header_image?: string;
  header_video?: string;
  header_document?: string;
  header_document_name?: string;
  header_field_1?: string;
  location_latitude?: string;
  location_longitude?: string;
  location_name?: string;
  location_address?: string;
  field_1?: string;
  field_2?: string;
  field_3?: string;
  field_4?: string;
  button_0?: string;
  button_1?: string;
  copy_code?: string;
  contact?: SendMessagePayload['contact'];
}

export interface SendMediaMessagePayload {
  from_phone_number_id?: string;
  phone_number: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  media_url: string;
  caption?: string;
  file_name?: string;
  contact?: SendMessagePayload['contact'];
}

export interface SendInteractiveMessagePayload {
  from_phone_number_id?: string;
  phone_number: string;
  interactive_type: 'button' | 'list';
  body_text: string;
  header_text?: string;
  footer_text?: string;
  buttons?: Array<{ id: string; title: string }>;
  list_sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  contact?: SendMessagePayload['contact'];
}

// ==================== MAIN SERVICE CLASS ====================

class ExternalWhatsappService {
  // ==================== UTILITY METHODS ====================

  isConfigured(): boolean {
    return !!getWhatsappVendorUid();
  }

  getVendorUid(): string | null {
    return getWhatsappVendorUid();
  }

  // ==================== TEMPLATE METHODS ====================

  async getTemplates(params?: {
    status?: string;
    category?: string;
    language?: string;
    limit?: number;
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.language) queryParams.append('language', params.language);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const url = buildVendorUrl(`/templates${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async getTemplate(templateUid: string): Promise<any> {
    const url = buildVendorUrl(`/templates/${templateUid}`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async createTemplate(payload: CreateTemplatePayload): Promise<any> {
    const url = buildVendorUrl('/templates');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async updateTemplate(templateUid: string, payload: UpdateTemplatePayload): Promise<any> {
    const url = buildVendorUrl(`/templates/${templateUid}`);
    const response = await externalWhatsappClient.put(url, payload);
    return handleResponse(response);
  }

  async deleteTemplate(templateUid: string): Promise<any> {
    const url = buildVendorUrl(`/templates/${templateUid}`);
    const response = await externalWhatsappClient.delete(url);
    return handleResponse(response);
  }

  async syncTemplates(): Promise<any> {
    const url = buildVendorUrl('/templates/sync');
    const response = await externalWhatsappClient.post(url);
    return handleResponse(response);
  }

  async getApprovedTemplates(): Promise<any[]> {
    return this.getTemplates({ status: 'APPROVED' });
  }

  async getTemplateByName(name: string, language?: string): Promise<any> {
    const templates = await this.getTemplates({ limit: 100 });
    const templateList = Array.isArray(templates) ? templates : [];
    const template = templateList.find((t: any) =>
      (t.template_name === name || t.name === name) && (!language || t.language === language)
    );
    if (!template) {
      throw new Error(`Template '${name}' not found${language ? ` for language ${language}` : ''}`);
    }
    return template;
  }

  // ==================== CAMPAIGN METHODS ====================

  async getCampaigns(params?: { status?: 'active' | 'archived' }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);

    const url = buildVendorUrl(`/campaigns${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async getCampaign(campaignUid: string): Promise<any> {
    const url = buildVendorUrl(`/campaigns/${campaignUid}`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async createCampaign(payload: CreateCampaignPayload): Promise<any> {
    const url = buildVendorUrl('/campaigns');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async getCampaignStatus(campaignUid: string): Promise<CampaignStatusResponse> {
    const url = buildVendorUrl(`/campaigns/${campaignUid}/status`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async deleteCampaign(campaignUid: string): Promise<any> {
    const url = buildVendorUrl(`/campaigns/${campaignUid}`);
    const response = await externalWhatsappClient.delete(url);
    return handleResponse(response);
  }

  async archiveCampaign(campaignUid: string): Promise<any> {
    const url = buildVendorUrl(`/campaigns/${campaignUid}/archive`);
    const response = await externalWhatsappClient.post(url);
    return handleResponse(response);
  }

  async unarchiveCampaign(campaignUid: string): Promise<any> {
    const url = buildVendorUrl(`/campaigns/${campaignUid}/unarchive`);
    const response = await externalWhatsappClient.post(url);
    return handleResponse(response);
  }

  // ==================== CONTACT METHODS ====================

  async getContacts(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = buildVendorUrl(`/contacts${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async getContact(contactUid: string): Promise<any> {
    const url = buildVendorUrl(`/contacts/${contactUid}`);
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async deleteContact(contactUid: string): Promise<any> {
    const url = buildVendorUrl(`/contacts/${contactUid}`);
    const response = await externalWhatsappClient.delete(url);
    return handleResponse(response);
  }

  async importContacts(payload: ImportContactsPayload): Promise<any> {
    const url = buildVendorUrl('/contacts/import');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  // Legacy contact create/update methods (using /contact/ prefix)
  async createContact(payload: CreateContactPayload): Promise<any> {
    const url = buildVendorUrl('/contact/create');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async updateContact(phoneNumber: string, payload: UpdateContactPayload): Promise<any> {
    const url = buildVendorUrl(`/contact/update/${phoneNumber}`);
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  // ==================== LABEL METHODS ====================

  async getLabels(): Promise<any[]> {
    const url = buildVendorUrl('/labels');
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async createLabel(payload: CreateLabelPayload): Promise<any> {
    const url = buildVendorUrl('/labels');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async updateLabel(labelUid: string, payload: UpdateLabelPayload): Promise<any> {
    const url = buildVendorUrl(`/labels/${labelUid}`);
    const response = await externalWhatsappClient.put(url, payload);
    return handleResponse(response);
  }

  async deleteLabel(labelUid: string): Promise<any> {
    const url = buildVendorUrl(`/labels/${labelUid}`);
    const response = await externalWhatsappClient.delete(url);
    return handleResponse(response);
  }

  // ==================== CONTACT GROUP METHODS ====================

  async getContactGroups(): Promise<any[]> {
    const url = buildVendorUrl('/contact-groups');
    const response = await externalWhatsappClient.get(url);
    return handleResponse(response);
  }

  async createContactGroup(payload: CreateContactGroupPayload): Promise<any> {
    const url = buildVendorUrl('/contact-groups');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async updateContactGroup(groupUid: string, payload: UpdateContactGroupPayload): Promise<any> {
    const url = buildVendorUrl(`/contact-groups/${groupUid}`);
    const response = await externalWhatsappClient.put(url, payload);
    return handleResponse(response);
  }

  async deleteContactGroup(groupUid: string): Promise<any> {
    const url = buildVendorUrl(`/contact-groups/${groupUid}`);
    const response = await externalWhatsappClient.delete(url);
    return handleResponse(response);
  }

  async addContactsToGroup(groupUid: string, payload: AddContactsToGroupPayload): Promise<any> {
    const url = buildVendorUrl(`/contact-groups/${groupUid}/contacts`);
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async removeContactsFromGroup(groupUid: string, payload: AddContactsToGroupPayload): Promise<any> {
    const url = buildVendorUrl(`/contact-groups/${groupUid}/contacts`);
    const response = await externalWhatsappClient.delete(url, { data: payload });
    return handleResponse(response);
  }

  // ==================== MESSAGING METHODS ====================

  async sendMessage(payload: SendMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-message');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async sendTemplateMessage(payload: SendTemplateMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-template-message');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async sendMediaMessage(payload: SendMediaMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-media-message');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async sendInteractiveMessage(payload: SendInteractiveMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-interactive-message');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }

  async assignTeamMember(payload: { phone_number: string; user_id: number }): Promise<any> {
    const url = buildVendorUrl('/contact/assign-team-member');
    const response = await externalWhatsappClient.post(url, payload);
    return handleResponse(response);
  }
}

export const externalWhatsappService = new ExternalWhatsappService();
