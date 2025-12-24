// src/components/consultation/ConsultationTab.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2, Save, Download, Printer, X, ArrowLeft, Maximize2, Pencil, Building2, Stethoscope, Microscope } from 'lucide-react';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useIPD } from '@/hooks/useIPD';
import { useTenant } from '@/hooks/useTenant';
import { useUsers } from '@/hooks/useUsers';
import {
  TemplateField,
  TemplateResponse,
  FieldResponsePayload,
} from '@/types/opdTemplate.types';
import { ConsultationBoard } from './ConsultationBoard';
import { DiagnosticRequisitionSidebar } from './DiagnosticRequisitionSidebar';
import { DiagnosticSummaryCard } from './DiagnosticSummaryCard';
import { FloatingActionPanel } from './FloatingActionPanel';

interface ConsultationTabProps {
  visit: OpdVisit;
}

export const ConsultationTab: React.FC<ConsultationTabProps> = ({ visit }) => {
  const navigate = useNavigate();
  const {
    useTemplates,
    useTemplate,
    useTemplateResponses,
    useTemplateResponse,
    updateTemplateResponse,
  } = useOPDTemplate();

  const { useAdmissions } = useIPD();

  const { useCurrentTenant } = useTenant();
  const { data: tenantData } = useCurrentTenant();
  const tenantSettings = tenantData?.settings || {};

  const [selectedResponse, setSelectedResponse] = useState<TemplateResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview' | 'canvas'>('fields');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [responseDrawerOpen, setResponseDrawerOpen] = useState(false);
  const [encounterType, setEncounterType] = useState<'visit' | 'admission'>('visit');
  const [requisitionSidebarOpen, setRequisitionSidebarOpen] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch active admission for the patient
  const { data: admissionsData } = useAdmissions({
    patient: visit.patient,
    status: 'admitted', // Only look for currently active admissions
  });
  const activeAdmission = admissionsData?.results?.[0] || null;

  // Determine object_id based on encounter type
  const currentObjectId = encounterType === 'visit' ? visit.id : activeAdmission?.id;

  // Fetch user for filled_by display
  const { useUser } = useUsers();
  const { data: filledByUser } = useUser(selectedResponse?.filled_by_id || null);

  // Construct full name from first_name and last_name
  const filledByName = filledByUser
    ? `${filledByUser.first_name} ${filledByUser.last_name}`.trim()
    : 'Unknown';

  // Fetch all templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({ is_active: true });
  const templates = useMemo(() => templatesData?.results || [], [templatesData]);

  // Fetch all responses for the current encounter context
  const { data: responsesData, isLoading: isLoadingResponses, mutate: mutateResponses } = useTemplateResponses(
    currentObjectId
      ? {
          encounter_type: encounterType,
          object_id: currentObjectId,
        }
      : undefined
  );
  const responses = useMemo(() => responsesData?.results || [], [responsesData]);

  // Fetch detailed response when one is selected
  const { data: detailedResponse } = useTemplateResponse(selectedResponse?.id || null);

  // Fetch template fields for selected response
  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(
    selectedResponse?.template || null
  );
  const fieldsData = useMemo(() => templateData?.fields || [], [templateData]);

  // Populate form data when response is loaded
  useEffect(() => {
    if (!detailedResponse || fieldsData.length === 0 || isLoadingTemplate) {
      return;
    }

    const populatedData: Record<string, any> = {};
    detailedResponse.field_responses?.forEach((fieldResp) => {
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
  }, [detailedResponse, fieldsData, isLoadingTemplate]);

  const handleViewResponse = useCallback((response: TemplateResponse) => {
    setSelectedResponse(response);
    setResponseDrawerOpen(true);
    setActiveSubTab('fields');
  }, []);

  const handleCloseResponseDrawer = useCallback(() => {
    setResponseDrawerOpen(false);
    setSelectedResponse(null);
    setFormData({});
  }, []);

  const handleFieldChange = useCallback((fieldId: number, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = async () => {
    if (!selectedResponse) {
      toast.error('No active response to save.');
      return;
    }

    setIsSaving(true);
    try {
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

      await updateTemplateResponse(selectedResponse.id, { field_responses });
      toast.success('Form fields saved successfully!');
      await mutateResponses();
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
              rows={4}
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
    <div className="h-full flex flex-col relative">
      {/* Sticky Header - Encounter Type Toggle */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3 bg-muted/30 px-3 py-2 rounded-lg border">
            <div className={`flex items-center gap-2 text-sm font-medium ${encounterType === 'visit' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">OPD</span>
            </div>
            <Switch
              checked={encounterType === 'admission'}
              onCheckedChange={(checked) => setEncounterType(checked ? 'admission' : 'visit')}
              disabled={!activeAdmission}
            />
            <div className={`flex items-center gap-2 text-sm font-medium ${encounterType === 'admission' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">IPD</span>
            </div>
          </div>

          {encounterType === 'admission' && activeAdmission && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
              <Building2 className="h-3 w-3" />
              <span>Admission: {activeAdmission.admission_id}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Kanban Board View */}
        <ConsultationBoard
          encounterType={encounterType}
          objectId={currentObjectId}
          visit={visit}
          responses={responses}
          templates={templates}
          isLoadingResponses={isLoadingResponses}
          isLoadingTemplates={isLoadingTemplates}
          onViewResponse={handleViewResponse}
          onRefresh={mutateResponses}
          templateDrawerOpen={templateDrawerOpen}
          onTemplateDrawerChange={setTemplateDrawerOpen}
        />
      </div>

      {/* Response Detail Side Drawer */}
      <Sheet open={responseDrawerOpen} onOpenChange={(open) => !open && handleCloseResponseDrawer()}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <SheetTitle className="text-lg sm:text-xl">
              {templateData?.name || 'Clinical Note'}
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">
              #{selectedResponse?.response_sequence} • {selectedResponse?.status} • Filled by: {filledByName}
            </SheetDescription>
          </SheetHeader>

          {/* Compact Tab Navigation */}
          <div className="border-b px-4 sm:px-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveSubTab('fields')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
                  activeSubTab === 'fields'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Form Fields
              </button>
              <button
                onClick={() => setActiveSubTab('canvas')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
                  activeSubTab === 'canvas'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Canvas
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
            {/* Fields Tab */}
            {activeSubTab === 'fields' && (
              <div className="space-y-4">
                <div className="flex justify-end sticky top-0 bg-background z-10 pb-2">
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {fieldsData.map(renderField)}
                </div>
              </div>
            )}

            {/* Canvas Tab */}
            {activeSubTab === 'canvas' && selectedResponse && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 p-4 sm:p-8">
                  <div className="flex justify-center">
                    <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
                      <Pencil className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold">Digital Canvas</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                      Open full-screen canvas for drawing and annotations
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/opd/consultation/${visit.id}/canvas/${selectedResponse.id}`)}
                    className="mt-4"
                    size="sm"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Open Canvas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Action Panel */}
      <FloatingActionPanel
        onAddNotes={() => {
          if (!currentObjectId) {
            toast.error('No active encounter found for adding notes.');
            return;
          }
          setTemplateDrawerOpen(true);
        }}
        onOpenDiagnostics={() => {
          if (!currentObjectId) {
            toast.error('No active encounter found for ordering tests.');
            return;
          }
          setRequisitionSidebarOpen(true);
        }}
        disabled={!currentObjectId}
      />

      {/* Diagnostic Requisition Sidebar */}
      {currentObjectId && (
        <DiagnosticRequisitionSidebar
          open={requisitionSidebarOpen}
          onOpenChange={setRequisitionSidebarOpen}
          patientId={visit.patient}
          encounterType={encounterType}
          objectId={currentObjectId}
        />
      )}
    </div>
  );
};
