// src/pages/opd-production/ConsultationCanvas.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCanvasStore } from '@/lib/canvas-store';
import { CanvasPage } from '@/components/canvas/CanvasPage';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { Loader2 } from 'lucide-react';
import { opdTemplateService } from '@/services/opdTemplate.service';
import { Template, TemplateField } from '@/types/opdTemplate.types';
import { toast } from 'sonner';

export const ConsultationCanvas: React.FC = () => {
  const { visitId, responseId } = useParams<{ visitId: string; responseId: string }>();
  const {
    pages,
    loadOrCreateDocumentByResponse,
    isLoading
  } = useCanvasStore();

  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  useEffect(() => {
    if (visitId && responseId) {
      loadOrCreateDocumentByResponse(parseInt(visitId), parseInt(responseId));
      loadTemplateFields(parseInt(responseId));
    }
  }, [visitId, responseId, loadOrCreateDocumentByResponse]);

  const loadTemplateFields = async (respId: number) => {
    setIsLoadingTemplate(true);
    try {
      // Fetch template response to get template ID
      const templateResponse = await opdTemplateService.getTemplateResponse(respId);

      // Fetch template details with fields
      const template = await opdTemplateService.getTemplate(templateResponse.template);

      if (template.fields) {
        // Sort fields by display_order
        const sortedFields = [...template.fields].sort((a, b) => a.display_order - b.display_order);
        setTemplateFields(sortedFields);
      }
    } catch (error: any) {
      console.error('Failed to load template fields:', error);
      toast.error('Failed to load template fields');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  if (isLoading || isLoadingTemplate || !visitId || !responseId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sticky Toolbar */}
      <CanvasToolbar visitId={visitId} />

      {/* Full Width Pages */}
      <div className="w-full py-12">
        <div className="w-full flex flex-col gap-8 items-center">
          {pages.map((page) => (
            <CanvasPage
              key={page.id}
              pageId={page.id}
              strokes={page.strokes}
              width={794}
              height={1123}
              templateFields={templateFields}
            />
          ))}

          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            End of Document
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationCanvas;
