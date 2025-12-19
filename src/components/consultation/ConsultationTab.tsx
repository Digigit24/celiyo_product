// src/components/consultation/ConsultationTab.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  Loader2,
  Maximize2,
  Pencil,
  Eye,
} from 'lucide-react';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import {
  TemplateField,
  TemplateResponse,
  FieldResponsePayload,
} from '@/types/opdTemplate.types';

interface ConsultationTabProps {
  visit: OpdVisit;
  selectedTemplate: string | null;
  activeResponse: TemplateResponse | null;
  onResponseUpdate: () => void;
}

export const ConsultationTab: React.FC<ConsultationTabProps> = ({
  visit,
  selectedTemplate,
  activeResponse,
  onResponseUpdate
}) => {
  const navigate = useNavigate();
  const {
    useTemplate,
    useTemplateResponse,
    updateTemplateResponse,
  } = useOPDTemplate();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview' | 'canvas'>('fields');
  const [isSaving, setIsSaving] = useState(false);

  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(
    selectedTemplate ? parseInt(selectedTemplate) : null
  );
  const fieldsData = useMemo(() => templateData?.fields || [], [templateData]);

  const { data: detailedActiveResponse } = useTemplateResponse(
    activeResponse?.id || null
  );

  useEffect(() => {
    if (!detailedActiveResponse || fieldsData.length === 0 || isLoadingTemplate) {
      return;
    }

    const populatedData: Record<string, any> = {};
      detailedActiveResponse.field_responses?.forEach((fieldResp) => {
        const field = fieldsData.find(f => f.id === fieldResp.field);
        if (!field) return;

        const fieldId = String(fieldResp.field);

        if (field.field_type === 'multiselect' || (field.field_type === 'checkbox' && field.options?.length)) {
            populatedData[fieldId] = fieldResp.selected_options || [];
        } else if (field.field_type === 'select' || field.field_type === 'radio') {
            populatedData[fieldId] = fieldResp.selected_options?.[0] || null;
        } else if (fieldResp.value_text !== null) {
          populatedData[fieldId] = fieldResp.value_text;
        } else if (fieldResp.value_number !== null) {
          populatedData[fieldId] = fieldResp.value_number;
        } else if (fieldResp.value_date !== null) {
          populatedData[fieldId] = fieldResp.value_date;
        } else if (fieldResp.value_datetime !== null) {
          populatedData[fieldId] = fieldResp.value_datetime;
        } else if (fieldResp.value_boolean !== null) {
          populatedData[fieldId] = fieldResp.value_boolean;
        }
      });
      setFormData(populatedData);

    toast.info(`Loaded response #${detailedActiveResponse.response_sequence} by Dr. ${detailedActiveResponse.filled_by_name}`);
  }, [detailedActiveResponse, fieldsData, isLoadingTemplate]);

  const handleFieldChange = useCallback((fieldId: number, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = async () => {
    if (!activeResponse) {
      toast.error('No active response to save.');
      return;
    }

    setIsSaving(true);
    try {
      // Filter out canvas/json fields - they're saved separately
      const nonCanvasFields = fieldsData.filter(f => f.field_type !== 'json' && f.field_type !== 'canvas');

      const field_responses: FieldResponsePayload[] = nonCanvasFields.map((field) => {
        const fieldValue = formData[String(field.id)];
        const response: FieldResponsePayload = { field: field.id };

        switch (field.field_type) {
            case 'text': case 'textarea': response.value_text = fieldValue || null; break;
            case 'number': response.value_number = fieldValue ? Number(fieldValue) : null; break;
            case 'date': response.value_date = fieldValue || null; break;
            case 'datetime': response.value_datetime = fieldValue || null; break;
            case 'boolean': response.value_boolean = Boolean(fieldValue); break;
            case 'checkbox':
                if (field.options?.length) response.selected_options = Array.isArray(fieldValue) ? fieldValue.map(Number) : [];
                else response.value_boolean = Boolean(fieldValue);
                break;
            case 'select': case 'radio':
                response.selected_options = fieldValue ? [Number(fieldValue)] : [];
                break;
            case 'multiselect':
                response.selected_options = Array.isArray(fieldValue) ? fieldValue.map(Number) : [];
                break;
            default: response.value_text = fieldValue ? String(fieldValue) : null;
        }
        return response;
      });

      const payload = {
          field_responses,
      };

      await updateTemplateResponse(activeResponse.id, payload);
      toast.success('Form fields saved successfully!');

      onResponseUpdate();

    } catch (error: any) {
      toast.error(error.message || 'Failed to save fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const getGridColumns = (optionCount: number): string => {
    if (optionCount <= 2) return 'grid-cols-1';
    if (optionCount <= 4) return 'grid-cols-2';
    if (optionCount <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const renderField = (field: TemplateField) => {
    const fieldId = String(field.id);
    const value = formData[fieldId];

    const handleChange = (newValue: any) => {
      handleFieldChange(field.id, newValue);
    };

    // Skip rendering canvas and json fields in the form - they're rendered separately
    if (field.field_type === 'json' || field.field_type === 'canvas') {
      return null;
    }

    switch (field.field_type) {
      case 'text':
      case 'number':
      case 'decimal':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>{field.field_label}</Label>
            <Input
              id={fieldId}
              type={field.field_type === 'text' ? 'text' : 'number'}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>{field.field_label}</Label>
            <Textarea
              id={fieldId}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
          </div>
        );
      case 'boolean':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={!!value}
              onCheckedChange={handleChange}
            />
            <Label htmlFor={fieldId}>{field.field_label}</Label>
          </div>
        );
      case 'date':
      case 'datetime':
      case 'time':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId}>{field.field_label}</Label>
            <Input
              id={fieldId}
              type={field.field_type}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
          </div>
        );
      case 'select':
      case 'radio':
        if (!field.options) return null;
        if (field.field_type === 'radio') {
          return (
            <div key={field.id} className="space-y-2">
              <Label>{field.field_label}</Label>
              <RadioGroup
                value={String(value)}
                onValueChange={(val) => handleChange(Number(val))}
              >
                <div className={`grid ${getGridColumns(field.options.length)} gap-4`}>
                  {field.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(option.id)} id={`${fieldId}-${option.id}`} />
                      <Label htmlFor={`${fieldId}-${option.id}`}>{option.option_label}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            </div>
          );
        }
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.field_label}</Label>
            <Select
              value={String(value)}
              onValueChange={(val) => handleChange(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
          </div>
        );
      case 'multiselect':
      case 'checkbox':
        if (!field.options) return null;
        const selectedValues = new Set(Array.isArray(value) ? value : []);
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.field_label}</Label>
            <div className={`grid ${getGridColumns(field.options.length)} gap-4`}>
              {field.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}-${option.id}`}
                    checked={selectedValues.has(option.id)}
                    onCheckedChange={(checked) => {
                      const newValues = new Set(selectedValues);
                      if (checked) {
                        newValues.add(option.id);
                      } else {
                        newValues.delete(option.id);
                      }
                      handleChange(Array.from(newValues));
                    }}
                  />
                  <Label htmlFor={`${fieldId}-${option.id}`}>{option.option_label}</Label>
                </div>
              ))}
            </div>
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  if (!selectedTemplate) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Please select a template to begin consultation</p>
      </div>
    );
  }

  if (!activeResponse) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading consultation form...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Response #{activeResponse.response_sequence}</CardTitle>
        <CardDescription>Fill out the form fields and draw on the canvas</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Custom Tab Navigation */}
        <div className="border-b mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('fields')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeSubTab === 'fields'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Form Fields
            </button>
            <button
              onClick={() => setActiveSubTab('preview')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeSubTab === 'preview'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Preview Mode
            </button>
            <button
              onClick={() => setActiveSubTab('canvas')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeSubTab === 'canvas'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Canvas Drawing
            </button>
          </div>
        </div>

        {/* Fields Tab Content */}
        <div className={activeSubTab === 'fields' ? 'block' : 'hidden'}>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Fields
              </Button>
            </div>
            {isLoadingTemplate ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{fieldsData.map(renderField)}</div>
            )}
          </div>
        </div>

        {/* Preview Mode Tab Content */}
        <div className={activeSubTab === 'preview' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Template Preview</h3>
              </div>
            </div>

            {isLoadingTemplate ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg p-6 border-2 border-slate-200 dark:border-slate-700">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 space-y-6">
                  {fieldsData.filter(f => f.field_type !== 'json' && f.field_type !== 'canvas').map((field) => {
                    const fieldId = String(field.id);
                    const value = formData[fieldId];

                    // Get display value
                    let displayValue: string = '';

                    if (field.field_type === 'select' || field.field_type === 'radio') {
                      const selectedOption = field.options?.find(opt => opt.id === value);
                      displayValue = selectedOption?.option_label || '-';
                    } else if (field.field_type === 'multiselect' || field.field_type === 'checkbox') {
                      if (Array.isArray(value) && value.length > 0) {
                        const selectedLabels = field.options
                          ?.filter(opt => value.includes(opt.id))
                          .map(opt => opt.option_label) || [];
                        displayValue = selectedLabels.join(', ') || '-';
                      } else {
                        displayValue = '-';
                      }
                    } else if (field.field_type === 'boolean') {
                      displayValue = value ? 'Yes' : 'No';
                    } else {
                      displayValue = value || '-';
                    }

                    return (
                      <div key={field.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                              {field.field_label}
                              {field.is_required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <div className="text-base text-slate-900 dark:text-slate-100 mt-2">
                              {displayValue}
                            </div>
                            {field.help_text && (
                              <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {fieldsData.filter(f => f.field_type !== 'json' && f.field_type !== 'canvas').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No fields to preview</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Tab Content - Open Canvas Button */}
        <div className={activeSubTab === 'canvas' ? 'block' : 'hidden'}>
          <div className="space-y-4">
            <div className="w-full h-96 md:h-[500px] border rounded-md flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="text-center space-y-4 p-8">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-full shadow-md">
                    <Pencil className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800">Digital Canvas</h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    Open the full-screen canvas to draw, annotate, and create handwritten notes for this consultation.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/opd/consultation/${visit.id}/canvas/${activeResponse.id}`)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  size="lg"
                >
                  <Maximize2 className="mr-2 h-5 w-5" />
                  Open Canvas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
