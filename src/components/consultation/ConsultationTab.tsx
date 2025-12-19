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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeResponse, setActiveResponse] = useState<TemplateResponse | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview' | 'canvas'>('fields');
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
    const doctor = visit.doctor_details;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consultation - ${patient?.full_name || 'Patient'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .header {
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .patient-info {
              background: #f5f5f5;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .patient-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .field-group {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
            }
            .field-label {
              font-weight: bold;
              color: #444;
              margin-bottom: 5px;
            }
            .field-value {
              color: #333;
              margin-left: 10px;
            }
            .help-text {
              color: #888;
              font-size: 12px;
              margin-top: 3px;
              font-style: italic;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${templateData?.name || 'Consultation Form'}</h1>
            ${templateData?.description ? `<p>${templateData.description}</p>` : ''}
          </div>

          <div class="patient-info">
            <p><strong>Patient:</strong> ${patient?.full_name || 'N/A'}</p>
            <p><strong>Patient ID:</strong> ${patient?.patient_id || 'N/A'}</p>
            <p><strong>Visit Number:</strong> ${visit.visit_number}</p>
            <p><strong>Visit Date:</strong> ${visit.visit_date}</p>
            <p><strong>Doctor:</strong> ${doctor?.full_name || 'N/A'}</p>
            <p><strong>Response #:</strong> ${activeResponse?.response_sequence || ''} by Dr. ${activeResponse?.filled_by_name || ''}</p>
          </div>

          ${previewRef.current.innerHTML}

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
  }, [visit, templateData, activeResponse]);

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;

    try {
      // Dynamic import for html2canvas and jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const patient = visit.patient_details;
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add header to first page
      pdf.setFontSize(16);
      pdf.text(templateData?.name || 'Consultation Form', 15, 15);
      pdf.setFontSize(10);
      pdf.text(`Patient: ${patient?.full_name || 'N/A'} | Visit: ${visit.visit_number}`, 15, 22);
      pdf.text(`Date: ${visit.visit_date} | Response #${activeResponse?.response_sequence || ''}`, 15, 27);

      position = 35;

      // Add image
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 35;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `consultation_${patient?.patient_id || 'patient'}_${visit.visit_number}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  }, [visit, templateData, activeResponse]);

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
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                {/* Preview Content */}
                <div className="bg-white border rounded-lg p-6">
                  <div ref={previewRef}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">{templateData?.name || 'Template Preview'}</h2>
                      {templateData?.description && (
                        <p className="text-sm text-gray-600">{templateData.description}</p>
                      )}
                    </div>

                    {isLoadingTemplate ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {fieldsData.filter(f => f.field_type !== 'json' && f.field_type !== 'canvas').map((field) => {
                          const fieldId = String(field.id);
                          const value = formData[fieldId];

                          return (
                            <div key={field.id} className="border-b pb-4 last:border-b-0">
                              <div className="font-semibold text-gray-700 mb-2">{field.field_label}</div>
                              <div className="text-gray-900">
                                {(() => {
                                  // Display the value based on field type
                                  if (field.field_type === 'boolean') {
                                    return value ? 'Yes' : 'No';
                                  } else if (field.field_type === 'select' || field.field_type === 'radio') {
                                    const selectedOption = field.options?.find(opt => opt.id === Number(value));
                                    return selectedOption?.option_label || 'Not selected';
                                  } else if (field.field_type === 'multiselect' || (field.field_type === 'checkbox' && field.options?.length)) {
                                    const selectedValues = Array.isArray(value) ? value : [];
                                    const selectedLabels = field.options
                                      ?.filter(opt => selectedValues.includes(opt.id))
                                      .map(opt => opt.option_label)
                                      .join(', ');
                                    return selectedLabels || 'None selected';
                                  } else if (value !== null && value !== undefined && value !== '') {
                                    return String(value);
                                  } else {
                                    return <span className="text-gray-400 italic">Not filled</span>;
                                  }
                                })()}
                              </div>
                              {field.help_text && (
                                <div className="text-xs text-gray-500 mt-1">{field.help_text}</div>
                              )}
                            </div>
                          );
                        })}
                        {fieldsData.filter(f => f.field_type !== 'json' && f.field_type !== 'canvas').length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No fields available for preview
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
      )}
    </div>
  );
};