// src/components/consultation/ConsultationTab.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  Loader2,
  PlusCircle,
  Eye,
  Maximize2,
} from 'lucide-react';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useAuth } from '@/hooks/useAuth';
import {
  TemplateField,
  TemplateResponse,
  FieldResponsePayload,
  CreateTemplateResponsePayload,
} from '@/types/opdTemplate.types';
import ExcalidrawWrapper from './ExcalidrawWrapper';
import FullscreenA4Canvas from './FullscreenA4Canvas';
import { useCanvasState } from '@/hooks/useCanvasState';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types/types';

type CanvasData = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
};

const sanitizeCanvasData = (data: CanvasData | null): CanvasData | null => {
  if (!data) return null;

  const elements = Array.isArray(data.elements) ? [...data.elements] : [];
  const appState: Partial<AppState> = { ...(data.appState || {}) };

  // Remove/normalize non-serializable or incompatible fields
  if ((appState as any).collaborators && !((appState as any).collaborators instanceof Map)) {
    delete (appState as any).collaborators;
  }

  return { elements, appState };
};

interface ConsultationTabProps {
  visit: OpdVisit;
}

export const ConsultationTab: React.FC<ConsultationTabProps> = ({ visit }) => {
  const {
    useTemplates,
    useTemplate,
    useTemplateResponses,
    useTemplateResponse,
    createTemplateResponse,
    updateTemplateResponse,
  } = useOPDTemplate();

  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeResponse, setActiveResponse] = useState<TemplateResponse | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'canvas'>('fields');
  const [isSaving, setIsSaving] = useState(false);
  const [initialCanvasData, setInitialCanvasData] = useState<CanvasData | null | undefined>(undefined);
  const [isFullscreenCanvasOpen, setIsFullscreenCanvasOpen] = useState(false);
  const loadedResponseIdRef = useRef<number | null>(null);
  
  const { data: responsesData, isLoading: isLoadingResponses, mutate: mutateResponses } = useTemplateResponses({
    visit: visit.id,
    template: selectedTemplate ? parseInt(selectedTemplate) : undefined,
  });

  const templateResponses = useMemo(() => responsesData?.results || [], [responsesData]);

  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(
    selectedTemplate ? parseInt(selectedTemplate) : null
  );
  const fieldsData = useMemo(() => templateData?.fields || [], [templateData]);

  const { data: detailedActiveResponse } = useTemplateResponse(
    activeResponse?.id || null
  );

  // Canvas state management with custom hook
  const handleCanvasAutoSave = useCallback(async (canvasData: { elements: readonly ExcalidrawElement[]; appState: Partial<AppState> }) => {
    if (!activeResponse) return;

    const canvasField = fieldsData.find(f => f.field_type === 'json' || f.field_type === 'canvas');
    if (!canvasField) return;

    try {
      const payload = {
        field_responses: [
          {
            field: canvasField.id,
            full_canvas_json: sanitizeCanvasData(canvasData),
          }
        ],
      };

      await mutateResponses((current) => current, { revalidate: false });
      await updateTemplateResponse(activeResponse.id, payload);
      mutateResponses();
    } catch (error) {
      console.error('Canvas auto-save failed:', error);
      throw error;
    }
  }, [activeResponse, fieldsData, updateTemplateResponse, mutateResponses]);

  const canvasState = useCanvasState({
    onAutoSave: handleCanvasAutoSave,
    autoSaveDelay: 3000,
  });

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

      // Load canvas data if present
      const canvasFieldResponse = detailedActiveResponse.field_responses?.find(fr => {
        const field = fieldsData.find(f => f.id === fr.field);
        return field?.field_type === 'json' || field?.field_type === 'canvas';
      });

      // Only update canvas when switching to a different response
      // This prevents clearing during auto-save revalidations
      const isNewResponse = loadedResponseIdRef.current !== detailedActiveResponse.id;

      if (isNewResponse) {
        loadedResponseIdRef.current = detailedActiveResponse.id;

        // Check if we have valid canvas data
        const fullCanvasJson = canvasFieldResponse?.full_canvas_json;
        const hasCanvasData = fullCanvasJson &&
                             typeof fullCanvasJson === 'object' &&
                             fullCanvasJson.elements &&
                             Array.isArray(fullCanvasJson.elements) &&
                             fullCanvasJson.elements.length > 0;

        if (hasCanvasData) {
          const nextCanvasData = sanitizeCanvasData(fullCanvasJson);
          setInitialCanvasData(nextCanvasData);
          canvasState.loadData(nextCanvasData);
        } else {
          setInitialCanvasData(null);
          canvasState.loadData(null);
        }
      }

    toast.info(`Loaded response #${detailedActiveResponse.response_sequence} by Dr. ${detailedActiveResponse.filled_by_name}`);
  }, [detailedActiveResponse, fieldsData, isLoadingTemplate]);

  const [showNewResponseDialog, setShowNewResponseDialog] = useState(false);
  const [newResponseReason, setNewResponseReason] = useState('');
  const [isDefaultTemplateApplied, setIsDefaultTemplateApplied] = useState(false);

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({ is_active: true });

  // Effect to load default template from user preferences
  useEffect(() => {
    if (user?.preferences?.defaultOPDTemplate && templatesData?.results && !selectedTemplate && !isDefaultTemplateApplied) {
        const defaultTemplateId = String(user.preferences.defaultOPDTemplate);
        if (templatesData.results.some(t => String(t.id) === defaultTemplateId)) {
            setSelectedTemplate(defaultTemplateId);
            setIsDefaultTemplateApplied(true);
            toast.info('Default OPD template loaded.');
        }
    }
  }, [user, templatesData, selectedTemplate, isDefaultTemplateApplied]);

  const handleViewResponse = useCallback((response: TemplateResponse) => {
    setActiveResponse(response);
    // Reset canvas data to show loading state while fetching new response
    setInitialCanvasData(undefined);
    loadedResponseIdRef.current = null;
    // The useEffect for detailedActiveResponse will handle fetching and populating data
  }, []);

  const handleAddNewResponse = useCallback(async (isAutoCreation = false) => {
    if (!selectedTemplate || !visit?.id) return;

    if (!isAutoCreation && templateResponses.length > 0) {
        setShowNewResponseDialog(true);
        return;
    }

    setIsSaving(true);
    try {
      const payload: CreateTemplateResponsePayload = {
        visit: visit.id,
        template: parseInt(selectedTemplate),
        doctor_switched_reason: !isAutoCreation && newResponseReason ? newResponseReason : undefined,
      };
      const newResponse = await createTemplateResponse(payload);
      await mutateResponses();
      handleViewResponse(newResponse);
      toast.success('New consultation form ready.');
      setShowNewResponseDialog(false);
      setNewResponseReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create new response.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTemplate, visit?.id, newResponseReason, templateResponses, createTemplateResponse, mutateResponses, handleViewResponse]);

  useEffect(() => {
    if (!selectedTemplate || isLoadingResponses) return;

    if (templateResponses.length > 0) {
      if (!activeResponse || !templateResponses.find(r => r.id === activeResponse.id)) {
        const sortedResponses = [...templateResponses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        handleViewResponse(sortedResponses[0]);
      }
    } else {
      setActiveResponse(null);
      setFormData({});
      handleAddNewResponse(true);
    }
  }, [selectedTemplate, templateResponses, isLoadingResponses, activeResponse, handleAddNewResponse, handleViewResponse]);

  const handleFieldChange = useCallback((fieldId: number, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (canvasState.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved canvas changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [canvasState.hasUnsavedChanges]);

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

      await mutateResponses();

    } catch (error: any) {
      toast.error(error.message || 'Failed to save fields.');
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save canvas (with user feedback)
  const handleSaveCanvas = async () => {
    if (!activeResponse) {
      toast.error('No active response to save.');
      return;
    }

    setIsSaving(true);
    try {
      await canvasState.save();
      toast.success('Canvas saved successfully!');
      await mutateResponses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save canvas.');
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
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Select Template</CardTitle></CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
            <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
            <SelectContent>
              {isLoadingTemplates ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
               (templatesData?.results || []).map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Consultation Responses</CardTitle>
            {templateResponses.length > 0 &&
                <Dialog open={showNewResponseDialog} onOpenChange={setShowNewResponseDialog}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Response</DialogTitle><DialogDescription>Create a new response form for a handover or new consultation.</DialogDescription></DialogHeader>
                    <div className="space-y-2"><Label htmlFor="reason">Reason (optional)</Label><Input id="reason" value={newResponseReason} onChange={(e) => setNewResponseReason(e.target.value)} /></div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setShowNewResponseDialog(false)}>Cancel</Button>
                      <Button onClick={() => handleAddNewResponse(false)} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create</Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            }
          </CardHeader>
          <CardContent>
            {isLoadingResponses ? (
                <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : (
              <div className="space-y-2">
                {templateResponses.map(res => (
                  <div key={res.id} className={`flex items-center justify-between p-2 rounded-md border ${activeResponse?.id === res.id ? 'bg-muted border-primary' : 'border-transparent'}`}>
                    <div>
                      <p className="font-semibold">Response #{res.response_sequence} - Dr. {res.filled_by_name}</p>
                      <p className="text-sm text-muted-foreground">Status: {res.status}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewResponse(res)}><Eye className="mr-2 h-4 w-4" /> View</Button>
                  </div>
                ))}
                {templateResponses.length === 0 && !isLoadingResponses && (
                    <div className="text-center py-4 text-muted-foreground">
                        <p>No responses yet. The first response form has been created automatically.</p>
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeResponse && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Response #{activeResponse.response_sequence}</CardTitle>
              <CardDescription>Fill out the form fields and draw on the canvas</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenCanvasOpen(true)}
              className="flex items-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Open Canvas
            </Button>
          </CardHeader>
          <CardContent>
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

            {/* Canvas Tab Content - Keep mounted to preserve ref */}
            <div className={activeSubTab === 'canvas' ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {!canvasState.isReady && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Initializing canvas...
                      </span>
                    )}
                    {canvasState.isReady && canvasState.hasUnsavedChanges && (
                      <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
                        Auto-saving...
                      </span>
                    )}
                    {canvasState.isReady && !canvasState.hasUnsavedChanges && canvasState.canvasData && (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                        Saved
                      </span>
                    )}
                  </div>
                  <Button onClick={handleSaveCanvas} disabled={isSaving || !canvasState.isReady}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Now
                  </Button>
                </div>
                {activeResponse.canvas_data && (
                  <div className="space-y-2">
                    <Label>Last Saved Drawing</Label>
                    <div className="border rounded-md p-2 flex justify-center bg-muted">
                      <img src={activeResponse.canvas_data} alt="Saved Canvas Drawing" className="max-w-full h-auto rounded" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{activeResponse.canvas_data ? 'Draw a new sketch below' : 'Draw on the canvas below'}</Label>
                  {/* Only mount Excalidraw after initial data is set (or confirmed to be empty) */}
                  {initialCanvasData !== undefined ? (
                    <ExcalidrawWrapper
                      initialData={initialCanvasData}
                      onChange={canvasState.handleChange}
                      onReady={canvasState.handleReady}
                    />
                  ) : (
                    <div className="w-full h-96 md:h-[500px] border rounded-md flex items-center justify-center bg-muted">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading canvas...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen A4 Canvas Modal */}
      {activeResponse && (
        <FullscreenA4Canvas
          open={isFullscreenCanvasOpen}
          onOpenChange={setIsFullscreenCanvasOpen}
          onChange={canvasState.handleChange}
          onReady={canvasState.handleReady}
          onSave={handleSaveCanvas}
          initialData={initialCanvasData}
          hasUnsavedChanges={canvasState.hasUnsavedChanges}
          isReady={canvasState.isReady}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
