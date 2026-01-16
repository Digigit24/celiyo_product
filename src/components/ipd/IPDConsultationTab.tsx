// src/components/ipd/IPDConsultationTab.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Download, Printer, Building2, Stethoscope } from 'lucide-react';
import { Admission } from '@/types/ipd.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useTenant } from '@/hooks/useTenant';
import { useUsers } from '@/hooks/useUsers';
import {
  TemplateField,
  TemplateResponse,
  FieldResponsePayload,
} from '@/types/opdTemplate.types';
import { ConsultationBoard } from '../consultation/ConsultationBoard';
import { DiagnosticRequisitionSidebar } from '../consultation/DiagnosticRequisitionSidebar';
import { FloatingActionPanel } from '../consultation/FloatingActionPanel';
import { SideDrawer } from '@/components/SideDrawer';

interface IPDConsultationTabProps {
  admission: Admission;
}

export const IPDConsultationTab: React.FC<IPDConsultationTabProps> = ({ admission }) => {
  const {
    useTemplates,
    useTemplate,
    useTemplateResponses,
    useTemplateResponse,
    updateTemplateResponse,
  } = useOPDTemplate();

  const { useCurrentTenant } = useTenant();
  const { data: tenantData } = useCurrentTenant();
  const tenantSettings = tenantData?.settings || {};

  const [selectedResponse, setSelectedResponse] = useState<TemplateResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview'>('fields');
  const [isSaving, setIsSaving] = useState(false);
  const [responseDrawerOpen, setResponseDrawerOpen] = useState(false);
  const [requisitionSidebarOpen, setRequisitionSidebarOpen] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Encounter type is always 'admission' for IPD
  const encounterType = 'admission';
  const currentObjectId = admission.id;

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
  const { data: selectedTemplateData } = useTemplate(detailedResponse?.template || null);
  const templateFields = useMemo(
    () => selectedTemplateData?.fields || [],
    [selectedTemplateData]
  );

  // Initialize form data when a response is selected
  useEffect(() => {
    if (detailedResponse?.field_responses) {
      const initialData: Record<string, any> = {};
      detailedResponse.field_responses.forEach((fr) => {
        const fieldId = fr.field.toString();
        initialData[fieldId] = fr.response_value || '';
      });
      setFormData(initialData);
    }
  }, [detailedResponse]);

  // Handle field value change
  const handleFieldChange = useCallback((fieldId: number, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId.toString()]: value,
    }));
  }, []);

  // Handle save response
  const handleSaveResponse = useCallback(async () => {
    if (!selectedResponse) {
      toast.error('No response selected');
      return;
    }

    setIsSaving(true);
    try {
      const fieldResponses: FieldResponsePayload[] = templateFields.map((field) => ({
        field: field.id,
        response_value: formData[field.id.toString()] || '',
      }));

      await updateTemplateResponse(selectedResponse.id, {
        field_responses: fieldResponses,
      });

      toast.success('Response saved successfully');
      mutateResponses();
    } catch (error: any) {
      console.error('Failed to save response:', error);
      toast.error(error.message || 'Failed to save response');
    } finally {
      setIsSaving(false);
    }
  }, [selectedResponse, templateFields, formData, updateTemplateResponse, mutateResponses]);

  // Handle print
  const handlePrint = useCallback(() => {
    if (previewRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Consultation - ${admission.admission_id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
                .field { margin-bottom: 15px; }
                .field-label { font-weight: bold; margin-bottom: 5px; }
                .field-value { margin-left: 10px; }
              </style>
            </head>
            <body>
              ${previewRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [admission.admission_id]);

  // Render field based on type
  const renderField = (field: TemplateField) => {
    const fieldValue = formData[field.id.toString()] || '';

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'url':
      case 'number':
        return (
          <Input
            type={field.field_type}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            required={field.is_required}
          />
        );

      case 'select':
      case 'dropdown':
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={fieldValue === 'true' || fieldValue === true}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked.toString())}
              id={field.id.toString()}
            />
            <Label htmlFor={field.id.toString()}>{field.label}</Label>
          </div>
        );

      case 'toggle':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={fieldValue === 'true' || fieldValue === true}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked.toString())}
              id={field.id.toString()}
            />
            <Label htmlFor={field.id.toString()}>{field.label}</Label>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.is_required}
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ConsultationBoard
        templates={templates}
        responses={responses}
        selectedResponse={selectedResponse}
        onSelectResponse={setSelectedResponse}
        onCreateResponse={mutateResponses}
        encounterType={encounterType}
        objectId={currentObjectId}
        isLoadingTemplates={isLoadingTemplates}
        isLoadingResponses={isLoadingResponses}
        onOpenRequisitionSidebar={() => setRequisitionSidebarOpen(true)}
      />

      {selectedResponse && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{selectedTemplateData?.name || 'Consultation'}</h2>
                <p className="text-sm text-muted-foreground">
                  Admission: {admission.admission_id} • Patient: {admission.patient_name}
                </p>
                {filledByUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Filled by: {filledByName}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveSubTab(activeSubTab === 'fields' ? 'preview' : 'fields')}
                >
                  {activeSubTab === 'fields' ? 'Preview' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button size="sm" onClick={handleSaveResponse} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            {activeSubTab === 'fields' ? (
              <div className="space-y-6">
                {templateFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id.toString()}>
                      {field.label}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                    {renderField(field)}
                  </div>
                ))}
              </div>
            ) : (
              <div ref={previewRef} className="prose max-w-none">
                <h1>Consultation - {admission.admission_id}</h1>
                <p>
                  <strong>Patient:</strong> {admission.patient_name}
                </p>
                <p>
                  <strong>Admission Date:</strong> {admission.admission_date}
                </p>
                <p>
                  <strong>Ward:</strong> {admission.ward_name}
                </p>
                <p>
                  <strong>Bed:</strong> {admission.bed_number || 'N/A'}
                </p>
                <hr />
                {templateFields.map((field) => (
                  <div key={field.id} className="field">
                    <div className="field-label">{field.label}</div>
                    <div className="field-value">
                      {formData[field.id.toString()] || <em>Not filled</em>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DiagnosticRequisitionSidebar
        open={requisitionSidebarOpen}
        onClose={() => setRequisitionSidebarOpen(false)}
        encounterType={encounterType}
        objectId={currentObjectId}
      />

      <FloatingActionPanel
        onOpenRequisition={() => setRequisitionSidebarOpen(true)}
      />
    </div>
  );
};
