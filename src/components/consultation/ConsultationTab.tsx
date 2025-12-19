// src/components/consultation/ConsultationTab.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Pencil,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import {
  TemplateField,
  TemplateResponse,
  FieldResponsePayload,
  CreateTemplateResponsePayload,
} from '@/types/opdTemplate.types';

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
    createTemplateResponse,
    updateTemplateResponse,
  } = useOPDTemplate();

  const { user } = useAuth();
  const { useCurrentTenant } = useTenant();
  const { data: tenantData } = useCurrentTenant();
  const tenantSettings = tenantData?.settings || {};

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeResponse, setActiveResponse] = useState<TemplateResponse | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview' | 'canvas'>('fields');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Sync mode with active tab
  useEffect(() => {
    if (activeSubTab === 'preview') {
      setMode('preview');
    } else if (activeSubTab === 'fields') {
      setMode('edit');
    }
  }, [activeSubTab]);

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

  const handlePrint = useCallback(() => {
    if (!previewRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the preview');
      return;
    }

    const patient = visit.patient_details;

    // Get all stylesheets from the current document
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

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

            /* Include inline styles from preview */
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

            .preview-container .text-gray-700 {
              color: #374151 !important;
            }

            .preview-container .text-gray-600 {
              color: #4b5563 !important;
            }

            .preview-container .text-gray-400 {
              color: #9ca3af !important;
            }

            .preview-container .border-t,
            .preview-container .border-b {
              border-color: #e5e7eb !important;
            }

            .preview-container .border-dotted {
              border-color: #9ca3af !important;
            }

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

      // Dynamic import for html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const patient = visit.patient_details;

      // Capture the preview with high quality
      const canvas = await html2canvas(previewRef.current, {
        scale: 3, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
        windowHeight: 1123, // A4 height in pixels at 96 DPI (297mm)
      });

      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Calculate image dimensions to fit A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Generate filename with timestamp
      const fileName = `consultation_${patient?.patient_id || 'patient'}_${visit.visit_number}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  }, [visit]);

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
          <CardHeader>
            <CardTitle>Response #{activeResponse.response_sequence}</CardTitle>
            <CardDescription>Fill out the form fields and draw on the canvas</CardDescription>
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

            {/* Preview Tab Content */}
            <div className={activeSubTab === 'preview' ? 'block' : 'hidden'}>
              {mode === 'preview' ? (
                <div className="space-y-6">
                  {/* Action Buttons - Hidden in Print */}
                  <div className="flex justify-end items-center print:hidden">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>

                  {/* A4 Paper with Letterhead - This is what gets printed */}
                  <div
                    ref={previewRef}
                    className="preview-container mx-auto bg-white shadow-lg print:shadow-none flex flex-col"
                    style={{ width: '210mm', minHeight: '297mm' }}
                  >
                    {/* Letterhead Header */}
                    <div
                      className="border-b-4 py-8"
                      style={{
                        borderColor: tenantSettings.header_bg_color || '#3b82f6',
                        background: tenantSettings.header_bg_color || '#3b82f6',
                        color: tenantSettings.header_text_color || '#ffffff'
                      }}
                    >
                      <div className="flex justify-between items-start px-8">
                        <div className="flex items-start gap-4">
                          {/* Logo */}
                          {tenantSettings.logo && (
                            <div className="flex-shrink-0">
                              <img
                                src={tenantSettings.logo}
                                alt="Logo"
                                className="h-16 w-16 object-contain"
                              />
                            </div>
                          )}
                          <div className="max-w-md">
                            <h1 className="text-xl font-bold">
                              {tenantData?.name || 'Medical Center'}
                            </h1>
                            <p className="text-sm mt-1 opacity-90 whitespace-pre-wrap break-words">
                              {tenantSettings.address || 'Excellence in Healthcare'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold">Contact Information</p>
                          {tenantSettings.contact_phone && (
                            <p className="opacity-90">Phone: {tenantSettings.contact_phone}</p>
                          )}
                          {tenantSettings.contact_email && (
                            <p className="opacity-90">Email: {tenantSettings.contact_email}</p>
                          )}
                          {tenantSettings.website_url && (
                            <p className="opacity-90">{tenantSettings.website_url}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Patient & Visit Information */}
                    <div className="px-8 py-4 border-t border-b flex-shrink-0">
                      <h2 className="text-lg font-bold mb-3 text-center">CONSULTATION RECORD</h2>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="flex items-end">
                          <span className="font-semibold w-28 flex-shrink-0">Patient Name:</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 print:border-0 pb-0.5 ml-2">{visit.patient_details?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-end">
                          <span className="font-semibold w-28 flex-shrink-0">Patient ID:</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 print:border-0 pb-0.5 ml-2">{visit.patient_details?.patient_id || 'N/A'}</span>
                        </div>
                        <div className="flex items-end">
                          <span className="font-semibold w-28 flex-shrink-0">Age/Gender:</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 print:border-0 pb-0.5 ml-2">
                            {visit.patient_details?.age || 'N/A'} years / {visit.patient_details?.gender || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-end">
                          <span className="font-semibold w-28 flex-shrink-0">Visit Date:</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 print:border-0 pb-0.5 ml-2">{visit.visit_date || 'N/A'}</span>
                        </div>
                        <div className="flex items-end">
                          <span className="font-semibold w-28 flex-shrink-0">Doctor:</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 print:border-0 pb-0.5 ml-2">{visit.doctor_details?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-end">
                          <span className="font-semibold w-28 flex-shrink-0">Visit Number:</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 print:border-0 pb-0.5 ml-2">{visit.visit_number || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields Content */}
                    <div className="px-8 py-4 flex-1 overflow-auto border-b">
                      {selectedTemplate && fieldsData && fieldsData.length > 0 ? (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold pb-1 mb-2">
                            {templatesData?.results.find(t => t.id.toString() === selectedTemplate)?.name}
                          </h3>

                          <div className="grid grid-cols-12 gap-x-4 gap-y-1">
                            {fieldsData
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((field) => {
                                const value = formData[field.id];
                                if (!value || (Array.isArray(value) && value.length === 0) || value === false) return null;

                                // Determine field width based on type and content
                                let colSpan = 'col-span-6'; // Default: half width

                                // Full width fields
                                if (field.field_type === 'textarea' || (typeof value === 'string' && value.length > 50)) {
                                  colSpan = 'col-span-12';
                                }
                                // Small fields (numbers, dates, short text)
                                else if (
                                  field.field_type === 'number' ||
                                  field.field_type === 'date' ||
                                  field.field_type === 'datetime' ||
                                  field.field_label.toLowerCase().includes('age') ||
                                  (typeof value === 'string' && value.length <= 10)
                                ) {
                                  colSpan = 'col-span-3';
                                }
                                // Medium fields
                                else if (typeof value === 'string' && value.length <= 25) {
                                  colSpan = 'col-span-4';
                                }

                                // For fields with options, convert IDs to labels
                                let displayValue = value;
                                if (Array.isArray(value) && field.options && field.options.length > 0) {
                                  // Map option IDs to labels
                                  const labels = value
                                    .map((id: number) => {
                                      const option = field.options?.find(opt => opt.id === id);
                                      return option ? option.option_label : String(id);
                                    })
                                    .filter(Boolean);
                                  displayValue = labels.join(', ');
                                } else if (typeof value === 'number' && field.options && field.options.length > 0) {
                                  // Single selection field (select/radio)
                                  const option = field.options.find(opt => opt.id === value);
                                  displayValue = option ? option.option_label : String(value);
                                } else if (typeof value === 'boolean') {
                                  displayValue = value ? '✓ Yes' : 'No';
                                }

                                return (
                                  <div
                                    key={field.id}
                                    className={`${colSpan} flex items-baseline gap-1 py-1`}
                                  >
                                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                                      {field.field_label}:
                                    </span>
                                    <span className={`flex-1 border-b border-dotted border-gray-400 print:border-0 text-sm min-w-0 leading-tight ${colSpan === 'col-span-12' ? 'min-h-[32px]' : ''}`}>
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Check if no fields have values */}
                          {fieldsData.every(field => {
                            const value = formData[field.id];
                            return !value || (Array.isArray(value) && value.length === 0) || value === false;
                          }) && (
                            <div className="text-center py-8 text-gray-400">
                              <p className="text-sm">No data recorded</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">No template selected</p>
                        </div>
                      )}
                    </div>

                    {/* Letterhead Footer */}
                    <div
                      className="border-t-4 py-6 flex-shrink-0"
                      style={{
                        borderColor: tenantSettings.footer_bg_color || '#3b82f6',
                        background: tenantSettings.footer_bg_color || '#3b82f6',
                        color: tenantSettings.footer_text_color || '#ffffff'
                      }}
                    >
                      <div className="flex justify-between items-center text-xs px-8">
                        <div>
                          <p className="font-semibold">{tenantData?.name || 'Medical Center'}</p>
                          {tenantSettings.address && (
                            <>
                              {tenantSettings.address.split('\n').map((line: string, index: number) => (
                                <p key={index} className="opacity-90">{line}</p>
                              ))}
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="opacity-90">This is an official medical document</p>
                          <p className="opacity-90">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                          <p className="font-semibold mt-1">Confidential Medical Record</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Print Styles */}
                  <style>{`
                    .preview-container {
                      background-color: #ffffff !important;
                      color: #000000 !important;
                    }

                    .preview-container * {
                      color: inherit;
                    }

                    .preview-container .text-gray-700 {
                      color: #374151 !important;
                    }

                    .preview-container .text-gray-600 {
                      color: #4b5563 !important;
                    }

                    .preview-container .text-gray-400 {
                      color: #9ca3af !important;
                    }

                    .preview-container .border-t,
                    .preview-container .border-b {
                      border-color: #e5e7eb !important;
                    }

                    .preview-container .border-dotted {
                      border-color: #9ca3af !important;
                    }

                    .preview-container .border-gray-300 {
                      border-color: #d1d5db !important;
                    }

                    .preview-container .border-gray-400 {
                      border-color: #9ca3af !important;
                    }

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

                      body * {
                        visibility: hidden;
                      }

                      .preview-container,
                      .preview-container * {
                        visibility: visible;
                      }

                      .preview-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                      }

                      .print\\:hidden {
                        display: none !important;
                      }

                      .print\\:shadow-none {
                        box-shadow: none !important;
                      }
                    }
                  `}</style>
                </div>
              ) : null}
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
      )}
    </div>
  );
};