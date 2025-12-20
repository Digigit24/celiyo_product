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
import { Plus, LayoutGrid, FileText } from 'lucide-react';

import { OpdVisit } from '@/types/opdVisit.types';
import { TemplateResponse, Template, ResponseTemplate } from '@/types/opdTemplate.types';

import { ResponseCard } from './ResponseCard';
import { TemplateSelectionDrawer } from './TemplateSelectionDrawer';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface ConsultationBoardProps {
  encounterType: 'visit' | 'admission';
  objectId: number | null;
  visit: OpdVisit;
  responses: TemplateResponse[];
  templates: Template[];
  isLoadingResponses: boolean;
  isLoadingTemplates: boolean;
  onViewResponse: (response: TemplateResponse) => void;
  onRefresh: () => void;
}

export const ConsultationBoard: React.FC<ConsultationBoardProps> = ({
  encounterType,
  objectId,
  visit,
  responses,
  templates,
  isLoadingResponses,
  isLoadingTemplates,
  onViewResponse,
  onRefresh,
}) => {
  const navigate = useNavigate();

  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [saveAsTemplateDialog, setSaveAsTemplateDialog] = useState(false);
  const [copyFromTemplateDialog, setCopyFromTemplateDialog] = useState(false);

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

  // Fetch response templates for the current template type
  const { data: responseTemplatesData } = useResponseTemplates({
    template: selectedResponseForAction?.template,
  });

  // NEW: navigate to canvas route
  const onOpenCanvasResponse = useCallback(
    (response: TemplateResponse) => {
      // Canvas route expects visitId and responseId
      // For OPD board, visit.id is always available
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

  // Group responses by template
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
      {/* Header with Action Button */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Clinical Notes Board</h2>
            <p className="text-sm text-muted-foreground">
              {responses.length} {responses.length === 1 ? 'note' : 'notes'} •{' '}
              {Object.keys(responsesByTemplate).length}{' '}
              {Object.keys(responsesByTemplate).length === 1 ? 'template' : 'templates'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setTemplateDrawerOpen(true)}
          className="bg-primary hover:bg-primary/90"
          disabled={!objectId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Notes
        </Button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto px-4">
        {isLoadingResponses ? (
          // Loading State
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : responses.length === 0 ? (
          // Empty State
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-6 max-w-md">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                  <div className="relative p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full">
                    <FileText className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">No Clinical Notes Yet</h3>
                <p className="text-muted-foreground">
                  {objectId
                    ? 'Start documenting this consultation by adding your first clinical note. Choose from templates like OPD Notes, IPD Notes, or Discharge Summaries.'
                    : 'No active admission found for this patient. You cannot add IPD notes.'}
                </p>
              </div>
              <Button
                onClick={() => setTemplateDrawerOpen(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
                disabled={!objectId}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add First Note
              </Button>
            </div>
          </div>
        ) : (
          // Grid View of Response Cards
          <div className="space-y-8">
            {Object.entries(responsesByTemplate).map(([templateId, templateResponses]) => {
              const template = templates.find((t) => t.id === Number(templateId));
              const sortedResponses = [...templateResponses].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );

              return (
                <div key={templateId} className="space-y-4">
                  {/* Template Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border"></div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{template?.name || `Template ${templateId}`}</span>
                      <span className="text-xs text-muted-foreground">({sortedResponses.length})</span>
                    </div>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>

                  {/* Response Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Selection Drawer */}
      <TemplateSelectionDrawer
        open={templateDrawerOpen}
        onOpenChange={setTemplateDrawerOpen}
        templates={templates}
        isLoading={isLoadingTemplates}
        onSelectTemplate={handleSelectTemplate}
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
