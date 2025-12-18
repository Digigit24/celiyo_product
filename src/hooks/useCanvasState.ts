// src/hooks/useCanvasState.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import type { ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types/types';

interface CanvasData {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
}

interface UseCanvasStateOptions {
  initialData?: CanvasData | null;
  onAutoSave?: (data: CanvasData) => Promise<void>;
  autoSaveDelay?: number;
}

export function useCanvasState(options: UseCanvasStateOptions = {}) {
  const { initialData, onAutoSave, autoSaveDelay = 3000 } = options;

  // Local canvas state - source of truth
  const [canvasData, setCanvasData] = useState<CanvasData | null>(initialData || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Refs to prevent stale closures and infinite loops
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingProgrammaticallyRef = useRef(false);
  const latestDataRef = useRef<CanvasData | null>(canvasData);

  // Keep ref in sync
  useEffect(() => {
    latestDataRef.current = canvasData;
  }, [canvasData]);

  // Handle canvas change from user interaction
  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    // Ignore programmatic updates
    if (isUpdatingProgrammaticallyRef.current) {
      return;
    }

    const newData: CanvasData = {
      elements,
      appState,
    };

    setCanvasData(newData);
    setHasUnsavedChanges(true);

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Schedule auto-save
    if (onAutoSave) {
      autoSaveTimerRef.current = setTimeout(() => {
        onAutoSave(newData).catch((error) => {
          console.error('Canvas auto-save error:', error);
        });
        setHasUnsavedChanges(false);
      }, autoSaveDelay);
    }
  }, [onAutoSave, autoSaveDelay]);

  // Handle ready callback
  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  // Manual save
  const save = useCallback(async () => {
    if (!latestDataRef.current) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (onAutoSave) {
      await onAutoSave(latestDataRef.current);
      setHasUnsavedChanges(false);
    }
  }, [onAutoSave]);

  // Load new data (when response changes)
  const loadData = useCallback((newData: CanvasData | null) => {
    isUpdatingProgrammaticallyRef.current = true;
    setCanvasData(newData);
    setHasUnsavedChanges(false);

    // Clear flag after React has processed the update
    setTimeout(() => {
      isUpdatingProgrammaticallyRef.current = false;
    }, 300);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    isUpdatingProgrammaticallyRef.current = true;
    setCanvasData(null);
    setHasUnsavedChanges(false);
    setIsReady(false);

    setTimeout(() => {
      isUpdatingProgrammaticallyRef.current = false;
    }, 100);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    canvasData,
    hasUnsavedChanges,
    isReady,
    handleChange,
    handleReady,
    save,
    loadData,
    reset,
  };
}
