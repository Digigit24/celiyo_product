// src/components/consultation/FullscreenA4Canvas.tsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement, AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface FullscreenA4CanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (elements: readonly ExcalidrawElement[], appState: AppState) => void;
  onReady?: () => void;
  onSave?: () => Promise<void>;
  initialData?: {
    elements: readonly ExcalidrawElement[];
    appState: Partial<AppState>;
  } | null;
  hasUnsavedChanges?: boolean;
  isReady?: boolean;
  isSaving?: boolean;
  templateImageUrl?: string; // URL to the consultation form template image
}

const FullscreenA4Canvas: React.FC<FullscreenA4CanvasProps> = ({
  open,
  onOpenChange,
  onChange,
  onReady,
  onSave,
  initialData,
  hasUnsavedChanges = false,
  isReady = false,
  isSaving = false,
  templateImageUrl,
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const hasNotifiedReadyRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Reset refs when dialog opens/closes
  useEffect(() => {
    if (open) {
      hasNotifiedReadyRef.current = false;
      isInitialLoadRef.current = true;
    }
  }, [open]);

  // Safety net: mark ready after a short delay
  useEffect(() => {
    if (!open) return;

    const fallbackTimer = setTimeout(() => {
      if (!hasNotifiedReadyRef.current && onReady) {
        hasNotifiedReadyRef.current = true;
        onReady();
      }
    }, 1200);
    return () => clearTimeout(fallbackTimer);
  }, [open, onReady]);

  // Notify parent when API is ready
  useEffect(() => {
    if (excalidrawAPI && onReady && !hasNotifiedReadyRef.current) {
      hasNotifiedReadyRef.current = true;
      onReady();
    }
  }, [excalidrawAPI, onReady]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    // Ignore the very first onChange event that fires when Excalidraw initializes
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    onChange(elements, appState);
  }, [onChange]);

  const handleExcalidrawRefCallback = useCallback((api: ExcalidrawImperativeAPI | null) => {
    if (api) {
      setExcalidrawAPI(api);
      if (onReady && !hasNotifiedReadyRef.current) {
        hasNotifiedReadyRef.current = true;
        onReady();
      }
    } else {
      hasNotifiedReadyRef.current = false;
      setExcalidrawAPI(null);
    }
  }, [onReady]);

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onOpenChange(false);
  };

  // Prepare initial data with smallest brush size and background image
  const enhancedInitialData = React.useMemo(() => {
    const baseData = initialData || { elements: [], appState: {} };

    // If template image URL is provided, add it as a background image element
    const elements = [...baseData.elements];

    // Add template image as the first element if provided
    if (templateImageUrl && elements.length === 0) {
      // Note: Excalidraw doesn't directly support background images
      // We'll handle this with CSS background instead
    }

    return {
      elements,
      appState: {
        ...baseData.appState,
        currentItemStrokeWidth: 1, // Set smallest brush size
        viewBackgroundColor: '#ffffff', // White background
      },
    };
  }, [initialData, templateImageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-screen p-0 m-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Consultation Canvas (A4)</h2>
            <div className="flex items-center gap-2">
              {!isReady && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Initializing...
                </span>
              )}
              {isReady && hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
                  Auto-saving...
                </span>
              )}
              {isReady && !hasUnsavedChanges && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                  Saved
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSave && (
              <Button onClick={handleSave} disabled={isSaving || !isReady} size="sm">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Now
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Canvas Container */}
        <div className="w-full h-full overflow-y-auto overflow-x-hidden pt-16 pb-8">
          <div className="min-h-full flex items-start justify-center p-8">
            {/* A4 Canvas Container - 794px x 1123px at 96 DPI, scaled up for better quality */}
            <div
              ref={canvasContainerRef}
              className="relative bg-white shadow-2xl"
              style={{
                width: '210mm',  // A4 width
                minHeight: '297mm', // A4 height
                aspectRatio: '210 / 297',
              }}
            >
              {/* Background Template Image */}
              {templateImageUrl && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage: `url(${templateImageUrl})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center top',
                    opacity: 0.3, // Make template semi-transparent so drawings are visible
                  }}
                />
              )}

              {/* Excalidraw Canvas */}
              <div className="relative z-10 w-full h-full" style={{ minHeight: '297mm' }}>
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
                      toggleTheme: false, // Disable theme toggle to keep white background
                      clearCanvas: true,
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenA4Canvas;
