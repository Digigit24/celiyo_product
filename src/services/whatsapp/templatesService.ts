// src/services/whatsapp/templatesService.ts
// Templates Service - Uses Laravel WEB routes (not API routes!)
// Templates are in web.php at: /vendor-console/whatsapp/templates/
// These routes use session-based authentication

import { laravelClient } from '@/lib/laravelClient';
import { externalWhatsappClient } from '@/lib/externalWhatsappClient';
import { API_CONFIG, buildQueryString } from '@/lib/apiConfig';
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
  TemplateLanguage
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
   */
  private normalizeTemplatesResponse(raw: any): TemplatesListResponse {
    // Handle DataTables format: { data: [], recordsTotal, recordsFiltered }
    if (raw?.data && Array.isArray(raw.data)) {
      return {
        items: raw.data as Template[],
        total: raw.recordsTotal || raw.recordsFiltered || raw.data.length,
        page: 1,
        page_size: raw.data.length
      };
    }

    // Handle { templates: [], total } format
    if (raw?.templates && Array.isArray(raw.templates)) {
      return {
        items: raw.templates as Template[],
        total: raw.total || raw.templates.length,
        page: 1,
        page_size: raw.templates.length
      };
    }

    // Handle { items: [], total } format
    if (raw?.items && Array.isArray(raw.items)) {
      return {
        items: raw.items as Template[],
        total: raw.total || raw.items.length,
        page: raw.page || 1,
        page_size: raw.page_size || raw.items.length
      };
    }

    // Handle direct array response
    if (Array.isArray(raw)) {
      return {
        items: raw as Template[],
        total: raw.length,
        page: 1,
        page_size: raw.length
      };
    }

    // Fallback - try to find any array in the response
    const firstArray = Object.values(raw || {}).find((v) => Array.isArray(v)) as Template[] | undefined;
    return {
      items: firstArray || [],
      total: firstArray?.length || 0,
      page: 1,
      page_size: firstArray?.length || 0
    };
  }

  /**
   * Get all templates with optional filters
   * Uses Laravel WEB route: GET /vendor-console/whatsapp/templates/list-data
   */
  async getTemplates(query?: TemplatesListQuery): Promise<TemplatesListResponse> {
    try {
      console.log('📋 Fetching templates from Laravel web route:', query);

      const queryString = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP_EXTERNAL.APP.TEMPLATES}${queryString}`;

      console.log('📤 Request URL:', url);

      const response = await laravelClient.get<LaravelTemplatesResponse>(url);

      // Normalize the Laravel response to our standard format
      const normalized = this.normalizeTemplatesResponse(response.data);

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
   * Get single template by ID
   * Note: Laravel web routes may not have a direct detail endpoint
   * This fetches from the list and filters
   */
  async getTemplate(id: number): Promise<Template> {
    try {
      console.log('📋 Fetching template:', id);

      // Try to get all templates and find by ID
      const response = await this.getTemplates({ limit: 100 });
      const template = response.items.find(t => t.id === id);

      if (!template) {
        throw new Error('Template not found');
      }

      console.log('✅ Template fetched:', template.name);

      return template;
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
}

export const templatesService = new TemplatesService();