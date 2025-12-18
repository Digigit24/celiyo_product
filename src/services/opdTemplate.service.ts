// src/services/opdTemplate.service.ts
import { hmsClient } from '@/lib/client';
import { buildQueryString } from '@/lib/apiConfig';
import {
  TemplateGroup,
  TemplateGroupsResponse,
  TemplateGroupsQueryParams,
  CreateTemplateGroupPayload,
  UpdateTemplateGroupPayload,
  Template,
  TemplatesResponse,
  TemplatesQueryParams,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  TemplateField,
  TemplateFieldsResponse,
  TemplateFieldsQueryParams,
  CreateTemplateFieldPayload,
  UpdateTemplateFieldPayload,
  TemplateFieldOption,
  TemplateFieldOptionsResponse,
  TemplateFieldOptionsQueryParams,
  CreateTemplateFieldOptionPayload,
  UpdateTemplateFieldOptionPayload,
  TemplateResponse,
  TemplateResponsesResponse,
  TemplateResponsesQueryParams,
  CreateTemplateResponsePayload,
  UpdateTemplateResponsePayload,
  TemplateFieldResponse,
  TemplateFieldResponsesResponse,
  TemplateFieldResponsesQueryParams,
  CreateTemplateFieldResponsePayload,
  UpdateTemplateFieldResponsePayload,
  ResponseTemplate,
  ResponseTemplatesResponse,
  ResponseTemplatesQueryParams,
  CreateResponseTemplatePayload,
  UpdateResponseTemplatePayload,
} from '@/types/opdTemplate.types';

class OPDTemplateService {
  private baseURL = '/opd';

  // ==================== TEMPLATE GROUPS ====================

