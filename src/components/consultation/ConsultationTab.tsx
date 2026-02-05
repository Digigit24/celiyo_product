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
import { Loader2, Save, Download, Printer, Building2, Stethoscope, CalendarPlus, X, MessageSquare, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useIPD } from '@/hooks/useIPD';
import { usePatient } from '@/hooks/usePatient';
import { useClinicalNote } from '@/hooks/useClinicalNote';
import { useScheduling } from '@/hooks/useScheduling';
import { templatesService } from '@/services/whatsapp/templatesService';
import { authService } from '@/services/authService';
import { useTenant } from '@/hooks/useTenant';
import { useUsers } from '@/hooks/useUsers';
import { useConsultationAttachment } from '@/hooks/useConsultationAttachment';
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
  onVisitUpdate?: () => void;
}

export const ConsultationTab: React.FC<ConsultationTabProps> = ({ visit, onVisitUpdate }) => {
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

  // File attachment hooks
  const {
    useAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useConsultationAttachment();

  const [selectedResponse, setSelectedResponse] = useState<TemplateResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSubTab, setActiveSubTab] = useState<'fields' | 'preview'>('fields');
  const [isSaving, setIsSaving] = useState(false);
  const [responseDrawerOpen, setResponseDrawerOpen] = useState(false);
  const [encounterType, setEncounterType] = useState<'visit' | 'admission'>('visit');
  const [requisitionSidebarOpen, setRequisitionSidebarOpen] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [followupDate, setFollowupDate] = useState<Date | undefined>(undefined);
  const [followupNotes, setFollowupNotes] = useState('');
  const [isSavingFollowup, setIsSavingFollowup] = useState(false);

  // WhatsApp message dialog state
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [whatsAppVariables, setWhatsAppVariables] = useState<Record<string, string>>({});
  const [templateBody, setTemplateBody] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [savedFollowupDate, setSavedFollowupDate] = useState<Date | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Clinical note hook for follow-up date
  const { useClinicalNoteByVisit, updateNote, createNote } = useClinicalNote();
  const { data: clinicalNote, mutate: mutateClinicalNote } = useClinicalNoteByVisit(visit.id);

  // Scheduling hook for follow-up reminders
  const { scheduleEvent, loading: isSchedulingReminder } = useScheduling();

  // Fetch patient details (for phone number)
  const { usePatientById } = usePatient();
  const { data: patientData } = usePatientById(visit.patient);

  // Fetch active admission for the patient
  const { data: admissionsData } = useAdmissions({
    patient: visit.patient,
    status: 'admitted',
  });
  const activeAdmission = admissionsData?.results?.[0] || null;

  // Initialize follow-up date from clinical note
  useEffect(() => {
    if (clinicalNote?.next_followup_date) {
      setFollowupDate(new Date(clinicalNote.next_followup_date));
      setSavedFollowupDate(new Date(clinicalNote.next_followup_date));
    }
  }, [clinicalNote?.next_followup_date]);

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

  // Fetch file attachments for the current encounter context
  const { data: attachmentsData, isLoading: isLoadingAttachments, mutate: mutateAttachments } = useAttachments(
    currentObjectId
      ? {
          encounter_type: encounterType,
          object_id: currentObjectId,
        }
      : undefined
  );
  const fileAttachments = useMemo(() => attachmentsData?.results || [], [attachmentsData]);

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

  // Handle file upload
  const handleUploadFile = useCallback(async (file: File, description: string) => {
    console.log("[ConsultationTab] handleUploadFile called:", { fileName: file.name, fileSize: file.size, description, currentObjectId, encounterType });
    if (!currentObjectId) {
      toast.error('No valid visit or admission context');
      return;
    }

    try {
      await uploadAttachment({
        encounter_type: encounterType,
        object_id: currentObjectId,
        file,
        description,
      });
      toast.success('File uploaded successfully');
      mutateAttachments();
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      throw error; // Re-throw to let FileUploadDialog handle it
    }
  }, [currentObjectId, encounterType, uploadAttachment, mutateAttachments]);

  // Handle file delete
  const handleDeleteFile = useCallback(async (fileId: number) => {
    try {
      await deleteAttachment(fileId);
      toast.success('File deleted successfully');
      mutateAttachments();
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      toast.error(error.message || 'Failed to delete file');
    }
  }, [deleteAttachment, mutateAttachments]);

  // Handle file download
  const handleDownloadFile = useCallback((file: any) => {
    downloadAttachment(file);
  }, [downloadAttachment]);

  // Handle follow-up save
  const handleSaveFollowup = async () => {
    setIsSavingFollowup(true);
    try {
      const followupDateStr = followupDate ? format(followupDate, 'yyyy-MM-dd') : null;

      // Save follow-up to clinical note
      if (clinicalNote?.id) {
        // Update existing clinical note
        await updateNote(clinicalNote.id, {
          next_followup_date: followupDateStr,
        });
      } else {
        // Create new clinical note with follow-up date
        await createNote({
          visit: visit.id,
          next_followup_date: followupDateStr,
        });
      }

      // Update local state immediately for UI feedback
      setSavedFollowupDate(followupDate || null);

      setIsFollowupOpen(false);
      mutateClinicalNote(); // Refresh clinical note data
      onVisitUpdate?.();

      // Schedule WhatsApp reminder if follow-up date is set
      if (followupDate) {
        const patientPhone = patientData?.mobile_primary || visit.patient_details?.mobile_primary;

        if (!patientPhone) {
          toast.success('Follow-up saved (no phone for reminder)');
        } else {
          // Format phone number
          let phone = patientPhone.replace(/[\s\-\(\)]/g, '');
          if (!phone.startsWith('+')) {
            if (!phone.startsWith('91') && phone.length === 10) {
              phone = '+91' + phone;
            } else if (phone.startsWith('91')) {
              phone = '+' + phone;
            }
          }

          // Create follow-up datetime (default 10:00 AM)
          const followupDateTime = new Date(followupDate);
          followupDateTime.setHours(10, 0, 0, 0);

          const patientName = patientData?.full_name || visit.patient_details?.full_name || 'Patient';

          // Schedule the follow-up event with auto-reminders (1 hour before configured in backend)
          const result = await scheduleEvent(
            'followup_appointment',
            phone,
            followupDateTime.toISOString(),
            {
              patient_name: patientName,
              doctor_name: visit.doctor_details?.full_name || 'Doctor',
              hospital_name: tenantData?.name || 'Hospital',
              visit_id: visit.id,
              appointment_date: format(followupDate, 'dd MMM yyyy'),
              appointment_time: '10:00 AM',
            },
            {
              timezone: 'Asia/Kolkata',
              contactName: patientName,
            }
          );

          if (result.success) {
            const reminderCount = result.data?.scheduled_messages?.length || 0;
            toast.success(`Follow-up scheduled with ${reminderCount} reminder${reminderCount !== 1 ? 's' : ''}`);
          } else {
            // Still saved follow-up, just reminder failed
            toast.warning('Follow-up saved, but reminder scheduling failed');
            console.error('Scheduling failed:', result.error);
          }
        }
      } else {
        toast.success('Follow-up cleared');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save follow-up');
    } finally {
      setIsSavingFollowup(false);
    }
  };

  // Handle WhatsApp send
  const handleSendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      const patientPhone = patientData?.mobile_primary || visit.patient_details?.mobile_primary;
      if (!patientPhone) {
        toast.error('Patient phone not available');
        return;
      }

      // Clean phone number
      let phone = patientPhone.replace(/[\s\-\(\)]/g, '');
      if (!phone.startsWith('91') && phone.length === 10) {
        phone = '91' + phone;
      }

      await templatesService.sendTemplate({
        to: phone,
        template_name: templateName,
        language: templateLanguage as any,
        parameters: whatsAppVariables,
      });

      toast.success('WhatsApp reminder sent successfully');
      setIsWhatsAppDialogOpen(false);
    } catch (err: any) {
      console.error('WhatsApp send failed:', err);
      toast.error('Failed to send WhatsApp: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Get preview with variables replaced
  const getPreviewWithVariables = () => {
    let preview = templateBody;
    Object.entries(whatsAppVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return preview;
  };

  const handleClearFollowup = () => {
    setFollowupDate(undefined);
    setFollowupNotes('');
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
    <div className="flex flex-col relative">
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

          <div className="flex items-center gap-3">
            {encounterType === 'admission' && activeAdmission && (
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
                <Building2 className="h-3 w-3" />
                <span>Admission: {activeAdmission.admission_id}</span>
              </div>
            )}

            {/* Follow-up Button */}
            <Button
              variant={(savedFollowupDate || clinicalNote?.next_followup_date) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsFollowupOpen(true)}
              className={`gap-2 ${(savedFollowupDate || clinicalNote?.next_followup_date) ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            >
              <CalendarPlus className="h-4 w-4" />
              {(savedFollowupDate || clinicalNote?.next_followup_date)
                ? `Follow-up: ${format(savedFollowupDate || new Date(clinicalNote!.next_followup_date!), 'dd MMM')}`
                : 'Set Follow-up'}
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
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
          isLoadingFiles={isLoadingAttachments}
          onViewResponse={handleViewResponse}
          onRefresh={mutateResponses}
          onRefreshFiles={mutateAttachments}
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
                      {selectedResponse && fieldsData && fieldsData.length > 0 ? (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold pb-1 mb-2">
                            {templatesData?.results.find(t => t.id === selectedResponse.template)?.name}
                          </h3>
                          <div className="grid grid-cols-12 gap-x-4 gap-y-1">
                            {fieldsData
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((field) => {
                                const value = formData[field.id];
                                if (!value || (Array.isArray(value) && value.length === 0) || value === false) return null;

                                let colSpan = 'col-span-6';
                                if (field.field_type === 'textarea' || (typeof value === 'string' && value.length > 50)) {
                                  colSpan = 'col-span-12';
                                } else if (
                                  field.field_type === 'number' ||
                                  field.field_type === 'date' ||
                                  field.field_type === 'datetime' ||
                                  field.field_label.toLowerCase().includes('age') ||
                                  (typeof value === 'string' && value.length <= 10)
                                ) {
                                  colSpan = 'col-span-3';
                                } else if (typeof value === 'string' && value.length <= 25) {
                                  colSpan = 'col-span-4';
                                }

                                let displayValue = value;
                                if (Array.isArray(value) && field.options && field.options.length > 0) {
                                  const labels = value
                                    .map((id: number) => {
                                      const option = field.options?.find(opt => opt.id === id);
                                      return option ? option.option_label : String(id);
                                    })
                                    .filter(Boolean);
                                  displayValue = labels.join(', ');
                                } else if (typeof value === 'number' && field.options && field.options.length > 0) {
                                  const option = field.options.find(opt => opt.id === value);
                                  displayValue = option ? option.option_label : String(value);
                                } else if (typeof value === 'boolean') {
                                  displayValue = value ? '✓ Yes' : 'No';
                                }

                                return (
                                  <div key={field.id} className={`${colSpan} flex items-baseline gap-1 py-1`}>
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

      {/* Follow-up Dialog */}
      <Dialog open={isFollowupOpen} onOpenChange={setIsFollowupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Schedule Follow-up
            </DialogTitle>
            <DialogDescription>
              Set the next follow-up date for this patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={followupDate}
                onSelect={setFollowupDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                placeholder="Follow-up instructions..."
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                className="mt-2 h-20 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {(followupDate || clinicalNote?.next_followup_date) && (
              <Button
                variant="outline"
                onClick={() => {
                  handleClearFollowup();
                  handleSaveFollowup();
                }}
                className="text-destructive hover:text-destructive"
              >
                Clear Follow-up
              </Button>
            )}
            <Button
              onClick={handleSaveFollowup}
              disabled={isSavingFollowup || !followupDate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSavingFollowup && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Message Dialog - Field Mapping */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Send Follow-up Reminder
            </DialogTitle>
            <DialogDescription>
              Review and send WhatsApp message to patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Follow-up Date Display & Edit */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-purple-700 dark:text-purple-300">Follow-up Date</Label>
                  <p className="text-sm font-medium mt-1">
                    {savedFollowupDate ? format(savedFollowupDate, 'dd MMM yyyy (EEEE)') : 'Not set'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsWhatsAppDialogOpen(false);
                    setFollowupDate(savedFollowupDate || undefined);
                    setIsFollowupOpen(true);
                  }}
                  className="text-purple-600 border-purple-300 hover:bg-purple-100"
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Change
                </Button>
              </div>
            </div>

            {/* Variable Inputs */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Message Variables</Label>
              {Object.keys(whatsAppVariables).sort().map((varKey) => (
                <div key={varKey} className="flex items-center gap-3">
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded min-w-[50px] text-center">
                    {`{{${varKey}}}`}
                  </span>
                  <Input
                    value={whatsAppVariables[varKey]}
                    onChange={(e) => setWhatsAppVariables(prev => ({
                      ...prev,
                      [varKey]: e.target.value
                    }))}
                    placeholder={`Value for {{${varKey}}}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>

            {/* Message Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Message Preview</Label>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm whitespace-pre-wrap">{getPreviewWithVariables()}</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="text-xs text-muted-foreground">
              Sending to: {patientData?.full_name || visit.patient_details?.full_name} ({patientData?.mobile_primary || visit.patient_details?.mobile_primary})
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsWhatsAppDialogOpen(false)}
            >
              Skip
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={isSendingWhatsApp}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSendingWhatsApp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};