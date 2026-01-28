// src/services/whatsapp/templatesService.ts
// Templates Service - Supports both Laravel WEB routes and API routes
//
// WEB Routes (web.php): /vendor-console/whatsapp/templates/
//   - Used for admin panel template management
//   - Requires session-based authentication
//
// API Routes (api.php): /api/{vendorUid}/templates
//   - GET /{vendorUid}/templates - Fetch all templates
//   - GET /{vendorUid}/templates/{templateUid} - Fetch single template
//   - Used for external integrations and mobile apps
//   - Requires Bearer token + vendor UID

import { laravelClient } from '@/lib/laravelClient';
import { externalWhatsappClient, getVendorUid } from '@/lib/externalWhatsappClient';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
import { externalWhatsappService, TemplatesApiResponse, TemplateApiResponse } from '@/services/externalWhatsappService';
import {
  Template,
  TemplatesListQuery,
  TemplatesListResponse,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  DeleteTemplateResponse,
  TemplateSendRequest,
  TemplateSendResponse,
  TemplateBulkSendRequest,
  TemplateBulkSendResponse,
  TemplateAnalytics,
  TemplateStatus,
  TemplateCategory,
  TemplateLanguage,
  // New API types
  LaravelTemplate,
  TemplatesApiListResponse,
  TemplateApiDetailResponse,
  TemplateApiSendRequest,
  TemplateApiSendResponse
} from '@/types/whatsappTypes';

// Laravel list response format (DataTables compatible)
interface LaravelTemplatesResponse {
  data?: Template[];
  recordsTotal?: number;
  recordsFiltered?: number;
  // Alternative format
  templates?: Template[];
  total?: number;
  // Direct array format
  [key: string]: any;
}

class TemplatesService {
  /**
   * Build URL with parameter replacement
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    let url = endpoint;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        const encoded = encodeURIComponent(String(value));
        url = url.replace(`:${key}`, encoded);
      });
    }
    return url;
  }

  /**
   * Normalize Laravel response to standard format
   * Uses mapLaravelTemplate to convert Laravel API structure to frontend format
   */
  private normalizeTemplatesResponse(raw: any): TemplatesListResponse {
    let rawTemplates: any[] = [];

    // Handle DataTables format: { data: [], recordsTotal, recordsFiltered }
    if (raw?.data && Array.isArray(raw.data)) {
      rawTemplates = raw.data;
    }
    // Handle { templates: [], total } format
    else if (raw?.templates && Array.isArray(raw.templates)) {
      rawTemplates = raw.templates;
    }
    // Handle { items: [], total } format
    else if (raw?.items && Array.isArray(raw.items)) {
      rawTemplates = raw.items;
    }
    // Handle direct array response
    else if (Array.isArray(raw)) {
      rawTemplates = raw;
    }
    // Fallback - try to find any array in the response
    else {
      rawTemplates = (Object.values(raw || {}).find((v) => Array.isArray(v)) as any[]) || [];
    }

    // Map each Laravel template to frontend format
    const mappedTemplates = rawTemplates.map(t => this.mapLaravelTemplate(t));

    return {
      items: mappedTemplates,
      total: raw?.recordsTotal || raw?.recordsFiltered || raw?.total || mappedTemplates.length,
      page: raw?.page || 1,
      page_size: raw?.page_size || mappedTemplates.length
    };
  }

  /**
   * Get all templates with optional filters
   * Uses Laravel API route: GET /api/{vendorUid}/templates
   */
  async getTemplates(query?: TemplatesListQuery): Promise<TemplatesListResponse> {
    try {
      console.log('📋 Fetching templates via API route:', query);

      // Use externalWhatsappService which calls /{vendorUid}/templates
      const response = await externalWhatsappService.getTemplates({
        status: query?.status,
        category: query?.category,
        language: query?.language,
        limit: query?.limit,
        skip: query?.skip
      });

      // Normalize the API response to our standard format
      const normalized = this.normalizeTemplatesResponse(response);

      console.log('✅ Templates fetched:', {
        total: normalized.total,
        count: normalized.items?.length || 0
      });

      return normalized;
    } catch (error: any) {
      console.error('❌ Failed to fetch templates:', error);
      const message = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || 'Failed to fetch templates';
      throw new Error(message);
    }
  }