  async getTemplateGroups(params?: TemplateGroupsQueryParams): Promise<TemplateGroupsResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<TemplateGroupsResponse>(
        `${this.baseURL}/template-groups/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template groups';
      throw new Error(message);
    }
  }

  async getTemplateGroup(id: number): Promise<TemplateGroup> {
    try {
      const response = await hmsClient.get<TemplateGroup>(
        `${this.baseURL}/template-groups/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template group';
      throw new Error(message);
    }
  }

  async createTemplateGroup(data: CreateTemplateGroupPayload): Promise<TemplateGroup> {
    try {
      const response = await hmsClient.post<TemplateGroup>(
        `${this.baseURL}/template-groups/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template group';
      throw new Error(message);
    }
  }

  async updateTemplateGroup(id: number, data: UpdateTemplateGroupPayload): Promise<TemplateGroup> {
    try {
      const response = await hmsClient.patch<TemplateGroup>(
        `${this.baseURL}/template-groups/${id}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update template group';
      throw new Error(message);
    }
  }

  async deleteTemplateGroup(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/template-groups/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete template group';
      throw new Error(message);
    }
  }

  // ==================== TEMPLATES ====================

  async getTemplates(params?: TemplatesQueryParams): Promise<TemplatesResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<TemplatesResponse>(
        `${this.baseURL}/templates/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch templates';
      throw new Error(message);
    }
  }

  async getTemplate(id: number): Promise<Template> {
    try {
      const response = await hmsClient.get<Template>(
        `${this.baseURL}/templates/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template';
      throw new Error(message);
    }
  }

  async createTemplate(data: CreateTemplatePayload): Promise<Template> {
    try {
      const response = await hmsClient.post<Template>(
        `${this.baseURL}/templates/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template';
      throw new Error(message);
    }
  }

  async updateTemplate(id: number, data: UpdateTemplatePayload): Promise<Template> {
    try {
      const response = await hmsClient.patch<Template>(
        `${this.baseURL}/templates/${id}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update template';
      throw new Error(message);
    }
  }

  async deleteTemplate(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/templates/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete template';
      throw new Error(message);
    }
  }

  async duplicateTemplate(id: number): Promise<Template> {
    try {
      const response = await hmsClient.post<Template>(
        `${this.baseURL}/templates/${id}/duplicate/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to duplicate template';
      throw new Error(message);
    }
  }

  // ==================== TEMPLATE FIELDS ====================

  async getTemplateFields(params?: TemplateFieldsQueryParams): Promise<TemplateFieldsResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<TemplateFieldsResponse>(
        `${this.baseURL}/template-fields/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template fields';
      throw new Error(message);
    }
  }

  async getTemplateField(id: number): Promise<TemplateField> {
    try {
      const response = await hmsClient.get<TemplateField>(
        `${this.baseURL}/template-fields/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template field';
      throw new Error(message);
    }
  }

  async createTemplateField(data: CreateTemplateFieldPayload): Promise<TemplateField> {
    try {
      console.log('Service layer - Creating field with data:', data);
      const response = await hmsClient.post<TemplateField>(
        `${this.baseURL}/template-fields/`,
        data
      );
      console.log('Service layer - Field created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Service layer - Create field error:', error.response?.data);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template field';
      throw new Error(message);
    }
  }

  async updateTemplateField(id: number, data: UpdateTemplateFieldPayload): Promise<TemplateField> {
    try {
      const response = await hmsClient.patch<TemplateField>(
        `${this.baseURL}/template-fields/${id}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update template field';
      throw new Error(message);
    }
  }

  async deleteTemplateField(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/template-fields/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete template field';
      throw new Error(message);
    }
  }

  // ==================== TEMPLATE FIELD OPTIONS ====================

  async getTemplateFieldOptions(
    params?: TemplateFieldOptionsQueryParams
  ): Promise<TemplateFieldOptionsResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<TemplateFieldOptionsResponse>(
        `${this.baseURL}/template-field-options/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template field options';
      throw new Error(message);
    }
  }

  async getTemplateFieldOption(id: number): Promise<TemplateFieldOption> {
    try {
      const response = await hmsClient.get<TemplateFieldOption>(
        `${this.baseURL}/template-field-options/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template field option';
      throw new Error(message);
    }
  }

  async createTemplateFieldOption(
    data: CreateTemplateFieldOptionPayload
  ): Promise<TemplateFieldOption> {
    try {
      const response = await hmsClient.post<TemplateFieldOption>(
        `${this.baseURL}/template-field-options/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template field option';
      throw new Error(message);
    }
  }

  async updateTemplateFieldOption(
    id: number,
    data: UpdateTemplateFieldOptionPayload
  ): Promise<TemplateFieldOption> {
    try {
      const response = await hmsClient.patch<TemplateFieldOption>(
        `${this.baseURL}/template-field-options/${id}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update template field option';
      throw new Error(message);
    }
  }

  async deleteTemplateFieldOption(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/template-field-options/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete template field option';
      throw new Error(message);
    }
  }

  // ==================== TEMPLATE RESPONSES ====================

  async getTemplateResponses(
    params?: TemplateResponsesQueryParams
  ): Promise<TemplateResponsesResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<TemplateResponsesResponse>(
        `${this.baseURL}/template-responses/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template responses';
      throw new Error(message);
    }
  }

  async getTemplateResponse(id: number): Promise<TemplateResponse> {
    try {
      const response = await hmsClient.get<TemplateResponse>(
        `${this.baseURL}/template-responses/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template response';
      throw new Error(message);
    }
  }

  async createTemplateResponse(data: CreateTemplateResponsePayload): Promise<TemplateResponse> {
    try {
      const response = await hmsClient.post<TemplateResponse>(
        `${this.baseURL}/template-responses/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template response';
      throw new Error(message);
    }
  }

  async updateTemplateResponse(
    id: number,
    data: UpdateTemplateResponsePayload
  ): Promise<TemplateResponse> {
    try {
      console.log('[SERVICE DEBUG] updateTemplateResponse called');
      console.log('[SERVICE DEBUG] Response ID:', id);
      console.log('[SERVICE DEBUG] Payload:', JSON.stringify(data, null, 2));
      console.log('[SERVICE DEBUG] Payload field_responses:', data.field_responses);

      const response = await hmsClient.patch<TemplateResponse>(
        `${this.baseURL}/template-responses/${id}/`,
        data
      );

      console.log('[SERVICE DEBUG] API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[SERVICE DEBUG] Update failed:', error.response?.data);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update template response';
      throw new Error(message);
    }
  }

  async deleteTemplateResponse(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/template-responses/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete template response';
      throw new Error(message);
    }
  }

  async uploadCanvasForResponse(responseId: number, canvasFile: File): Promise<TemplateResponse> {
    const formData = new FormData();
    formData.append('canvas_data', canvasFile);

    try {
        const response = await hmsClient.patch<TemplateResponse>(
            `${this.baseURL}/template-responses/${responseId}/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to upload canvas image';
        throw new Error(message);
    }
  }
  
  // -- Actions for TemplateResponse --
  async markResponseAsReviewed(id: number): Promise<TemplateResponse> {
    try {
      const response = await hmsClient.post<TemplateResponse>(
        `${this.baseURL}/template-responses/${id}/mark_reviewed/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to mark response as reviewed';
      throw new Error(message);
    }
  }

  async convertToResponseTemplate(id: number, name: string, isPublic?: boolean): Promise<ResponseTemplate> {
    try {
      const response = await hmsClient.post<ResponseTemplate>(
        `${this.baseURL}/template-responses/${id}/convert_to_template/`,
        { name, is_public: isPublic }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to convert to reusable template';
      throw new Error(message);
    }
  }

  async applyResponseTemplate(responseId: number, templateId: number): Promise<TemplateResponse> {
    try {
      const response = await hmsClient.post<TemplateResponse>(
        `${this.baseURL}/template-responses/${responseId}/apply_template/`,
        { template_id: templateId }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to apply reusable template';
      throw new Error(message);
    }
  }

  // Visit-specific template response methods
  async getVisitTemplateResponses(visitId: number): Promise<TemplateResponse[]> {
    try {
      const response = await hmsClient.get<{ success: boolean; count: number; data: TemplateResponse[] }>(
        `${this.baseURL}/visits/${visitId}/template_responses/`
      );
      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch visit template responses';
      throw new Error(message);
    }
  }

  async createVisitTemplateResponse(
    visitId: number,
    data: CreateTemplateResponsePayload
  ): Promise<TemplateResponse> {
    try {
      const response = await hmsClient.post<TemplateResponse>(
        `${this.baseURL}/visits/${visitId}/template_responses/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template response';
      throw new Error(message);
    }
  }

  // ==================== TEMPLATE FIELD RESPONSES ====================

  async getTemplateFieldResponses(
    params?: TemplateFieldResponsesQueryParams
  ): Promise<TemplateFieldResponsesResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<TemplateFieldResponsesResponse>(
        `${this.baseURL}/template-field-responses/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template field responses';
      throw new Error(message);
    }
  }

  async getTemplateFieldResponse(id: number): Promise<TemplateFieldResponse> {
    try {
      const response = await hmsClient.get<TemplateFieldResponse>(
        `${this.baseURL}/template-field-responses/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch template field response';
      throw new Error(message);
    }
  }

  async createTemplateFieldResponse(
    data: CreateTemplateFieldResponsePayload
  ): Promise<TemplateFieldResponse> {
    try {
      const { response: templateResponseId, ...payload } = data;
      const response = await hmsClient.post<TemplateFieldResponse>(
        `${this.baseURL}/template-responses/${templateResponseId}/field-responses/`,
        payload
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create template field response';
      throw new Error(message);
    }
  }

  async updateTemplateFieldResponse(
    id: number,
    data: UpdateTemplateFieldResponsePayload
  ): Promise<TemplateFieldResponse> {
    try {
      const response = await hmsClient.patch<TemplateFieldResponse>(
        `${this.baseURL}/template-field-responses/${id}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update template field response';
      throw new Error(message);
    }
  }

  async deleteTemplateFieldResponse(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/template-field-responses/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete template field response';
      throw new Error(message);
    }
  }

  // ==================== RESPONSE TEMPLATES (for Copy-Paste) ====================

  async getResponseTemplates(params?: ResponseTemplatesQueryParams): Promise<ResponseTemplatesResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<ResponseTemplatesResponse>(
        `${this.baseURL}/response-templates/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch reusable templates';
      throw new Error(message);
    }
  }

  async getMyResponseTemplates(params?: ResponseTemplatesQueryParams): Promise<ResponseTemplatesResponse> {
    try {
      const queryString = buildQueryString(params);
      const response = await hmsClient.get<ResponseTemplatesResponse>(
        `${this.baseURL}/response-templates/my_templates/${queryString}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to fetch user's reusable templates";
      throw new Error(message);
    }
  }

  async getResponseTemplate(id: number): Promise<ResponseTemplate> {
    try {
      const response = await hmsClient.get<ResponseTemplate>(
        `${this.baseURL}/response-templates/${id}/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to fetch reusable template';
      throw new Error(message);
    }
  }

  async createResponseTemplate(data: CreateResponseTemplatePayload): Promise<ResponseTemplate> {
    try {
      const response = await hmsClient.post<ResponseTemplate>(
        `${this.baseURL}/response-templates/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to create reusable template';
      throw new Error(message);
    }
  }

  async updateResponseTemplate(id: number, data: UpdateResponseTemplatePayload): Promise<ResponseTemplate> {
    try {
      const response = await hmsClient.patch<ResponseTemplate>(
        `${this.baseURL}/response-templates/${id}/`,
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update reusable template';
      throw new Error(message);
    }
  }

  async deleteResponseTemplate(id: number): Promise<void> {
    try {
      await hmsClient.delete(`${this.baseURL}/response-templates/${id}/`);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to delete reusable template';
      throw new Error(message);
    }
  }

  async cloneResponseTemplate(id: number): Promise<ResponseTemplate> {
    try {
      const response = await hmsClient.post<ResponseTemplate>(
        `${this.baseURL}/response-templates/${id}/clone/`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to clone reusable template';
      throw new Error(message);
    }
  }
}

export const opdTemplateService = new OPDTemplateService();
