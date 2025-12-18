// src/pages/opd-production/ConsultationCanvas.tsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOpdVisit } from '@/hooks/useOpdVisit';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement, AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { useCanvasState } from '@/hooks/useCanvasState';
import { useOPDTemplate } from '@/hooks/useOPDTemplate';
import { toast } from 'sonner';

type CanvasData = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
};

const sanitizeCanvasData = (data: CanvasData | null): CanvasData | null => {
  if (!data) return null;

  const elements = Array.isArray(data.elements) ? [...data.elements] : [];
  const appState: Partial<AppState> = { ...(data.appState || {}) };

  // Remove/normalize non-serializable or incompatible fields
  if ((appState as any).collaborators && !((appState as any).collaborators instanceof Map)) {
    delete (appState as any).collaborators;
  }

  return { elements, appState };
};

export const ConsultationCanvas: React.FC = () => {
  const { visitId, responseId } = useParams<{ visitId: string; responseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { useOpdVisitById } = useOpdVisit();
  const { useTemplateResponse, updateTemplateResponse, useTemplate } = useOPDTemplate();

  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialCanvasData, setInitialCanvasData] = useState<CanvasData | null | undefined>(undefined);
  const hasNotifiedReadyRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const loadedResponseIdRef = useRef<number | null>(null);

  // Get visit data
  const { data: visit, isLoading: isLoadingVisit } = useOpdVisitById(visitId ? parseInt(visitId) : null);

  // Get response data
  const { data: responseData, isLoading: isLoadingResponse } = useTemplateResponse(
    responseId ? parseInt(responseId) : null
  );

  // Get template data for rendering form background
  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(
    responseData?.template || null
  );
  const fieldsData = useMemo(() => templateData?.fields || [], [templateData]);

  // Handle back navigation
  const handleBack = () => {
    if (canvasState.hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    navigate(`/opd/consultation/${visitId}`);
  };

  // Canvas auto-save handler
  const handleCanvasAutoSave = useCallback(async (canvasData: { elements: readonly ExcalidrawElement[]; appState: Partial<AppState> }) => {
    if (!responseData) return;

    const canvasField = fieldsData.find(f => f.field_type === 'json' || f.field_type === 'canvas');
    if (!canvasField) return;

    try {
      const payload = {
        field_responses: [
          {
            field: canvasField.id,
            full_canvas_json: sanitizeCanvasData(canvasData),
          }
        ],
      };

      await updateTemplateResponse(responseData.id, payload);
    } catch (error) {
      console.error('Canvas auto-save failed:', error);
      throw error;
    }
  }, [responseData, fieldsData, updateTemplateResponse]);

  const canvasState = useCanvasState({
    onAutoSave: handleCanvasAutoSave,
    autoSaveDelay: 3000,
  });

  // Load canvas data when response is loaded
  useEffect(() => {
    if (!responseData || fieldsData.length === 0 || isLoadingTemplate) {
      return;
    }

    const isNewResponse = loadedResponseIdRef.current !== responseData.id;

    if (isNewResponse) {
      loadedResponseIdRef.current = responseData.id;

      // Find canvas field response
      const canvasFieldResponse = responseData.field_responses?.find(fr => {
        const field = fieldsData.find(f => f.id === fr.field);
        return field?.field_type === 'json' || field?.field_type === 'canvas';
      });

      const fullCanvasJson = canvasFieldResponse?.full_canvas_json;
      const hasCanvasData = fullCanvasJson &&
                           typeof fullCanvasJson === 'object' &&
                           fullCanvasJson.elements &&
                           Array.isArray(fullCanvasJson.elements) &&
                           fullCanvasJson.elements.length > 0;

      if (hasCanvasData) {
        const nextCanvasData = sanitizeCanvasData(fullCanvasJson);
        setInitialCanvasData(nextCanvasData);
        canvasState.loadData(nextCanvasData);
      } else {
        setInitialCanvasData(null);
        canvasState.loadData(null);
      }
    }
  }, [responseData, fieldsData, isLoadingTemplate]);

  // Safety net: mark ready after a short delay
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNotifiedReadyRef.current && canvasState.handleReady) {
        hasNotifiedReadyRef.current = true;
        canvasState.handleReady();
      }
    }, 1200);
    return () => clearTimeout(fallbackTimer);
  }, [canvasState.handleReady]);

  // Notify parent when API is ready
  useEffect(() => {
    if (excalidrawAPI && canvasState.handleReady && !hasNotifiedReadyRef.current) {
      hasNotifiedReadyRef.current = true;
      canvasState.handleReady();
    }
  }, [excalidrawAPI, canvasState.handleReady]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    // Ignore the very first onChange event that fires when Excalidraw initializes
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    canvasState.handleChange(elements, appState);
  }, [canvasState]);

  const handleExcalidrawRefCallback = useCallback((api: ExcalidrawImperativeAPI | null) => {
    if (api) {
      setExcalidrawAPI(api);
      if (canvasState.handleReady && !hasNotifiedReadyRef.current) {
        hasNotifiedReadyRef.current = true;
        canvasState.handleReady();
      }
    } else {
      hasNotifiedReadyRef.current = false;
      setExcalidrawAPI(null);
    }
  }, [canvasState.handleReady]);

  // Manual save canvas
  const handleSaveCanvas = async () => {
    if (!responseData) {
      toast.error('No active response to save.');
      return;
    }

    setIsSaving(true);
    try {
      await canvasState.save();
      toast.success('Canvas saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save canvas.');
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare initial data with smallest brush size
  const enhancedInitialData = React.useMemo(() => {
    const baseData = initialCanvasData || { elements: [], appState: {} };
    return {
      ...baseData,
      appState: {
        ...baseData.appState,
        currentItemStrokeWidth: 1, // Set smallest brush size
        viewBackgroundColor: '#ffffff', // White background
      },
    };
  }, [initialCanvasData]);

  // Format visit date
  const formatVisitDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  if (isLoadingVisit || isLoadingResponse) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!visit || !responseData) {
    return (
      <div className="p-6 max-w-8xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Failed to load consultation data</p>
            <Button onClick={handleBack} className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patient = visit.patient_details;

  return (
    <div className="p-6 max-w-8xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Consultation Canvas (A4)</h1>
            <p className="text-muted-foreground text-sm">
              {patient?.name} • Visit: {visit.visit_number} • {formatVisitDate(visit.visit_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {!canvasState.isReady && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Initializing...
              </span>
            )}
            {canvasState.isReady && canvasState.hasUnsavedChanges && (
              <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
                Auto-saving...
              </span>
            )}
            {canvasState.isReady && !canvasState.hasUnsavedChanges && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                Saved
              </span>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={handleSaveCanvas} disabled={isSaving || !canvasState.isReady} size="sm">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Now
          </Button>

          {/* Close Button */}
          <Button variant="outline" size="sm" onClick={handleBack}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      {/* Canvas Area - Vertically Scrollable with A4 Canvas */}
      <div className="w-full overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex items-start justify-center py-8">
          {/* A4 Canvas Container */}
          <div
            className="relative bg-white shadow-2xl"
            style={{
              width: '210mm',  // A4 width
              minHeight: '297mm', // A4 height
            }}
          >
            {/* Template Background - Render consultation form fields */}
            <div className="absolute inset-0 pointer-events-none z-0 p-8 text-sm">
              {/* DPU Header */}
              <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" /> {/* Logo placeholder */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-red-700">DPU</h1>
                    <p className="text-base font-semibold">डॉ. डी. वाय. पाटील कॉलेज ऑफ आयुर्वेद</p>
                    <p className="text-sm">रुज्णालय व संशोधन केंद्र</p>
                    <p className="text-xs">पिंपरी, पुणे - ४११०१८</p>
                  </div>
                  <div className="w-16 h-16 bg-gray-200 rounded-full" /> {/* Logo placeholder */}
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-4 text-xs">
                <p><span className="font-semibold">Patient:</span> {patient?.name || 'N/A'}</p>
                <p><span className="font-semibold">UHID:</span> {patient?.patient_id || 'N/A'}</p>
                <p><span className="font-semibold">OPD No:</span> {visit.visit_number || 'N/A'}</p>
                <p><span className="font-semibold">Age:</span> {patient?.age || 'N/A'} | <span className="font-semibold">Gender:</span> {patient?.gender || 'N/A'}</p>
                <p><span className="font-semibold">Consultant:</span> Dr. {visit.doctor_details?.full_name || 'N/A'}</p>
                <p><span className="font-semibold">Date:</span> {formatVisitDate(visit.visit_date)}</p>
              </div>

              {/* Form Section */}
              <div className="border-t-2 border-gray-400 pt-4">
                <h2 className="text-center font-bold mb-4 text-base">* कायाचिकित्सा विभाग *</h2>

                {/* Chief Complaints */}
                <div className="mb-4">
                  <p className="font-semibold underline">Chief Complaints (वैदना विशेष) :</p>
                  <div className="border-b border-gray-300 h-12 mt-1"></div>
                </div>

                {/* Past History */}
                <div className="mb-4">
                  <p className="font-semibold">Past History (पूर्वाग्नानी वृतांत) :</p>
                  <div className="border-b border-gray-300 h-10 mt-1"></div>
                </div>

                {/* Family History */}
                <div className="mb-4">
                  <p className="font-semibold">Family History (कुल वृतांत) :</p>
                  <div className="border-b border-gray-300 h-10 mt-1"></div>
                </div>

                {/* Personal History */}
                <div className="mb-4">
                  <p className="font-semibold">Personal History (वैयक्तिक वृतांत) :</p>
                  <div className="border-b border-gray-300 h-10 mt-1"></div>
                </div>

                {/* Gynecological History */}
                <div className="mb-4">
                  <p className="font-semibold">Gynecological History (स्त्रीरोग वृतांत) :</p>
                  <div className="border-b border-gray-300 h-8 mt-1"></div>
                </div>

                {/* Obstetric History */}
                <div className="mb-4">
                  <p className="font-semibold">Obstetric History (प्रसुति वृतांत) :</p>
                  <div className="border-b border-gray-300 h-8 mt-1"></div>
                </div>

                {/* Occupation History */}
                <div className="mb-4">
                  <p className="font-semibold">Occupation History (व्यवसाय वृतांत) :</p>
                  <div className="border-b border-gray-300 h-8 mt-1"></div>
                </div>
              </div>
            </div>

            {/* Excalidraw Canvas */}
            <div className="relative z-10 w-full" style={{ height: '297mm' }}>
              {initialCanvasData !== undefined ? (
                <Excalidraw
                  ref={handleExcalidrawRefCallback}
                  onChange={handleChange}
                  initialData={enhancedInitialData}
                  isCollaborating={false}
                  viewModeEnabled={false}
                  UIOptions={{
                    canvasActions: {
                      saveToActiveFile: false,
                      loadScene: false,
                      export: {},
                      toggleTheme: false,
                      clearCanvas: true,
                    },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading canvas...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