  /**
   * Get single template by ID or UID
   * Uses Laravel API route: GET /api/{vendorUid}/templates/{templateUid}
   */
  async getTemplate(id: number | string): Promise<Template> {
    try {
      console.log('📋 Fetching template via API route:', id);

      // Use externalWhatsappService which calls /{vendorUid}/templates/{templateUid}
      const response = await externalWhatsappService.getTemplate(id);

      // Extract template from response (handles different response formats)
      const template = response.data || response.template || response;

      if (!template) {
        throw new Error('Template not found');
      }

      console.log('✅ Template fetched:', template.name || template.template_name);

      return template as Template;
    } catch (error: any) {
      console.error('❌ Failed to fetch template:', error);

      if (error.message === 'Template not found') {
        throw error;
      }

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch template';
      throw new Error(message);
    }
  }

  /**
   * Get template by name and language
   */
  async getTemplateByName(name: string, language: string): Promise<Template> {
    try {
      console.log('📋 Fetching template by name:', { name, language });

      // Fetch all templates and filter
      const response = await this.getTemplates({ limit: 100 });
      const template = response.items.find(
        t => t.name === name && t.language === language
      );

      if (!template) {
        throw new Error(`Template '${name}' not found for language ${language}`);
      }

      console.log('✅ Template fetched by name:', template.name);

      return template;
    } catch (error: any) {
      console.error('❌ Failed to fetch template by name:', error);
      throw error;
    }
  }

  /**
   * Create a new template
   * Uses Laravel WEB route: POST /vendor-console/whatsapp/templates/create-process
   */
  async createTemplate(payload: CreateTemplatePayload): Promise<Template> {
    try {
      console.log('➕ Creating template:', payload.name);

      const response = await laravelClient.post<Template>(
        API_CONFIG.WHATSAPP_EXTERNAL.APP.TEMPLATE_CREATE,
        payload
      );

      console.log('✅ Template created:', response.data.name);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create template:', error);

      if (error.response?.status === 409) {
        throw new Error('Template name already exists');
      }

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to create template';
      throw new Error(message);
    }
  }

  /**
   * Update an existing template
   * Uses Laravel WEB route: POST /vendor-console/whatsapp/templates/update-process
   */
  async updateTemplate(id: number, payload: UpdateTemplatePayload): Promise<Template> {
    try {
      console.log('✏️ Updating template:', id);

      const response = await laravelClient.post<Template>(
        API_CONFIG.WHATSAPP_EXTERNAL.APP.TEMPLATE_UPDATE,
        { ...payload, template_uid: id }
      );

      console.log('✅ Template updated:', response.data.name);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update template:', error);

      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to update template';
      throw new Error(message);
    }
  }

  /**
   * Delete a template
   * Uses Laravel WEB route: POST /vendor-console/whatsapp/templates/delete/:whatsappTemplateUid
   */
  async deleteTemplate(id: number): Promise<DeleteTemplateResponse> {
    try {
      console.log('🗑️ Deleting template:', id);

      const url = this.buildUrl(API_CONFIG.WHATSAPP_EXTERNAL.APP.TEMPLATE_DELETE, { whatsappTemplateUid: id });

      const response = await laravelClient.post<DeleteTemplateResponse>(url);

      console.log('✅ Template deleted:', id);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete template:', error);

      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to delete template';
      throw new Error(message);
    }
  }

  /**
   * Send template message
   * Uses Laravel API route: POST /{vendorUid}/contact/send-template-message
   */
  async sendTemplate(payload: TemplateSendRequest): Promise<TemplateSendResponse> {
    try {
      console.log('📤 Sending template:', payload.template_name, 'to', payload.to);

      // Send template uses the external API with vendorUid
      const response = await externalWhatsappClient.post<TemplateSendResponse>(
        API_CONFIG.WHATSAPP_EXTERNAL.SEND_TEMPLATE_MESSAGE.replace(':vendorUid', API_CONFIG.getVendorUid() || ''),
        payload
      );

      console.log('✅ Template sent:', response.data.message_id);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send template:', error);

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to send template';
      throw new Error(message);
    }
  }

