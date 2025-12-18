// src/components/consultation/ExcalidrawWrapper.tsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawElement, AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

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
  const hasNotifiedReadyRef = useRef(false);
  const isInitialLoadRef = useRef(true);

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


  return (
    <div className="w-full h-96 md:h-[500px] border rounded-md">
      <Excalidraw
        ref={handleExcalidrawRefCallback}
        onChange={handleChange}
        initialData={initialData || undefined}
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
