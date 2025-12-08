// src/hooks/useOPDTemplate.ts
import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { opdTemplateService } from '@/services/opdTemplate.service';
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
} from '@/types/opdTemplate.types';
import { useAuth } from './useAuth';

export const useOPDTemplate = () => {
  const { hasModuleAccess } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has HMS access
  const hasHMSAccess = hasModuleAccess('hms');

  // ==================== TEMPLATE GROUPS HOOKS ====================

  const useTemplateGroups = (params?: TemplateGroupsQueryParams) => {
    const key = ['template-groups', params];

    return useSWR<TemplateGroupsResponse>(
      key,
      () => opdTemplateService.getTemplateGroups(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template groups:', err);
          setError(err.message || 'Failed to fetch template groups');
        },
      }
    );
  };

  const useTemplateGroup = (id: number | null) => {
    const key = id ? ['template-group', id] : null;

    return useSWR<TemplateGroup>(
      key,
      () => opdTemplateService.getTemplateGroup(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template group:', err);
          setError(err.message || 'Failed to fetch template group');
        },
      }
    );
  };

  const createTemplateGroup = useCallback(
    async (data: CreateTemplateGroupPayload): Promise<TemplateGroup> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.createTemplateGroup(data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create template group';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplateGroup = useCallback(
    async (id: number, data: UpdateTemplateGroupPayload): Promise<TemplateGroup> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.updateTemplateGroup(id, data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update template group';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplateGroup = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await opdTemplateService.deleteTemplateGroup(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template group';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== TEMPLATES HOOKS ====================

  const useTemplates = (params?: TemplatesQueryParams) => {
    const key = ['templates', params];

    return useSWR<TemplatesResponse>(
      key,
      () => opdTemplateService.getTemplates(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch templates:', err);
          setError(err.message || 'Failed to fetch templates');
        },
      }
    );
  };

  const useTemplate = (id: number | null) => {
    const key = id ? ['template', id] : null;

    return useSWR<Template>(key, () => opdTemplateService.getTemplate(id!), {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('Failed to fetch template:', err);
        setError(err.message || 'Failed to fetch template');
      },
    });
  };

  const createTemplate = useCallback(
    async (data: CreateTemplatePayload): Promise<Template> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.createTemplate(data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplate = useCallback(
    async (id: number, data: UpdateTemplatePayload): Promise<Template> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.updateTemplate(id, data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update template';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplate = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await opdTemplateService.deleteTemplate(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const duplicateTemplate = useCallback(async (id: number): Promise<Template> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await opdTemplateService.duplicateTemplate(id);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to duplicate template';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== TEMPLATE FIELDS HOOKS ====================

  const useTemplateFields = (params?: TemplateFieldsQueryParams) => {
    const key = ['template-fields', params];

    return useSWR<TemplateFieldsResponse>(
      key,
      () => opdTemplateService.getTemplateFields(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template fields:', err);
          setError(err.message || 'Failed to fetch template fields');
        },
      }
    );
  };

  const useTemplateField = (id: number | null) => {
    const key = id ? ['template-field', id] : null;

    return useSWR<TemplateField>(
      key,
      () => opdTemplateService.getTemplateField(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template field:', err);
          setError(err.message || 'Failed to fetch template field');
        },
      }
    );
  };

  const createTemplateField = useCallback(
    async (data: CreateTemplateFieldPayload): Promise<TemplateField> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.createTemplateField(data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create template field';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplateField = useCallback(
    async (id: number, data: UpdateTemplateFieldPayload): Promise<TemplateField> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.updateTemplateField(id, data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update template field';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplateField = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await opdTemplateService.deleteTemplateField(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template field';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== TEMPLATE FIELD OPTIONS HOOKS ====================

  const useTemplateFieldOptions = (params?: TemplateFieldOptionsQueryParams) => {
    const key = ['template-field-options', params];

    return useSWR<TemplateFieldOptionsResponse>(
      key,
      () => opdTemplateService.getTemplateFieldOptions(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template field options:', err);
          setError(err.message || 'Failed to fetch template field options');
        },
      }
    );
  };

  const useTemplateFieldOption = (id: number | null) => {
    const key = id ? ['template-field-option', id] : null;

    return useSWR<TemplateFieldOption>(
      key,
      () => opdTemplateService.getTemplateFieldOption(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template field option:', err);
          setError(err.message || 'Failed to fetch template field option');
        },
      }
    );
  };

  const createTemplateFieldOption = useCallback(
    async (data: CreateTemplateFieldOptionPayload): Promise<TemplateFieldOption> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.createTemplateFieldOption(data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create template field option';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplateFieldOption = useCallback(
    async (
      id: number,
      data: UpdateTemplateFieldOptionPayload
    ): Promise<TemplateFieldOption> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.updateTemplateFieldOption(id, data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update template field option';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplateFieldOption = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await opdTemplateService.deleteTemplateFieldOption(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template field option';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== TEMPLATE RESPONSES HOOKS ====================

  const useTemplateResponses = (params?: TemplateResponsesQueryParams) => {
    const key = ['template-responses', params];

    return useSWR<TemplateResponsesResponse>(
      key,
      () => opdTemplateService.getTemplateResponses(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template responses:', err);
          setError(err.message || 'Failed to fetch template responses');
        },
      }
    );
  };

  const useTemplateResponse = (id: number | null) => {
    const key = id ? ['template-response', id] : null;

    return useSWR<TemplateResponse>(
      key,
      () => opdTemplateService.getTemplateResponse(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template response:', err);
          setError(err.message || 'Failed to fetch template response');
        },
      }
    );
  };

  const createTemplateResponse = useCallback(
    async (data: CreateTemplateResponsePayload): Promise<TemplateResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.createTemplateResponse(data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create template response';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplateResponse = useCallback(
    async (id: number, data: UpdateTemplateResponsePayload): Promise<TemplateResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.updateTemplateResponse(id, data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update template response';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplateResponse = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await opdTemplateService.deleteTemplateResponse(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template response';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== TEMPLATE FIELD RESPONSES HOOKS ====================

  const useTemplateFieldResponses = (params?: TemplateFieldResponsesQueryParams) => {
    const key = ['template-field-responses', params];

    return useSWR<TemplateFieldResponsesResponse>(
      key,
      () => opdTemplateService.getTemplateFieldResponses(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template field responses:', err);
          setError(err.message || 'Failed to fetch template field responses');
        },
      }
    );
  };

  const useTemplateFieldResponse = (id: number | null) => {
    const key = id ? ['template-field-response', id] : null;

    return useSWR<TemplateFieldResponse>(
      key,
      () => opdTemplateService.getTemplateFieldResponse(id!),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        onError: (err) => {
          console.error('Failed to fetch template field response:', err);
          setError(err.message || 'Failed to fetch template field response');
        },
      }
    );
  };

  const createTemplateFieldResponse = useCallback(
    async (data: CreateTemplateFieldResponsePayload): Promise<TemplateFieldResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.createTemplateFieldResponse(data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to create template field response';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTemplateFieldResponse = useCallback(
    async (
      id: number,
      data: UpdateTemplateFieldResponsePayload
    ): Promise<TemplateFieldResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await opdTemplateService.updateTemplateFieldResponse(id, data);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to update template field response';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTemplateFieldResponse = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await opdTemplateService.deleteTemplateFieldResponse(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete template field response';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    hasHMSAccess,
    isLoading,
    error,
    // Template Groups
    useTemplateGroups,
    useTemplateGroup,
    createTemplateGroup,
    updateTemplateGroup,
    deleteTemplateGroup,
    // Templates
    useTemplates,
    useTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    // Template Fields
    useTemplateFields,
    useTemplateField,
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
    // Template Field Options
    useTemplateFieldOptions,
    useTemplateFieldOption,
    createTemplateFieldOption,
    updateTemplateFieldOption,
    deleteTemplateFieldOption,
    // Template Responses
    useTemplateResponses,
    useTemplateResponse,
    createTemplateResponse,
    updateTemplateResponse,
    deleteTemplateResponse,
    // Template Field Responses
    useTemplateFieldResponses,
    useTemplateFieldResponse,
    createTemplateFieldResponse,
    updateTemplateFieldResponse,
    deleteTemplateFieldResponse,
  };
};
