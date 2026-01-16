// src/components/consultation/ConsultationTab.tsx
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
import { FloatingActionPanel } from './FloatingActionPanel';
import { SideDrawer } from '@/components/SideDrawer';

interface FileAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  created_at: string;
  description?: string;
}

interface ConsultationTabProps {
  visit: OpdVisit;
}

export const ConsultationTab: React.FC<ConsultationTabProps> = ({ visit }) => {
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
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview'>('fields');
  const [isSaving, setIsSaving] = useState(false);
  const [responseDrawerOpen, setResponseDrawerOpen] = useState(false);
  const [encounterType, setEncounterType] = useState<'visit' | 'admission'>('visit');
  const [requisitionSidebarOpen, setRequisitionSidebarOpen] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  
  // Local file management state
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileIdCounter, setFileIdCounter] = useState(1);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch active admission for the patient
  const { data: admissionsData } = useAdmissions({
    patient: visit.patient,
    status: 'admitted',
  });
  const activeAdmission = admissionsData?.results?.[0] || null;

  // Determine object_id based on encounter type
  const currentObjectId = encounterType === 'visit' ? visit.id : activeAdmission?.id;

  // Fetch user for filled_by display
  const { useUser } = useUsers();
  const { data: filledByUser } = useUser(selectedResponse?.filled_by_id || null);

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

  // Handle file upload (frontend only - creates mock file with preview)
  const handleUploadFile = useCallback(async (file: File, description: string) => {
    if (!currentObjectId) {
      throw new Error('No active encounter found');
    }

    setIsLoadingFiles(true);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create object URL for preview
    const fileUrl = URL.createObjectURL(file);

    // Create mock file attachment
    const newFile: FileAttachment = {
      id: fileIdCounter,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: filledByName || 'Current User',
      created_at: new Date().toISOString(),
      description: description || undefined,
    };

    setFileAttachments(prev => [...prev, newFile]);
    setFileIdCounter(prev => prev + 1);
    setIsLoadingFiles(false);

    toast.success('File uploaded successfully');
  }, [currentObjectId, fileIdCounter, filledByName]);

  // Handle file deletion (frontend only)
  const handleDeleteFile = useCallback(async (fileId: number) => {
    setIsLoadingFiles(true);

    // Simulate deletion delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find and revoke the object URL to free memory
    const fileToDelete = fileAttachments.find(f => f.id === fileId);
    if (fileToDelete && fileToDelete.file_url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.file_url);
    }

    setFileAttachments(prev => prev.filter(f => f.id !== fileId));
    setIsLoadingFiles(false);

    toast.success('File deleted successfully');
  }, [fileAttachments]);

  // Handle file download (frontend only)
  const handleDownloadFile = useCallback((file: FileAttachment) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('File download started');
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      fileAttachments.forEach(file => {
        if (file.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(file.file_url);
        }
      });
    };
  }, [fileAttachments]);

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

  const handlePrint = useCallback(() => {
    if (!previewRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the preview');
      return;
    }

    const patient = visit.patient_details;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consultation - ${patient?.full_name || 'Patient'}</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
            }

            .preview-container {
              background-color: #ffffff !important;
              color: #000000 !important;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
            }

            .preview-container * {
              color: inherit;
            }

            .preview-container .text-gray-700 { color: #374151 !important; }
            .preview-container .text-gray-600 { color: #4b5563 !important; }
            .preview-container .text-gray-400 { color: #9ca3af !important; }

            .preview-container .border-t,
            .preview-container .border-b { border-color: #e5e7eb !important; }

            .preview-container .border-dotted { border-color: #9ca3af !important; }

            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .flex-1 { flex: 1; }
            .flex-shrink-0 { flex-shrink: 0; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .items-end { align-items: flex-end; }
            .items-baseline { align-items: baseline; }
            .justify-between { justify-content: space-between; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-4 { gap: 1rem; }
            .gap-x-4 { column-gap: 1rem; }
            .gap-x-8 { column-gap: 2rem; }
            .gap-y-1 { row-gap: 0.25rem; }
            .gap-y-2 { row-gap: 0.5rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-3 { grid-column: span 3 / span 3; }
            .col-span-4 { grid-column: span 4 / span 4; }
            .col-span-6 { grid-column: span 6 / span 6; }
            .col-span-12 { grid-column: span 12 / span 12; }
            .px-8 { padding-left: 2rem; padding-right: 2rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
            .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
            .pb-0\\.5 { padding-bottom: 0.125rem; }
            .pb-1 { padding-bottom: 0.25rem; }
            .ml-2 { margin-left: 0.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mt-1 { margin-top: 0.25rem; }
            .max-w-md { max-width: 28rem; }
            .min-w-0 { min-width: 0; }
            .min-h-\\[32px\\] { min-height: 32px; }
            .w-28 { width: 7rem; }
            .h-16 { height: 4rem; }
            .w-16 { width: 4rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .leading-tight { line-height: 1.25; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .break-words { word-wrap: break-word; }
            .border-b { border-bottom-width: 1px; }
            .border-t { border-top-width: 1px; }
            .border-b-4 { border-bottom-width: 4px; }
            .border-t-4 { border-top-width: 4px; }
            .border-dotted { border-style: dotted; }
            .border-gray-400 { border-color: #9ca3af; }
            .opacity-90 { opacity: 0.9; }
            .overflow-auto { overflow: auto; }
            .object-contain { object-fit: contain; }

            @media print {
              @page {
                size: A4;
                margin: 0;
              }

              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              body {
                margin: 0 !important;
                padding: 0 !important;
              }

              .preview-container {
                width: 210mm !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${previewRef.current.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [visit]);

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;

    try {
      toast.info('Generating PDF... Please wait.');

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const patient = visit.patient_details;

      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `consultation_${patient?.patient_id || 'patient'}_${visit.visit_number}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  }, [visit]);

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
          fileAttachments={fileAttachments}
          isLoadingResponses={isLoadingResponses}
          isLoadingTemplates={isLoadingTemplates}
          isLoadingFiles={isLoadingFiles}
          onViewResponse={handleViewResponse}
          onRefresh={mutateResponses}
          onRefreshFiles={() => {}} // No-op for frontend only
          templateDrawerOpen={templateDrawerOpen}
          onTemplateDrawerChange={setTemplateDrawerOpen}
          onUploadFile={handleUploadFile}
          onDeleteFile={handleDeleteFile}
          onDownloadFile={handleDownloadFile}
        />
      </div>

      {/* Response Detail Side Drawer (resizable) */}
      <SideDrawer
        open={responseDrawerOpen}
        onOpenChange={(open) => (open ? setResponseDrawerOpen(true) : handleCloseResponseDrawer())}
        title={templateData?.name || 'Clinical Note'}
        description={
          selectedResponse
            ? `#${selectedResponse.response_sequence} - ${selectedResponse.status || 'Draft'} - Filled by: ${filledByName}`
            : undefined
        }
        size="xl"
        storageKey="consultation-response-drawer"
      >
        <div className="flex flex-col gap-4">
          {/* Compact Tab Navigation */}
          <div className="border-b -mx-4 sm:-mx-6 px-4 sm:px-6 pb-1">
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
                onClick={() => setActiveSubTab('preview')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
                  activeSubTab === 'preview'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {/* Fields Tab */}
            {activeSubTab === 'fields' && (
              <div className="space-y-4 pt-4">
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

            {/* Preview Tab */}
            {activeSubTab === 'preview' && selectedResponse && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-end items-center gap-2 print:hidden">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="overflow-auto">
                  <div
                    ref={previewRef}
                    className="preview-container mx-auto bg-white shadow-lg print:shadow-none flex flex-col"
                    style={{ width: '210mm', minHeight: '297mm' }}
                  >
                    {/* Preview content - keeping original structure */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SideDrawer>

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