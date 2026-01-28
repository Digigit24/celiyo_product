// src/services/externalWhatsappService.ts
// External WhatsApp API Service - Uses Laravel backend with vendor UID in URL path
// API Base: https://whatsappapi.celiyo.com/api/{vendorUid}/...

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '@/lib/apiConfig';
import { tokenManager } from '@/lib/client';

const USER_KEY = 'celiyo_user';

// Get WhatsApp Vendor UID from localStorage
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

// Get WhatsApp API Token from localStorage
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

// Create axios instance for external WhatsApp API
const createExternalWhatsappClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.WHATSAPP_EXTERNAL_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - attach WhatsApp API token (NOT user auth token)
  client.interceptors.request.use(
    (config) => {
      // Use WhatsApp API token for external WhatsApp API calls
      const whatsappApiToken = getWhatsappApiToken();
      // Fallback to user auth token if WhatsApp API token is not set
      const userAuthToken = tokenManager.getAccessToken();
      const token = whatsappApiToken || userAuthToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Using token for WhatsApp API:', whatsappApiToken ? 'WhatsApp API Token' : 'User Auth Token (fallback)');
      } else {
        console.warn('⚠️ No token found for WhatsApp API request!');
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

const externalWhatsappClient = createExternalWhatsappClient();

// Build URL with vendor UID
const buildVendorUrl = (endpoint: string): string => {
  const vendorUid = getWhatsappVendorUid();
  if (!vendorUid) {
    throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
  }
  return `/${vendorUid}${endpoint}`;
};

// Types for API requests (aligned with Laravel backend)
export interface ContactInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string; // comma-separated group names
  custom_fields?: Record<string, any>;
}

export interface SendMessagePayload {
  from_phone_number_id?: string; // optional, uses default if not provided
  phone_number: string;
  message_body: string;
  contact?: ContactInfo; // optional, creates contact if doesn't exist
}

export interface SendMediaMessagePayload {
  from_phone_number_id?: string;
  phone_number: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  media_url: string;
  caption?: string; // for image or video
  file_name?: string; // for document
  contact?: ContactInfo;
}

export interface SendTemplateMessagePayload {
  from_phone_number_id?: string;
  phone_number: string;
  template_name: string;
  template_language: string;
  
  // Header parameters
  header_image?: string;
  header_video?: string;
  header_document?: string;
  header_document_name?: string;
  header_field_1?: string;
  
  // Location parameters
  location_latitude?: string;
  location_longitude?: string;
  location_name?: string;
  location_address?: string;
  
  // Body parameters (field_1, field_2, field_3, field_4, etc.)
  field_1?: string;
  field_2?: string;
  field_3?: string;
  field_4?: string;
  
  // Button parameters (button_0, button_1, etc.)
  button_0?: string;
  button_1?: string;
  
  // Copy code
  copy_code?: string;
  
  contact?: ContactInfo;
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
  contact?: ContactInfo;
}

export interface CreateContactPayload {
  first_name: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string; // comma-separated
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

export interface AssignTeamMemberPayload {
  phone_number: string;
  user_id: number;
}

// External WhatsApp API Service
class ExternalWhatsappService {
  // Send text message
  async sendMessage(payload: SendMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-message');
    console.log('📤 Sending message via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Send template message
  async sendTemplateMessage(payload: SendTemplateMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-template-message');
    console.log('📤 Sending template message via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Send media message
  async sendMediaMessage(payload: SendMediaMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-media-message');
    console.log('📤 Sending media message via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Send interactive message
  async sendInteractiveMessage(payload: SendInteractiveMessagePayload): Promise<any> {
    const url = buildVendorUrl('/contact/send-interactive-message');
    console.log('📤 Sending interactive message via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Create contact
  async createContact(payload: CreateContactPayload): Promise<any> {
    const url = buildVendorUrl('/contact/create');
    console.log('📤 Creating contact via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Update contact
  async updateContact(phoneNumber: string, payload: UpdateContactPayload): Promise<any> {
    const url = buildVendorUrl(`/contact/update/${phoneNumber}`);
    console.log('📤 Updating contact via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Assign team member to contact
  async assignTeamMember(payload: AssignTeamMemberPayload): Promise<any> {
    const url = buildVendorUrl('/contact/assign-team-member');
    console.log('📤 Assigning team member via external API:', url);
    const response = await externalWhatsappClient.post(url, payload);
    return response.data;
  }

  // Get contact by phone number or email
  async getContact(phoneNumberOrEmail: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }
    const url = `/${vendorUid}/contact?phone_number_or_email=${encodeURIComponent(phoneNumberOrEmail)}`;
    console.log('📥 Getting contact via external API:', url);
    const response = await externalWhatsappClient.get(url);
    return response.data;
  }

  // Get contacts list
  async getContacts(params?: { page?: number; page_size?: number; search_term?: string }): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.search_term) queryParams.append('search_term', params.search_term);

    const url = `/${vendorUid}/contacts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('📥 Getting contacts via external API:', url);
    const response = await externalWhatsappClient.get(url);
    return response.data;
  }

  // Check if vendor UID is configured
  isConfigured(): boolean {
    return !!getWhatsappVendorUid();
  }

  // Get current vendor UID (for display purposes)
  getVendorUid(): string | null {
    return getWhatsappVendorUid();
  }

  // ==================== TEMPLATE METHODS (for external API with vendor UID) ====================
  // These use Laravel API routes: GET /api/{vendorUid}/templates

  /**
   * Get all templates for vendor
   * API Endpoint: GET /api/{vendorUid}/templates
   * @param params - Optional query parameters for filtering
   * @returns Promise with templates data from Laravel backend
   */
  async getTemplates(params?: {
    status?: string;
    category?: string;
    language?: string;
    limit?: number;
    skip?: number;
    page?: number;
    per_page?: number;
  }): Promise<TemplatesApiResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
    }

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.language) queryParams.append('language', params.language);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    // Use the new API route: /{vendorUid}/templates
    const url = `/${vendorUid}/templates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('📥 Getting templates via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Templates fetched successfully:', {
        total: response.data?.data?.length || response.data?.length || 0
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch templates:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch templates';
      throw new Error(message);
    }
  }

  /**
   * Get single template by UID
   * API Endpoint: GET /api/{vendorUid}/templates/{templateUid}
   * @param templateUid - The template UID to fetch
   * @returns Promise with template data from Laravel backend
   */
  async getTemplate(templateUid: number | string): Promise<TemplateApiResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
    }

    // Use the new API route: /{vendorUid}/templates/{templateUid}
    const url = `/${vendorUid}/templates/${templateUid}`;
    console.log('📥 Getting template via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Template fetched successfully:', response.data?.data?.name || response.data?.name);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch template:', error);

      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }

      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to fetch template';
      throw new Error(message);
    }
  }

  /**
   * Get template by name and language (convenience method)
   * Fetches all templates and filters by name and language
   * @param name - Template name
   * @param language - Template language code
   * @returns Promise with matching template or throws error if not found
   */
  async getTemplateByName(name: string, language?: string): Promise<any> {
    console.log('📥 Getting template by name:', { name, language });

    try {
      const response = await this.getTemplates({ limit: 100 });
      const templates = response.data || response;

      const templateList = Array.isArray(templates) ? templates : [];
      const template = templateList.find((t: any) =>
        t.name === name && (!language || t.language === language)
      );

      if (!template) {
        throw new Error(`Template '${name}' not found${language ? ` for language ${language}` : ''}`);
      }

      console.log('✅ Template found by name:', template.name);
      return template;
    } catch (error: any) {
      console.error('❌ Failed to get template by name:', error);
      throw error;
    }
  }

  /**
   * Get approved templates only (convenience method)
   * @returns Promise with approved templates
   */
  async getApprovedTemplates(): Promise<TemplatesApiResponse> {
    return this.getTemplates({ status: 'APPROVED' });
  }

  /**
   * Sync templates with Meta API (if endpoint exists)
   * Note: This endpoint may not be available in all Laravel setups
   */
  async syncTemplates(): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    // Try the sync endpoint if it exists
    const url = `/${vendorUid}/templates/sync`;
    console.log('🔄 Syncing templates via external API:', url);

    try {
      const response = await externalWhatsappClient.post(url);
      console.log('✅ Templates synced successfully');
      return response.data;
    } catch (error: any) {
      // If sync endpoint doesn't exist, just refetch templates
      if (error.response?.status === 404) {
        console.warn('⚠️ Sync endpoint not available, fetching templates instead');
        return this.getTemplates();
      }
      throw error;
    }
  }
}

// ==================== TEMPLATE API RESPONSE TYPES ====================

/**
 * Response structure for templates list API
 * The Laravel backend may return different formats, this handles common patterns
 */
export interface TemplatesApiResponse {
  data?: any[];
  templates?: any[];
  items?: any[];
  total?: number;
  recordsTotal?: number;
  recordsFiltered?: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
  // Also handle direct array response
  [key: string]: any;
}

/**
 * Response structure for single template API
 */
export interface TemplateApiResponse {
  data?: any;
  template?: any;
  // Direct object response
  [key: string]: any;
}

export const externalWhatsappService = new ExternalWhatsappService();
