// src/components/consultation/ConsultationBoard.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { LayoutGrid, FileText, Plus, Paperclip } from 'lucide-react';

import { OpdVisit } from '@/types/opdVisit.types';
import { TemplateResponse, Template, ResponseTemplate } from '@/types/opdTemplate.types';

import { ResponseCard } from './ResponseCard';
import { TemplateSelectionDrawer } from './TemplateSelectionDrawer';
import { FileAttachmentCard } from './FileAttachmentCard';
import { FileUploadDialog } from './FileUploadDialog';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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

interface ConsultationBoardProps {
  encounterType: 'visit' | 'admission';
  objectId: number | null;
  visit: OpdVisit;
  responses: TemplateResponse[];
  templates: Template[];
  fileAttachments?: FileAttachment[];
  isLoadingResponses: boolean;
  isLoadingTemplates: boolean;
  isLoadingFiles?: boolean;
  onViewResponse: (response: TemplateResponse) => void;
  onRefresh: () => void;
  onRefreshFiles?: () => void;
  templateDrawerOpen: boolean;
  onTemplateDrawerChange: (open: boolean) => void;
  onUploadFile?: (file: File, description: string) => Promise<void>;
  onDeleteFile?: (fileId: number) => Promise<void>;
  onDownloadFile?: (file: FileAttachment) => void;
}

