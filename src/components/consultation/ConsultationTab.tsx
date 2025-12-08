// src/components/consultation/ConsultationTab.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FileText, Printer, Save, Loader2, Download } from 'lucide-react';
import { OpdVisit } from '@/types/opdVisit.types';
import { toast } from 'sonner';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { opdTemplateService } from '@/services/opdTemplate.service';
import type { Template, TemplateField, TemplateResponse, FieldResponsePayload } from '@/types/opdTemplate.types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ConsultationTabProps {
  visit: OpdVisit;
}

export const ConsultationTab: React.FC<ConsultationTabProps> = ({ visit }) => {
  const { useTemplateGroups, useTemplates, useTemplate } = useOPDTemplate();
  const { getTenant } = useAuth();
  const { useTenantDetail } = useTenant();
  const [mode, setMode] = useState<'entry' | 'preview'>('entry');
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasDefaultTemplate, setHasDefaultTemplate] = useState<boolean>(false);
  const [isLoadingDefaultTemplate, setIsLoadingDefaultTemplate] = useState<boolean>(true);
  const [isDefaultTemplateLoaded, setIsDefaultTemplateLoaded] = useState<boolean>(false);

  // Template response state
  const [existingResponse, setExistingResponse] = useState<TemplateResponse | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Get tenant from current session
  const tenant = getTenant();
  const tenantId = tenant?.id || null;

  // Fetch tenant settings for branding
  const { data: tenantData } = useTenantDetail(tenantId);
  const tenantSettings = tenantData?.settings || {};

  // Fetch template groups
  const { data: groupsData, isLoading: isLoadingGroups } = useTemplateGroups({
    show_inactive: false,
    ordering: 'display_order',
  });

  // Fetch templates for selected group
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    group: selectedTemplateGroup ? parseInt(selectedTemplateGroup) : undefined,
    is_active: true,
    ordering: 'display_order',
  });

  // Fetch template details with fields (includes nested options)
  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(
    selectedTemplate ? parseInt(selectedTemplate) : null
  );

  // Extract fields from template data
  const fieldsData = templateData?.fields || [];
  const isLoadingFields = isLoadingTemplate;

  // Debug: Log template data changes
  useEffect(() => {
    if (selectedTemplate) {
      console.log('📊 Template data status:', {
        selectedTemplate,
        hasTemplateData: !!templateData,
        isLoadingTemplate,
        fieldsCount: fieldsData.length,
        templateName: templateData?.name
      });
    }
  }, [selectedTemplate, templateData, isLoadingTemplate, fieldsData.length]);

  // Fetch existing template response when template is selected
  useEffect(() => {
    const fetchExistingResponse = async () => {
      if (!selectedTemplate || !visit?.id) return;

      setIsLoadingResponse(true);
      try {
        console.log('🔍 Fetching existing response for visit:', visit.id);
        const responses = await opdTemplateService.getVisitTemplateResponses(visit.id);

        // Find response for current template
        const response = responses.find(r => r.template === parseInt(selectedTemplate));

        if (response) {
          console.log('✅ Found existing response:', response);
          setExistingResponse(response);

          // Populate form data from existing response
          if (response.field_responses && response.field_responses.length > 0) {
            const populatedData: Record<string, any> = {};

            response.field_responses.forEach((fieldResp: any) => {
              const fieldId = String(fieldResp.field);

              // Determine which value to use based on field type
              if (fieldResp.selected_options && fieldResp.selected_options.length > 0) {
                populatedData[fieldId] = fieldResp.selected_options;
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
            console.log('✅ Form data populated from existing response:', populatedData);
            toast.info('Loaded existing consultation data');
          }
        } else {
          console.log('ℹ️ No existing response found for this template');
          setExistingResponse(null);
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch existing response:', error);
        // Don't show error toast - it's ok if there's no existing response
      } finally {
        setIsLoadingResponse(false);
      }
    };

    fetchExistingResponse();
  }, [selectedTemplate, visit?.id]);

  // Load default template from user preferences on mount
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      setIsLoadingDefaultTemplate(true);
      try {
        const preferences = authService.getUserPreferences();
        const defaultTemplateId = preferences?.defaultOPDTemplate;

        console.log('🔍 Checking for default template...', {
          preferences,
          defaultTemplateId,
          serviceAvailable: !!opdTemplateService,
          hasGetTemplate: typeof opdTemplateService?.getTemplate === 'function'
        });

        if (defaultTemplateId) {
          console.log('📋 Loading default template:', defaultTemplateId);
          console.log('Service object:', opdTemplateService);

          // Fetch the default template to get its group using hmsClient directly
          const { hmsClient } = await import('@/lib/client');
          const response = await hmsClient.get(`/opd/templates/${defaultTemplateId}/`);
          const defaultTemplate = response.data;

          if (defaultTemplate) {
            // Set the group and template IDs
            setSelectedTemplateGroup(String(defaultTemplate.group));
            setSelectedTemplate(String(defaultTemplate.id));
            setHasDefaultTemplate(true);
            setIsDefaultTemplateLoaded(true);
            console.log('✅ Default template loaded:', {
              id: defaultTemplate.id,
              name: defaultTemplate.name,
              group: defaultTemplate.group
            });
            toast.success(`Default template loaded: ${defaultTemplate.name}`);
          }
        } else {
          console.log('ℹ️ No default template set in preferences');
          setHasDefaultTemplate(false);
        }
      } catch (error: any) {
        console.error('❌ Failed to load default template:', error);
        toast.error(error.message || 'Failed to load default template');
        setHasDefaultTemplate(false);
      } finally {
        setIsLoadingDefaultTemplate(false);
      }
    };

    loadDefaultTemplate();
  }, []); // Only run on mount

  // Reset template selection when group changes (only if manually changed, not from default load)
  useEffect(() => {
    if (!isLoadingDefaultTemplate && !isDefaultTemplateLoaded) {
      setSelectedTemplate('');
      setFormData({});
    }
    // Reset the flag after the first group change
    if (isDefaultTemplateLoaded) {
      setIsDefaultTemplateLoaded(false);
    }
  }, [selectedTemplateGroup]);

  // Reset form data when template changes
  useEffect(() => {
    setFormData({});
  }, [selectedTemplate]);

  // Log fetched data
  useEffect(() => {
    if (groupsData) {
      console.log('Template Groups:', groupsData);
    }
  }, [groupsData]);

  useEffect(() => {
    if (templatesData) {
      console.log('Templates:', templatesData);
    }
  }, [templatesData]);

  useEffect(() => {
    if (fieldsData) {
      console.log('Template Fields:', fieldsData);
      console.log('First field with options check:', fieldsData[0]);
      if (fieldsData.length > 0) {
        fieldsData.forEach((field, idx) => {
          console.log(`Field ${idx} (${field.field_label}):`, {
            type: field.field_type,
            hasOptions: !!field.options,
            optionsCount: field.options?.length || 0,
            options: field.options
          });
        });
      }
    }
  }, [fieldsData]);

  const handleFieldChange = (fieldId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSave = async () => {
    if (!selectedTemplate || !visit?.id) {
      toast.error('Please select a template first');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 Saving consultation...', { formData, fieldsData });

      // Build field_responses array from formData
      const fieldResponses: FieldResponsePayload[] = fieldsData.map((field) => {
        const fieldValue = formData[String(field.id)];
        const response: FieldResponsePayload = {
          field: field.id,
        };

        // Determine which value field to populate based on field type
        switch (field.field_type) {
          case 'text':
          case 'textarea':
          case 'email':
          case 'phone':
          case 'url':
            response.value_text = fieldValue || null;
            break;

          case 'number':
            response.value_number = fieldValue ? Number(fieldValue) : null;
            break;

          case 'date':
            response.value_date = fieldValue || null;
            break;

          case 'datetime':
            response.value_datetime = fieldValue || null;
            break;

          case 'checkbox':
            // If field has options, use selected_options, otherwise use boolean
            if (field.options && field.options.length > 0) {
              response.selected_options = Array.isArray(fieldValue)
                ? fieldValue.map(Number)
                : [];
            } else {
              response.value_boolean = Boolean(fieldValue);
            }
            break;

          case 'select':
          case 'radio':
            // Single selection - convert to array
            response.selected_options = fieldValue ? [Number(fieldValue)] : [];
            break;

          case 'multiselect':
            // Multiple selection - already an array
            response.selected_options = Array.isArray(fieldValue)
              ? fieldValue.map(Number)
              : fieldValue
              ? [Number(fieldValue)]
              : [];
            break;

          default:
            response.value_text = fieldValue ? String(fieldValue) : null;
        }

        return response;
      });

      console.log('📤 Submitting field responses:', fieldResponses);

      const payload = {
        template: parseInt(selectedTemplate),
        status: 'draft' as const,
        field_responses: fieldResponses,
      };

      let savedResponse: TemplateResponse;

      if (existingResponse) {
        // Update existing response
        console.log('🔄 Updating existing response:', existingResponse.id);
        savedResponse = await opdTemplateService.updateTemplateResponse(
          existingResponse.id,
          payload
        );
        // Preserve the ID since API response might not include it
        setExistingResponse({ ...savedResponse, id: existingResponse.id });
        toast.success('Consultation updated successfully');
      } else {
        // Create new response
        console.log('✨ Creating new response');
        savedResponse = await opdTemplateService.createVisitTemplateResponse(
          visit.id,
          payload
        );
        setExistingResponse(savedResponse);
        toast.success('Consultation saved successfully');
      }

      console.log('✅ Response saved:', savedResponse);
    } catch (error: any) {
      console.error('❌ Failed to save consultation:', error);
      toast.error(error.message || 'Failed to save consultation');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.querySelector('.preview-container') as HTMLElement;
    if (!element) {
      toast.error('Preview container not found');
      return;
    }

    try {
      toast.info('Generating PDF...');

      // Temporarily add class to hide borders during capture
      element.classList.add('pdf-mode');

      // Capture the element as canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Remove the temporary class
      element.classList.remove('pdf-mode');

      // A4 dimensions in mm
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Generate filename with patient name and date
      const patientName = visit.patient_details?.full_name?.replace(/\s+/g, '_') || 'Patient';
      const date = new Date().toISOString().split('T')[0];
      const filename = `Consultation_${patientName}_${date}.pdf`;

      pdf.save(filename);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
      // Make sure to remove the class even if there's an error
      element.classList.remove('pdf-mode');
    }
  };

  // Helper function to determine grid columns based on option count
  const getGridColumns = (optionCount: number): string => {
    if (optionCount <= 2) return 'grid-cols-1';
    if (optionCount <= 4) return 'grid-cols-2';
    if (optionCount <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.id] || '';

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={`field-${field.id}`}
              type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : field.field_type === 'url' ? 'url' : 'text'}
              placeholder={field.placeholder || ''}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              minLength={field.min_length}
              maxLength={field.max_length}
              pattern={field.pattern}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={`field-${field.id}`}
              placeholder={field.placeholder || ''}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              minLength={field.min_length}
              maxLength={field.max_length}
              rows={4}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={`field-${field.id}`}
              type="number"
              placeholder={field.placeholder || ''}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
              min={field.min_value}
              max={field.max_value}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={`field-${field.id}`}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'datetime':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={`field-${field.id}`}
              type="datetime-local"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.is_required}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'checkbox':
        // If field has options, render as checkbox group
        if (field.options && field.options.length > 0) {
          const activeOptions = field.options.filter(opt => opt.is_active !== false);
          const gridCols = getGridColumns(activeOptions.length);

          return (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.field_label}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {field.options
                  .filter(opt => opt.is_active !== false) // Include if is_active is undefined or true
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((option) => {
                    const selectedValues = Array.isArray(value) ? value : [];
                    const isChecked = selectedValues.includes(option.id);
                    return (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.id}-${option.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newValues = checked
                              ? [...selectedValues, option.id]
                              : selectedValues.filter((v: number) => v !== option.id);
                            handleFieldChange(field.id, newValues);
                          }}
                        />
                        <Label htmlFor={`field-${field.id}-${option.id}`} className="cursor-pointer">
                          {option.option_label}
                        </Label>
                      </div>
                    );
                  })}
              </div>
              {field.help_text && (
                <p className="text-xs text-muted-foreground">{field.help_text}</p>
              )}
            </div>
          );
        }
        // Otherwise, render as single boolean checkbox
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={`field-${field.id}`}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={`field-${field.id}`} className="cursor-pointer">
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.help_text && (
              <p className="text-xs text-muted-foreground ml-2">({field.help_text})</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`field-${field.id}`}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value ? String(value) : ''}
              onValueChange={(val) => handleFieldChange(field.id, Number(val))}
            >
              <SelectTrigger id={`field-${field.id}`}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options && field.options.length > 0 ? (
                  field.options
                    .filter(opt => opt.is_active !== false) // Include if is_active is undefined or true
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.option_label}
                      </SelectItem>
                    ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No options available</div>
                )}
              </SelectContent>
            </Select>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value ? String(value) : ''}
              onValueChange={(val) => handleFieldChange(field.id, Number(val))}
            >
              {field.options && field.options.length > 0 ? (
                field.options
                  .filter(opt => opt.is_active !== false) // Include if is_active is undefined or true
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(option.id)} id={`field-${field.id}-${option.id}`} />
                      <Label htmlFor={`field-${field.id}-${option.id}`} className="cursor-pointer">
                        {option.option_label}
                      </Label>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">No options available</p>
              )}
            </RadioGroup>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      case 'multiselect':
        const activeMultiOptions = field.options?.filter(opt => opt.is_active !== false) || [];
        const multiGridCols = getGridColumns(activeMultiOptions.length);

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className={`grid ${multiGridCols} gap-2`}>
              {field.options && field.options.length > 0 ? (
                field.options
                  .filter(opt => opt.is_active !== false) // Include if is_active is undefined or true
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((option) => {
                    const selectedValues = Array.isArray(value) ? value : [];
                    const isChecked = selectedValues.includes(option.id);
                    return (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.id}-${option.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newValues = checked
                              ? [...selectedValues, option.id]
                              : selectedValues.filter((v: number) => v !== option.id);
                            handleFieldChange(field.id, newValues);
                          }}
                        />
                        <Label htmlFor={`field-${field.id}-${option.id}`} className="cursor-pointer">
                          {option.option_label}
                        </Label>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-muted-foreground">No options available</p>
              )}
            </div>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (mode === 'preview') {
    return (
      <div className="space-y-6">
        {/* Mode Toggle - Hidden in Print */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode('entry')}>
              <FileText className="h-4 w-4 mr-2" />
              Edit Mode
            </Button>
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
          className="preview-container mx-auto bg-white shadow-lg print:shadow-none flex flex-col"
          style={{ width: '210mm', height: '297mm' }}
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
                <div>
                  <h1 className="text-3xl font-bold">
                    {tenantData?.name || 'Medical Center'}
                  </h1>
                  <p className="text-sm mt-1 opacity-90">
                    {tenantSettings.address?.split('\n')[0] || 'Excellence in Healthcare'}
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
          /* Force preview to be theme-independent */
          .preview-container {
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          .preview-container * {
            color: inherit;
          }

          /* Override specific text colors */
          .preview-container .text-gray-700 {
            color: #374151 !important;
          }

          .preview-container .text-gray-600 {
            color: #4b5563 !important;
          }

          .preview-container .text-gray-400 {
            color: #9ca3af !important;
          }

          /* Ensure borders are visible regardless of theme */
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

          /* Hide borders in PDF download mode */
          .pdf-mode .border-b {
            border-bottom: 0 !important;
          }

          @media print {
            @page {
              size: A4;
              margin: 0;
            }

            /* Force background colors and images to print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            /* Hide everything except the preview container */
            body * {
              visibility: hidden;
            }

            .preview-container,
            .preview-container * {
              visibility: visible;
            }

            /* Position preview container at top of page */
            .preview-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm !important;
              margin: 0 !important;
              box-shadow: none !important;
            }

            /* Hide print buttons and UI elements */
            .print\\:hidden {
              display: none !important;
            }

            .print\\:shadow-none {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading state for default template */}
      {isLoadingDefaultTemplate && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading default template...</span>
          </CardContent>
        </Card>
      )}

      {/* Template Selection - Only show if no default template is set */}
      {!isLoadingDefaultTemplate && !hasDefaultTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Select Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          {/* Template Group Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="template-group">Template Group</Label>
            <Select
              value={selectedTemplateGroup}
              onValueChange={setSelectedTemplateGroup}
              disabled={isLoadingGroups}
            >
              <SelectTrigger id="template-group" className="w-full">
                <SelectValue placeholder={isLoadingGroups ? "Loading template groups..." : "Select a template group"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingGroups ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : groupsData?.results && groupsData.results.length > 0 ? (
                  groupsData.results.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No template groups available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Template Dropdown - Only show if group is selected */}
          {selectedTemplateGroup && (
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select a template"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : templatesData?.results && templatesData.results.length > 0 ? (
                    templatesData.results.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No templates available for this group
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Dynamic Form Fields - Only show if template is selected and not loading default */}
      {selectedTemplate && !isLoadingDefaultTemplate && (
        <>
          {/* Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode('preview')}>
                <FileText className="h-4 w-4 mr-2" />
                Preview Mode
              </Button>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Consultation
                </>
              )}
            </Button>
          </div>

          {isLoadingFields ? (
            <Card>
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading template fields...</span>
              </CardContent>
            </Card>
          ) : fieldsData && fieldsData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {templateData?.name || templatesData?.results.find(t => t.id.toString() === selectedTemplate)?.name || 'Template'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fieldsData
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((field) => renderField(field))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No fields configured for this template
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Show message when no template is selected */}
      {!selectedTemplate && selectedTemplateGroup && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Please select a template to continue
          </CardContent>
        </Card>
      )}

      {!selectedTemplateGroup && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Please select a template group to begin
          </CardContent>
        </Card>
      )}
    </div>
  );
};
