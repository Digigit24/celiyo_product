// src/services/whatsapp/templatesService.ts
import { whatsappClient } from '@/lib/whatsappClient';
import { API_CONFIG, buildUrl, buildQueryString } from '@/lib/apiConfig';
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

class TemplatesService {
  /**
   * Get all templates with optional filters
   */
  async getTemplates(query?: TemplatesListQuery): Promise<TemplatesListResponse> {
    try {
      console.log('📋 Fetching templates:', query);
      
      const queryString = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP.TEMPLATES}${queryString}`;
      
      const response = await whatsappClient.get<TemplatesListResponse>(url);
      
      console.log('✅ Templates fetched:', {
        total: response.data.total,
        count: response.data.items.length
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch templates:', error);
      const message = error.response?.data?.detail || 'Failed to fetch templates';
      throw new Error(message);
    }
  }

  /**
   * Get single template by ID
   */
  async getTemplate(id: number): Promise<Template> {
    try {
      console.log('📋 Fetching template:', id);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.TEMPLATE_DETAIL,
        { id },
        'whatsapp'
      );
      
      const response = await whatsappClient.get<Template>(url);
      
      console.log('✅ Template fetched:', response.data.name);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch template:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to fetch template';
      throw new Error(message);
    }
  }

  /**
   * Get template by name and language
   */
  async getTemplateByName(name: string, language: string): Promise<Template> {
    try {
      console.log('📋 Fetching template by name:', { name, language });
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.TEMPLATE_BY_NAME,
        { template_name: name },
        'whatsapp'
      );
      const qs = buildQueryString({ language });
      const response = await whatsappClient.get<Template>(`${url}${qs}`);
      
      console.log('✅ Template fetched by name:', response.data.name);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch template by name:', error);
      
      if (error.response?.status === 404) {
        throw new Error(`Template '${name}' not found for language ${language}`);
      }
      
      const message = error.response?.data?.detail || 'Failed to fetch template';
      throw new Error(message);
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(payload: CreateTemplatePayload): Promise<Template> {
    try {
      console.log('➕ Creating template:', payload.name);
      
      const response = await whatsappClient.post<Template>(
        API_CONFIG.WHATSAPP.TEMPLATE_CREATE,
        payload
      );
      
      console.log('✅ Template created:', response.data.name);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create template:', error);
      
      if (error.response?.status === 409) {
        throw new Error('Template name already exists');
      }
      
      const message = error.response?.data?.detail || 'Failed to create template';
      throw new Error(message);
    }
  }

  /**
   * Create template from library
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
      
      const response = await whatsappClient.post<Template>(
        '/templates/library',
        payload
      );
      
      console.log('✅ Template created from library:', response.data.name);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create template from library:', error);
      
      const message = error.response?.data?.detail || 'Failed to create template from library';
      throw new Error(message);
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: number, payload: UpdateTemplatePayload): Promise<Template> {
    try {
      console.log('✏️ Updating template:', id);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.TEMPLATE_UPDATE,
        { id },
        'whatsapp'
      );
      
      const response = await whatsappClient.patch<Template>(url, payload);
      
      console.log('✅ Template updated:', response.data.name);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update template:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to update template';
      throw new Error(message);
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: number): Promise<DeleteTemplateResponse> {
    try {
      console.log('🗑️ Deleting template:', id);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.TEMPLATE_DELETE,
        { id },
        'whatsapp'
      );
      
      const response = await whatsappClient.delete<DeleteTemplateResponse>(url);
      
      console.log('✅ Template deleted:', id);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to delete template:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Template not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to delete template';
      throw new Error(message);
    }
  }

  /**
   * Send template message
   */
  async sendTemplate(payload: TemplateSendRequest): Promise<TemplateSendResponse> {
    try {
      console.log('📤 Sending template:', payload.template_name, 'to', payload.to);
      
      const response = await whatsappClient.post<TemplateSendResponse>(
        '/templates/send',
        payload
      );
      
      console.log('✅ Template sent:', response.data.message_id);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send template:', error);
      
      const message = error.response?.data?.detail || 'Failed to send template';
      throw new Error(message);
    }
  }

  /**
   * Send template to multiple recipients
   */
  async sendTemplateBulk(payload: TemplateBulkSendRequest): Promise<TemplateBulkSendResponse> {
    try {
      console.log('📤 Sending template bulk:', payload.template_name, 'to', payload.recipients.length, 'recipients');
      
      const response = await whatsappClient.post<TemplateBulkSendResponse>(
        '/templates/send/bulk',
        payload
      );
      
      console.log('✅ Template bulk sent:', response.data.sent, 'successful,', response.data.failed, 'failed');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send template bulk:', error);
      
      const message = error.response?.data?.detail || 'Failed to send template bulk';
      throw new Error(message);
    }
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(id: number): Promise<TemplateAnalytics> {
    try {
      console.log('📊 Fetching template analytics:', id);
      
      const response = await whatsappClient.get<TemplateAnalytics>(
        `/templates/${id}/analytics`
      );
      
      console.log('✅ Template analytics fetched:', response.data.template_name);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch template analytics:', error);
      
      const message = error.response?.data?.detail || 'Failed to fetch template analytics';
      throw new Error(message);
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
   */
  async syncAllTemplates(): Promise<any> {
    try {
      console.log('🔄 Syncing all templates with Meta API...');

      const response = await whatsappClient.post<any>(
        API_CONFIG.WHATSAPP.TEMPLATE_SYNC_ALL
      );

      console.log('✅ Templates synced:', {
        total: response.data.total_templates,
        updated: response.data.updated,
        unchanged: response.data.unchanged,
        failed: response.data.failed,
        skipped: response.data.skipped
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to sync templates:', error);

      const message = error.response?.data?.detail || 'Failed to sync templates';
      throw new Error(message);
    }
  }

  /**
   * Sync single template with Meta API
   */
  async syncTemplate(id: number): Promise<any> {
    try {
      console.log('🔄 Syncing template:', id);

      const url = buildUrl(
        API_CONFIG.WHATSAPP.TEMPLATE_SYNC,
        { id },
        'whatsapp'
      );

      const response = await whatsappClient.post<any>(url);

      console.log('✅ Template synced:', {
        template_id: response.data.template_id,
        template_name: response.data.template_name,
        updated: response.data.updated,
        old_status: response.data.old_status,
        new_status: response.data.new_status
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to sync template:', error);

      const message = error.response?.data?.detail || 'Failed to sync template';
      throw new Error(message);
    }
  }

  /**
   * Create template from library
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

      const response = await whatsappClient.post<Template>(
        API_CONFIG.WHATSAPP.TEMPLATE_LIBRARY_CREATE,
        payload
      );

      console.log('✅ Template created from library:', response.data.name);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create template from library:', error);

      if (error.response?.status === 409) {
        throw new Error('Template name already exists');
      }

      const message = error.response?.data?.detail || 'Failed to create template from library';
      throw new Error(message);
    }
  }
}

export const templatesService = new TemplatesService();