export const ConsultationBoard: React.FC<ConsultationBoardProps> = ({
  encounterType,
  objectId,
  visit,
  responses,
  templates,
  fileAttachments = [],
  isLoadingResponses,
  isLoadingTemplates,
  isLoadingFiles = false,
  onViewResponse,
  onRefresh,
  onRefreshFiles,
  templateDrawerOpen,
  onTemplateDrawerChange,
  onUploadFile,
  onDeleteFile,
  onDownloadFile,
}) => {
  const navigate = useNavigate();

  const [saveAsTemplateDialog, setSaveAsTemplateDialog] = useState(false);
  const [copyFromTemplateDialog, setCopyFromTemplateDialog] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [selectedResponseForAction, setSelectedResponseForAction] = useState<TemplateResponse | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const {
    createTemplateResponse,
    deleteTemplateResponse,
    convertToResponseTemplate,
    applyResponseTemplate,
    useResponseTemplates,
  } = useOPDTemplate();

  const { data: responseTemplatesData } = useResponseTemplates({
    template: selectedResponseForAction?.template,
  });

  const onOpenCanvasResponse = useCallback(
    (response: TemplateResponse) => {
      navigate(`/opd/consultation/${visit.id}/canvas/${response.id}`);
    },
    [navigate, visit.id]
  );

  const handleSelectTemplate = useCallback(
    async (templateId: number) => {
      if (!objectId) {
        toast.error('No valid context (visit or admission) found for creating this note.');
        return;
      }

      try {
        const newResponse = await createTemplateResponse({
          encounter_type: encounterType,
          object_id: objectId,
          template: templateId,
          status: 'draft',
        });
        toast.success('New clinical note created');
        onRefresh();
        onViewResponse(newResponse);
      } catch (error: any) {
        toast.error(error.message || 'Failed to create note');
      }
    },
    [encounterType, objectId, createTemplateResponse, onRefresh, onViewResponse]
  );

  const handleDeleteResponse = useCallback(
    async (responseId: number) => {
      const confirmed = window.confirm('Are you sure you want to delete this response? This action cannot be undone.');
      if (!confirmed) return;

      try {
        await deleteTemplateResponse(responseId);
        toast.success('Response deleted');
        onRefresh();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete response');
      }
    },
    [deleteTemplateResponse, onRefresh]
  );

  const handleSaveAsTemplate = useCallback((response: TemplateResponse) => {
    setSelectedResponseForAction(response);
    setTemplateName('');
    setIsPublic(false);
    setSaveAsTemplateDialog(true);
  }, []);

  const handleConfirmSaveAsTemplate = useCallback(async () => {
    if (!selectedResponseForAction || !templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      await convertToResponseTemplate(selectedResponseForAction.id, templateName.trim(), isPublic);
      toast.success('Response saved as template successfully!');
      setSaveAsTemplateDialog(false);
      setSelectedResponseForAction(null);
      setTemplateName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save as template');
    }
  }, [selectedResponseForAction, templateName, isPublic, convertToResponseTemplate]);

  const handleCopyFromTemplate = useCallback((response: TemplateResponse) => {
    setSelectedResponseForAction(response);
    setCopyFromTemplateDialog(true);
  }, []);

  const handleConfirmCopyFromTemplate = useCallback(
    async (responseTemplateId: number) => {
      if (!selectedResponseForAction) return;

      try {
        await applyResponseTemplate(selectedResponseForAction.id, responseTemplateId);
        toast.success('Template applied successfully!');
        setCopyFromTemplateDialog(false);
        setSelectedResponseForAction(null);
        onRefresh();
      } catch (error: any) {
        toast.error(error.message || 'Failed to apply template');
      }
    },
    [selectedResponseForAction, applyResponseTemplate, onRefresh]
  );

  const handleUploadClick = useCallback(() => {
    if (!objectId) {
      toast.error('No active encounter found. Please select a visit or admission first.');
      return;
    }
    if (!onUploadFile) {
      toast.error('Upload functionality is not available');
      return;
    }
    setUploadDialogOpen(true);
  }, [objectId, onUploadFile]);

  const handleDeleteFile = useCallback(
    async (fileId: number) => {
      const confirmed = window.confirm('Are you sure you want to delete this file?');
      if (!confirmed) return;

      try {
        if (onDeleteFile) {
          await onDeleteFile(fileId);
          toast.success('File deleted successfully');
          onRefreshFiles?.();
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete file');
      }
    },
    [onDeleteFile, onRefreshFiles]
  );

  const handleDownloadFile = useCallback(
    (file: FileAttachment) => {
      if (onDownloadFile) {
        onDownloadFile(file);
      } else {
        const link = document.createElement('a');
        link.href = file.file_url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [onDownloadFile]
  );

  const responsesByTemplate = useMemo(() => {
    return responses.reduce((acc, response) => {
      const templateId = response.template;
      if (!acc[templateId]) acc[templateId] = [];
      acc[templateId].push(response);
      return acc;
    }, {} as Record<number, TemplateResponse[]>);
  }, [responses]);

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Clinical Notes</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {responses.length} {responses.length === 1 ? 'note' : 'notes'} •{' '}
              {Object.keys(responsesByTemplate).length}{' '}
              {Object.keys(responsesByTemplate).length === 1 ? 'template' : 'templates'}
              {fileAttachments.length > 0 && ` • ${fileAttachments.length} ${fileAttachments.length === 1 ? 'file' : 'files'}`}
            </p>
          </div>
        </div>
        
        {/* Upload Button - Always visible and enabled */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleUploadClick}
          className="gap-2"
        >
          <Paperclip className="h-4 w-4" />
          <span className="hidden sm:inline">Upload File</span>
        </Button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto px-4">
        {isLoadingResponses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 p-3 border rounded-lg">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : responses.length === 0 && fileAttachments.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[300px] sm:min-h-[400px]">
            <div className="text-center space-y-4 sm:space-y-6 max-w-md px-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                  <div className="relative p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold">No Clinical Notes Yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {objectId
                    ? 'Start documenting by adding your first note or upload files'
                    : 'No active encounter found'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={() => onTemplateDrawerChange(true)}
                  size="default"
                  className="bg-primary hover:bg-primary/90"
                  disabled={!objectId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
                <Button
                  onClick={handleUploadClick}
                  variant="outline"
                  size="default"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 pb-4">
            {/* File Attachments Section */}
            {fileAttachments.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-px flex-1 bg-border w-12"></div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-full">
                      <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span className="font-semibold text-xs sm:text-sm">File Attachments</span>
                      <span className="text-xs text-muted-foreground">({fileAttachments.length})</span>
                    </div>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUploadClick}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {isLoadingFiles ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="space-y-2 p-3 border rounded-lg">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))
                  ) : (
                    fileAttachments.map((file) => (
                      <FileAttachmentCard
                        key={file.id}
                        file={file}
                        onDelete={handleDeleteFile}
                        onDownload={handleDownloadFile}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Clinical Notes Section */}
            {responses.length > 0 && (
              <>
                {Object.entries(responsesByTemplate).map(([templateId, templateResponses]) => {
                  const template = templates.find((t) => t.id === Number(templateId));
                  const sortedResponses = [...templateResponses].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  );

                  return (
                    <div key={templateId} className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-px flex-1 bg-border"></div>
                        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-full">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-semibold text-xs sm:text-sm">{template?.name || `Template ${templateId}`}</span>
                          <span className="text-xs text-muted-foreground">({sortedResponses.length})</span>
                        </div>
                        <div className="h-px flex-1 bg-border"></div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {sortedResponses.map((response) => (
                          <ResponseCard
                            key={response.id}
                            response={response}
                            templateName={template?.name}
                            onView={() => onViewResponse(response)}
                            onOpenForm={() => onViewResponse(response)}
                            onOpenCanvas={() => onOpenCanvasResponse(response)}
                            onSaveAsTemplate={() => handleSaveAsTemplate(response)}
                            onCopyFromTemplate={() => handleCopyFromTemplate(response)}
                            onDelete={() => handleDeleteResponse(response.id)}
                          />
                        ))}
                        
                        {/* Upload Card - Always visible and clickable */}
                        <div
                          onClick={handleUploadClick}
                          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors min-h-[200px] group"
                        >
                          <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Paperclip className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">Upload File</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Images or PDF
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Template Selection Drawer */}
      <TemplateSelectionDrawer
        open={templateDrawerOpen}
        onOpenChange={onTemplateDrawerChange}
        templates={templates}
        isLoading={isLoadingTemplates}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={onUploadFile!}
      />

      {/* Save as Template Dialog */}
      <Dialog open={saveAsTemplateDialog} onOpenChange={setSaveAsTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from this response that you can apply to other clinical notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="e.g., Routine Checkup Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <Label htmlFor="is-public" className="text-sm font-normal">
                Make this template available to all users
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSaveAsTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy from Template Dialog */}
      <Dialog open={copyFromTemplateDialog} onOpenChange={setCopyFromTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copy from Template</DialogTitle>
            <DialogDescription>
              Select a saved template to apply to this response. This will populate the fields with the template&apos;s
              values.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto py-4">
            {responseTemplatesData && responseTemplatesData.results.length > 0 ? (
              <div className="space-y-2">
                {responseTemplatesData.results.map((responseTemplate: ResponseTemplate) => (
                  <div
                    key={responseTemplate.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleConfirmCopyFromTemplate(responseTemplate.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{responseTemplate.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {responseTemplate.is_public ? 'Public' : 'Private'} • Used {responseTemplate.usage_count} times
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No templates available for this type of clinical note.</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyFromTemplateDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};