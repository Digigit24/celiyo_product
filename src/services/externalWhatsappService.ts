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

// Create axios instance for external WhatsApp API
const createExternalWhatsappClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.WHATSAPP_EXTERNAL_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - attach Bearer token
  client.interceptors.request.use(
    (config) => {
      const token = tokenManager.getAccessToken();
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
}

export const externalWhatsappService = new ExternalWhatsappService();
