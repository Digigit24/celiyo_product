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

  /**
   * Create a new template
   * API Endpoint: POST /api/{vendorUid}/templates
   * @param payload - Template creation data
   * @returns Promise with created template data
   */
  async createTemplate(payload: CreateTemplatePayload): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
    }

    const url = `/${vendorUid}/templates`;
    console.log('➕ Creating template via external API:', url, payload);

    try {
      const response = await externalWhatsappClient.post(url, payload);
      console.log('✅ Template created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create template:', error);

      if (error.response?.status === 409) {
        throw new Error('Template name already exists');
      }
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors || error.response?.data?.message;
        throw new Error(typeof validationErrors === 'object' ? JSON.stringify(validationErrors) : validationErrors || 'Validation failed');
      }

      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create template';
      throw new Error(message);
    }
  }

  /**
   * Update an existing template
   * API Endpoint: PUT /api/{vendorUid}/templates/{templateUid}
   * @param templateUid - The template UID to update
   * @param payload - Template update data
   * @returns Promise with updated template data
   */
  async updateTemplate(templateUid: number | string, payload: UpdateTemplatePayload): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
    }

    const url = `/${vendorUid}/templates/${templateUid}`;
    console.log('✏️ Updating template via external API:', url, payload);

    try {
      const response = await externalWhatsappClient.put(url, payload);
      console.log('✅ Template updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update template:', error);

      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors || error.response?.data?.message;
        throw new Error(typeof validationErrors === 'object' ? JSON.stringify(validationErrors) : validationErrors || 'Validation failed');
      }

      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to update template';
      throw new Error(message);
    }
  }

  /**
   * Delete a template
   * API Endpoint: DELETE /api/{vendorUid}/templates/{templateUid}
   * @param templateUid - The template UID to delete
   * @returns Promise with deletion response
   */
  async deleteTemplate(templateUid: number | string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured. Please set it in Admin Settings > Tenant Settings.');
    }

    const url = `/${vendorUid}/templates/${templateUid}`;
    console.log('🗑️ Deleting template via external API:', url);

    try {
      const response = await externalWhatsappClient.delete(url);
      console.log('✅ Template deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete template:', error);

      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }

      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to delete template';
      throw new Error(message);
    }
  }

  // ==================== CAMPAIGN METHODS ====================

  /**
   * Get all campaigns
   * API Endpoint: GET /api/{vendorUid}/campaigns
   * @param params - Optional query parameters (status: 'active' | 'archived')
   */
  async getCampaigns(params?: { status?: 'active' | 'archived' }): Promise<CampaignsApiResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);

    const url = `/${vendorUid}/campaigns${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('📥 Getting campaigns via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Campaigns fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaigns:', error);
      const message = error.response?.data?.message || 'Failed to fetch campaigns';
      throw new Error(message);
    }
  }

  /**
   * Get single campaign by UID
   * API Endpoint: GET /api/{vendorUid}/campaigns/{uid}
   */
  async getCampaign(campaignUid: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/campaigns/${campaignUid}`;
    console.log('📥 Getting campaign via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Campaign fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign:', error);
      if (error.response?.status === 404) {
        throw new Error('Campaign not found');
      }
      const message = error.response?.data?.message || 'Failed to fetch campaign';
      throw new Error(message);
    }
  }

  /**
   * Get campaign status/stats
   * API Endpoint: GET /api/{vendorUid}/campaigns/{uid}/status
   */
  async getCampaignStatus(campaignUid: string): Promise<CampaignStatusResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/campaigns/${campaignUid}/status`;
    console.log('📊 Getting campaign status via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Campaign status fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign status:', error);
      const message = error.response?.data?.message || 'Failed to fetch campaign status';
      throw new Error(message);
    }
  }

  /**
   * Delete a campaign
   * API Endpoint: DELETE /api/{vendorUid}/campaigns/{uid}
   */
  async deleteCampaign(campaignUid: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/campaigns/${campaignUid}`;
    console.log('🗑️ Deleting campaign via external API:', url);

    try {
      const response = await externalWhatsappClient.delete(url);
      console.log('✅ Campaign deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete campaign:', error);
      if (error.response?.status === 404) {
        throw new Error('Campaign not found');
      }
      const message = error.response?.data?.message || 'Failed to delete campaign';
      throw new Error(message);
    }
  }

  /**
   * Archive a campaign
   * API Endpoint: POST /api/{vendorUid}/campaigns/{uid}/archive
   */
  async archiveCampaign(campaignUid: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/campaigns/${campaignUid}/archive`;
    console.log('📦 Archiving campaign via external API:', url);

    try {
      const response = await externalWhatsappClient.post(url);
      console.log('✅ Campaign archived successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to archive campaign:', error);
      const message = error.response?.data?.message || 'Failed to archive campaign';
      throw new Error(message);
    }
  }

  /**
   * Unarchive a campaign
   * API Endpoint: POST /api/{vendorUid}/campaigns/{uid}/unarchive
   */
  async unarchiveCampaign(campaignUid: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/campaigns/${campaignUid}/unarchive`;
    console.log('📤 Unarchiving campaign via external API:', url);

    try {
      const response = await externalWhatsappClient.post(url);
      console.log('✅ Campaign unarchived successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to unarchive campaign:', error);
      const message = error.response?.data?.message || 'Failed to unarchive campaign';
      throw new Error(message);
    }
  }

  // ==================== CONTACT METHODS ====================

  /**
   * Get all contacts with pagination
   * API Endpoint: GET /api/{vendorUid}/contacts
   * @param params - Query parameters (page, limit, search)
   */
  async getContacts(params?: { page?: number; limit?: number; search?: string }): Promise<ContactsApiResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/${vendorUid}/contacts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('📥 Getting contacts via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Contacts fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch contacts:', error);
      const message = error.response?.data?.message || 'Failed to fetch contacts';
      throw new Error(message);
    }
  }

  /**
   * Get single contact by UID
   * API Endpoint: GET /api/{vendorUid}/contacts/{uid}
   */
  async getContact(contactUid: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/contacts/${contactUid}`;
    console.log('📥 Getting contact via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Contact fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch contact:', error);
      if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      const message = error.response?.data?.message || 'Failed to fetch contact';
      throw new Error(message);
    }
  }

  /**
   * Delete a contact
   * API Endpoint: DELETE /api/{vendorUid}/contacts/{uid}
   */
  async deleteContact(contactUid: string): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/contacts/${contactUid}`;
    console.log('🗑️ Deleting contact via external API:', url);

    try {
      const response = await externalWhatsappClient.delete(url);
      console.log('✅ Contact deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete contact:', error);
      if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      const message = error.response?.data?.message || 'Failed to delete contact';
      throw new Error(message);
    }
  }

  /**
   * Create a new contact
   * API Endpoint: POST /api/{vendorUid}/contact/create
   */
  async createContact(payload: CreateContactPayload): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/contact/create`;
    console.log('➕ Creating contact via external API:', url);

    try {
      const response = await externalWhatsappClient.post(url, payload);
      console.log('✅ Contact created successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create contact:', error);
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors || error.response?.data?.message;
        throw new Error(typeof validationErrors === 'object' ? JSON.stringify(validationErrors) : validationErrors || 'Validation failed');
      }
      const message = error.response?.data?.message || 'Failed to create contact';
      throw new Error(message);
    }
  }

  /**
   * Update a contact by phone number
   * API Endpoint: POST /api/{vendorUid}/contact/update/{phone}
   */
  async updateContact(phoneNumber: string, payload: UpdateContactPayload): Promise<any> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/contact/update/${phoneNumber}`;
    console.log('✏️ Updating contact via external API:', url);

    try {
      const response = await externalWhatsappClient.post(url, payload);
      console.log('✅ Contact updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update contact:', error);
      if (error.response?.status === 404) {
        throw new Error('Contact not found');
      }
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors || error.response?.data?.message;
        throw new Error(typeof validationErrors === 'object' ? JSON.stringify(validationErrors) : validationErrors || 'Validation failed');
      }
      const message = error.response?.data?.message || 'Failed to update contact';
      throw new Error(message);
    }
  }

  /**
   * Get all labels
   * API Endpoint: GET /api/{vendorUid}/labels
   */
  async getLabels(): Promise<LabelsApiResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/labels`;
    console.log('🏷️ Getting labels via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Labels fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch labels:', error);
      const message = error.response?.data?.message || 'Failed to fetch labels';
      throw new Error(message);
    }
  }

  /**
   * Get all contact groups
   * API Endpoint: GET /api/{vendorUid}/contact-groups
   */
  async getContactGroups(): Promise<ContactGroupsApiResponse> {
    const vendorUid = getWhatsappVendorUid();
    if (!vendorUid) {
      throw new Error('WhatsApp Vendor UID not configured.');
    }

    const url = `/${vendorUid}/contact-groups`;
    console.log('👥 Getting contact groups via external API:', url);

    try {
      const response = await externalWhatsappClient.get(url);
      console.log('✅ Contact groups fetched successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch contact groups:', error);
      const message = error.response?.data?.message || 'Failed to fetch contact groups';
      throw new Error(message);
    }
  }
}

// ==================== TEMPLATE CRUD PAYLOAD TYPES ====================

/**
 * Payload for creating a new template
 * Based on API: POST /api/{vendorUid}/templates
 */
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

/**
 * Payload for updating a template
 * Based on API: PUT /api/{vendorUid}/templates/{templateUid}
 */
export interface UpdateTemplatePayload {
  template_name?: string;
  language_code?: string;
  category?: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  template_type?: string;
  template_body?: string;
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

// ==================== CAMPAIGN API TYPES ====================

/**
 * Response structure for campaigns list API
 */
export interface CampaignsApiResponse {
  data?: any[];
  campaigns?: any[];
  total?: number;
  current_page?: number;
  per_page?: number;
  [key: string]: any;
}

/**
 * Response structure for campaign status API
 */
export interface CampaignStatusResponse {
  total_recipients?: number;
  sent?: number;
  delivered?: number;
  read?: number;
  failed?: number;
  pending?: number;
  status?: string;
  [key: string]: any;
}

// ==================== CONTACT API TYPES ====================

/**
 * Response structure for contacts list API
 */
export interface ContactsApiResponse {
  data?: any[];
  contacts?: any[];
  total?: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
  [key: string]: any;
}

/**
 * Payload for creating a new contact
 */
export interface CreateContactPayload {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string[];
  labels?: string[];
  [key: string]: any;
}

/**
 * Payload for updating a contact
 */
export interface UpdateContactPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string[];
  labels?: string[];
  [key: string]: any;
}

/**
 * Response structure for labels API
 */
export interface LabelsApiResponse {
  data?: any[];
  labels?: any[];
  [key: string]: any;
}

/**
 * Response structure for contact groups API
 */
export interface ContactGroupsApiResponse {
  data?: any[];
  groups?: any[];
  [key: string]: any;
}

export const externalWhatsappService = new ExternalWhatsappService();
