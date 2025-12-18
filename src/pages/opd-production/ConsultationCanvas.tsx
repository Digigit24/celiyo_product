// src/pages/opd-production/ConsultationCanvas.tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCanvasStore } from '@/lib/canvas-store';
import { CanvasPage } from '@/components/canvas/CanvasPage';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { Loader2 } from 'lucide-react';

export const ConsultationCanvas: React.FC = () => {
  const { visitId, responseId } = useParams<{ visitId: string; responseId: string }>();
  const {
    pages,
    loadOrCreateDocumentByResponse,
    isLoading
  } = useCanvasStore();

  useEffect(() => {
    if (visitId && responseId) {
      loadOrCreateDocumentByResponse(parseInt(visitId), parseInt(responseId));
    }
  }, [visitId, responseId, loadOrCreateDocumentByResponse]);

  if (isLoading || !visitId || !responseId) {
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