  /**
   * Send template to multiple recipients (bulk)
   */
  async sendTemplateBulk(payload: TemplateBulkSendRequest): Promise<TemplateBulkSendResponse> {
    try {
      console.log('📤 Sending template bulk:', payload.template_name, 'to', payload.recipients.length, 'recipients');

      // Send to each recipient individually using the external API
      let sent = 0;
      let failed = 0;

      for (const recipient of payload.recipients) {
        try {
          await this.sendTemplate({
            template_name: payload.template_name,
            to: recipient.phone,
            language: payload.language,
            components: recipient.components || payload.components
          });
          sent++;
        } catch {
          failed++;
        }
      }

      console.log('✅ Template bulk sent:', sent, 'successful,', failed, 'failed');

      return { sent, failed, total: payload.recipients.length };
    } catch (error: any) {
      console.error('❌ Failed to send template bulk:', error);

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to send template bulk';
      throw new Error(message);
    }
  }

  /**
   * Get template analytics
   * Note: May not be available in Laravel web routes
   */
  async getTemplateAnalytics(id: number): Promise<TemplateAnalytics> {
    try {
      console.log('📊 Fetching template analytics:', id);

      // This endpoint may not exist in Laravel web routes
      // Return a mock/empty response
      console.warn('⚠️ Template analytics endpoint not available in Laravel web routes');

      return {
        template_id: id,
        template_name: '',
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch template analytics:', error);
      throw error;
    }
  }

  /**
   * Search templates by name or content
   */
  async searchTemplates(searchQuery: string, limit: number = 20): Promise<TemplatesListResponse> {
    return this.getTemplates({
      limit,
      skip: 0,
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: TemplateCategory, limit: number = 100): Promise<TemplatesListResponse> {
    return this.getTemplates({
      category,
      limit,
      skip: 0,
    });
  }

  /**
   * Get templates by status
   */
  async getTemplatesByStatus(status: TemplateStatus, limit: number = 100): Promise<TemplatesListResponse> {
    return this.getTemplates({
      status,
      limit,
      skip: 0,
    });
  }

  /**
   * Extract variables from template content
   * Variables are in the format {{1}}, {{2}}, etc.
   */
  extractVariables(content: string): string[] {
    const regex = /\{\{(\d+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables.sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Replace variables in template content with actual values
   */
  replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    
    return result;
  }

  /**
   * Preview template with variables replaced
   */
  async previewTemplate(id: number, variables: Record<string, string>): Promise<string> {
    try {
      const template = await this.getTemplate(id);
      
      // Find body component and replace variables
      const bodyComponent = template.components.find(c => c.type === 'BODY');
      if (!bodyComponent?.text) {
        throw new Error('Template has no body text');
      }
      
      return this.replaceVariables(bodyComponent.text, variables);
    } catch (error: any) {
      console.error('❌ Failed to preview template:', error);
      throw error;
    }
  }

  /**
   * Validate template components
   */
  validateTemplate(components: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if body component exists
    const bodyComponent = components.find(c => c.type === 'BODY');
    if (!bodyComponent) {
      errors.push('Template must have a BODY component');
    }
    
    // Validate component types
    const validTypes = ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'];
    components.forEach((component, index) => {
      if (!validTypes.includes(component.type)) {
        errors.push(`Invalid component type at index ${index}: ${component.type}`);
      }
    });
    
    // Validate buttons if present
    const buttonComponent = components.find(c => c.type === 'BUTTONS');
    if (buttonComponent?.buttons) {
      if (buttonComponent.buttons.length > 3) {
        errors.push('Maximum 3 buttons allowed');
      }
      
      buttonComponent.buttons.forEach((button: any, index: number) => {
        if (!button.text || button.text.length > 25) {
          errors.push(`Button ${index + 1} text must be 1-25 characters`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template status badge color
   */
  getStatusColor(status: TemplateStatus): string {
    switch (status) {
      case TemplateStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case TemplateStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TemplateStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case TemplateStatus.PAUSED:
        return 'bg-gray-100 text-gray-800';
      case TemplateStatus.DISABLED:
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get category badge color
   */
  getCategoryColor(category: TemplateCategory): string {
    switch (category) {
      case TemplateCategory.MARKETING:
        return 'bg-blue-100 text-blue-800';
      case TemplateCategory.UTILITY:
        return 'bg-purple-100 text-purple-800';
      case TemplateCategory.AUTHENTICATION:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Sync all templates with Meta API
   * Uses Laravel WEB route: POST /vendor-console/whatsapp/templates/sync
   */
  async syncAllTemplates(): Promise<any> {
    try {
      console.log('🔄 Syncing all templates with Meta API...');

      const response = await laravelClient.post<any>(
        API_CONFIG.WHATSAPP_EXTERNAL.APP.TEMPLATE_SYNC
      );

      console.log('✅ Templates synced:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to sync templates:', error);

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to sync templates';
      throw new Error(message);
    }
  }

  /**
   * Sync single template with Meta API
   * Note: Laravel web routes may not have per-template sync
   * Falls back to syncing all templates
   */
  async syncTemplate(id: number): Promise<any> {
    try {
      console.log('🔄 Syncing template:', id);

      // Laravel web routes don't have per-template sync
      // Sync all and return the matching template
      const result = await this.syncAllTemplates();

      return {
        template_id: id,
        updated: true,
        ...result
      };
    } catch (error: any) {
      console.error('❌ Failed to sync template:', error);

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to sync template';
      throw new Error(message);
    }
  }

  /**
   * Create template from library
   * Note: May not be available in Laravel web routes
   */
  async createFromLibrary(payload: {
    name: string;
    library_template_name: string;
    language: TemplateLanguage;
    category: TemplateCategory;
    button_inputs?: Record<string, string>[];
  }): Promise<Template> {
    try {
      console.log('➕ Creating template from library:', payload.name);

      // Use the standard create template endpoint
      const response = await laravelClient.post<Template>(
        API_CONFIG.WHATSAPP_EXTERNAL.APP.TEMPLATE_CREATE,
        payload
      );

      console.log('✅ Template created from library:', response.data.name);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create template from library:', error);

      if (error.response?.status === 409) {
        throw new Error('Template name already exists');
      }

      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to create template from library';
      throw new Error(message);
    }
  }

  // ==================== API ROUTES METHODS ====================
  // These methods use the Laravel API routes (api.php) instead of web routes
  // API Endpoints:
  //   GET /api/{vendorUid}/templates - Fetch all templates
  //   GET /api/{vendorUid}/templates/{templateUid} - Fetch single template

  /**
   * Get all templates using API routes
   * API Endpoint: GET /api/{vendorUid}/templates
   * @param query - Optional query parameters for filtering
   * @returns Promise with normalized templates response
   */
  async getTemplatesViaApi(query?: TemplatesListQuery): Promise<TemplatesListResponse> {
    try {
      console.log('📋 Fetching templates via API route:', query);

      const response = await externalWhatsappService.getTemplates({
        status: query?.status,
        category: query?.category,
        language: query?.language,
        limit: query?.limit,
        skip: query?.skip
      });

      // Normalize the API response to our standard format
      const normalized = this.normalizeApiResponse(response);

      console.log('✅ Templates fetched via API:', {
        total: normalized.total,
        count: normalized.items?.length || 0
      });

      return normalized;
    } catch (error: any) {
      console.error('❌ Failed to fetch templates via API:', error);
      throw error;
    }
  }

  /**
   * Get single template by UID using API routes
   * API Endpoint: GET /api/{vendorUid}/templates/{templateUid}
   * @param templateUid - The template UID to fetch
   * @returns Promise with template data
   */
  async getTemplateViaApi(templateUid: number | string): Promise<Template> {
    try {
      console.log('📋 Fetching template via API route:', templateUid);

      const response = await externalWhatsappService.getTemplate(templateUid);

      // Extract template from response (handles different response formats)
      const template = response.data || response.template || response;

      console.log('✅ Template fetched via API:', template.name);

      return template as Template;
    } catch (error: any) {
      console.error('❌ Failed to fetch template via API:', error);
      throw error;
    }
  }

  /**
   * Get template by name using API routes
   * @param name - Template name
   * @param language - Optional language code
   * @returns Promise with matching template
   */
  async getTemplateByNameViaApi(name: string, language?: string): Promise<Template> {
    try {
      console.log('📋 Fetching template by name via API:', { name, language });

      const template = await externalWhatsappService.getTemplateByName(name, language);

      console.log('✅ Template found via API:', template.name);

      return template as Template;
    } catch (error: any) {
      console.error('❌ Failed to fetch template by name via API:', error);
      throw error;
    }
  }

  /**
   * Get approved templates only using API routes
   * @returns Promise with approved templates
   */
  async getApprovedTemplatesViaApi(): Promise<TemplatesListResponse> {
    return this.getTemplatesViaApi({ status: TemplateStatus.APPROVED });
  }

  /**
   * Map Laravel API template to frontend Template format
   * Laravel API returns: { _uid, template_name, template_id, language, category, status, template_data: { components, ... } }
   * Frontend expects: { id, name, language, category, status, components, ... }
   */
  private mapLaravelTemplate(laravelTemplate: any): Template {
    return {
      id: laravelTemplate._uid || laravelTemplate.id,
      name: laravelTemplate.template_name || laravelTemplate.name,
      language: laravelTemplate.language,
      category: laravelTemplate.category,
      status: laravelTemplate.status,
      // Extract components from template_data if available
      components: laravelTemplate.template_data?.components || laravelTemplate.components || [],
      // Keep additional fields
      template_id: laravelTemplate.template_id,
      body: laravelTemplate.template_data?.components?.find((c: any) => c.type === 'BODY')?.text || '',
      usage_count: laravelTemplate.usage_count || 0,
      quality_score: laravelTemplate.quality_score,
      created_at: laravelTemplate.created_at,
      updated_at: laravelTemplate.updated_at,
    } as Template;
  }

  /**
   * Normalize API response to standard TemplatesListResponse format
   * Handles various response formats from the Laravel backend
   */
  private normalizeApiResponse(response: TemplatesApiResponse): TemplatesListResponse {
    let rawTemplates: any[] = [];

    // Handle { data: [] } format (Laravel standard)
    if (response?.data && Array.isArray(response.data)) {
      rawTemplates = response.data;
    }
    // Handle { templates: [] } format
    else if (response?.templates && Array.isArray(response.templates)) {
      rawTemplates = response.templates;
    }
    // Handle { items: [] } format
    else if (response?.items && Array.isArray(response.items)) {
      rawTemplates = response.items;
    }
    // Handle direct array response
    else if (Array.isArray(response)) {
      rawTemplates = response;
    }
    // Fallback - try to find any array in the response
    else {
      rawTemplates = (Object.values(response || {}).find((v) => Array.isArray(v)) as any[]) || [];
    }

    // Map each Laravel template to frontend format
    const mappedTemplates = rawTemplates.map(t => this.mapLaravelTemplate(t));

    return {
      items: mappedTemplates,
      total: response?.total || response?.recordsTotal || mappedTemplates.length,
      page: response?.current_page || 1,
      page_size: response?.per_page || mappedTemplates.length
    };
  }

  /**
   * Send template message using API routes
   * This uses the external API with vendor UID
   * @param payload - Template send payload
   * @returns Promise with send response
   */
  async sendTemplateViaApi(payload: {
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
    // Body parameters
    field_1?: string;
    field_2?: string;
    field_3?: string;
    field_4?: string;
    // Button parameters
    button_0?: string;
    button_1?: string;
    copy_code?: string;
  }): Promise<TemplateSendResponse> {
    try {
      console.log('📤 Sending template via API:', payload.template_name, 'to', payload.phone_number);

      const response = await externalWhatsappService.sendTemplateMessage({
        phone_number: payload.phone_number,
        template_name: payload.template_name,
        template_language: payload.template_language,
        header_image: payload.header_image,
        header_video: payload.header_video,
        header_document: payload.header_document,
        header_document_name: payload.header_document_name,
        header_field_1: payload.header_field_1,
        location_latitude: payload.location_latitude,
        location_longitude: payload.location_longitude,
        location_name: payload.location_name,
        location_address: payload.location_address,
        field_1: payload.field_1,
        field_2: payload.field_2,
        field_3: payload.field_3,
        field_4: payload.field_4,
        button_0: payload.button_0,
        button_1: payload.button_1,
        copy_code: payload.copy_code
      });

      console.log('✅ Template sent via API');

      return response;
    } catch (error: any) {
      console.error('❌ Failed to send template via API:', error);
      throw error;
    }
  }

  /**
   * Check if API routes are available (vendor UID is configured)
   * @returns boolean indicating if API routes can be used
   */
  isApiAvailable(): boolean {
    return !!getVendorUid();
  }

  /**
   * Get vendor UID for API calls
   * @returns vendor UID or null if not configured
   */
  getVendorUid(): string | null {
    return getVendorUid();
  }
}

export const templatesService = new TemplatesService();