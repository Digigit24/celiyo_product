// src/components/consultation/ExcalidrawWrapper.tsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement, AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExcalidrawWrapperProps {
  onChange: (elements: readonly ExcalidrawElement[], appState: AppState) => void;
  onReady?: () => void;
  initialData?: {
    elements: readonly ExcalidrawElement[];
    appState: Partial<AppState>;
  } | null;
  isReadOnly?: boolean;
}

const ExcalidrawWrapper = React.memo<ExcalidrawWrapperProps>(({ onChange, onReady, initialData, isReadOnly = false }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasNotifiedReadyRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Safety net: in case the ref callback doesn't fire (strict mode quirks), mark ready after a short delay
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!hasNotifiedReadyRef.current && onReady) {
        hasNotifiedReadyRef.current = true;
        onReady();
      }
    }, 1200);
    return () => clearTimeout(fallbackTimer);
  }, [onReady]);

  // Notify parent when API is ready
  useEffect(() => {
    if (excalidrawAPI && onReady && !hasNotifiedReadyRef.current) {
      hasNotifiedReadyRef.current = true;
      onReady();
    }
  }, [excalidrawAPI, onReady]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    // Ignore the very first onChange event that fires when Excalidraw initializes
    // This prevents clearing the canvas during initialization
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

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  // Prepare initial data with smallest brush size
  const enhancedInitialData = React.useMemo(() => {
    const baseData = initialData || { elements: [], appState: {} };
    return {
      ...baseData,
      appState: {
        ...baseData.appState,
        currentItemStrokeWidth: 1, // Set smallest brush size
      },
    };
  }, [initialData]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full border rounded-md ${
        isFullscreen ? 'h-screen' : 'h-96 md:h-[500px]'
      }`}
    >
      {/* Fullscreen Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>

      <Excalidraw
        ref={handleExcalidrawRefCallback}
        onChange={handleChange}
        initialData={enhancedInitialData}
        isCollaborating={false}
        viewModeEnabled={isReadOnly}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: {},
            toggleTheme: true,
            clearCanvas: !isReadOnly,
          },
        }}
      />
    </div>
  );
});

ExcalidrawWrapper.displayName = 'ExcalidrawWrapper';

export default ExcalidrawWrapper;
