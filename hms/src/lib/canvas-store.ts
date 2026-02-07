// src/lib/canvas-store.ts
import { create } from 'zustand';
import { canvasDb, CanvasPage, Stroke } from './canvas-db';
import { nanoid } from 'nanoid';

type ToolType = 'pen' | 'eraser';

interface CanvasState {
  // UI State
  currentTool: ToolType;
  currentColor: string;
  currentSize: number;

  // Document State
  currentDocumentId: string | null;
  pages: CanvasPage[];
  isLoading: boolean;

  // Actions
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;

  // DB Actions
  createDocument: (visitId: number, responseId: number, name: string) => Promise<string>;
  loadDocument: (id: string) => Promise<void>;
  loadOrCreateDocumentByResponse: (visitId: number, responseId: number) => Promise<string>;
  addPage: () => Promise<void>;
  saveStroke: (pageId: string, stroke: Stroke) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  exportJSON: () => Promise<string>;
  clearAllData: () => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  currentTool: 'pen',
  currentColor: '#000000',
  currentSize: 3,
  currentDocumentId: null,
  pages: [],
  isLoading: false,

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  setSize: (size) => set({ currentSize: size }),

  createDocument: async (visitId, responseId, name) => {
    const id = nanoid();
    const doc = {
      id,
      visitId,
      responseId,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await canvasDb.documents.add(doc);

    // Create first page
    const pageId = nanoid();
    await canvasDb.pages.add({
      id: pageId,
      documentId: id,
      order: 0,
      strokes: [],
    });

    set({ currentDocumentId: id });
    await get().loadDocument(id);
    return id;
  },

  loadDocument: async (id) => {
    set({ isLoading: true });
    try {
      const pages = await canvasDb.pages
        .where('documentId')
        .equals(id)
        .sortBy('order');
      set({ pages, currentDocumentId: id });
    } finally {
      set({ isLoading: false });
    }
  },

  loadOrCreateDocumentByResponse: async (visitId, responseId) => {
    // Try to find existing document for this response
    const existingDoc = await canvasDb.documents
      .where('responseId')
      .equals(responseId)
      .first();

    if (existingDoc) {
      await get().loadDocument(existingDoc.id);
      return existingDoc.id;
    }

    // Create new document
    return await get().createDocument(visitId, responseId, `Canvas - Visit ${visitId}`);
  },

  addPage: async () => {
    const { currentDocumentId, pages } = get();
    if (!currentDocumentId) return;

    const newPage: CanvasPage = {
      id: nanoid(),
      documentId: currentDocumentId,
      order: pages.length,
      strokes: [],
    };

    await canvasDb.pages.add(newPage);
    await get().loadDocument(currentDocumentId);
  },

  saveStroke: async (pageId, stroke) => {
    const page = await canvasDb.pages.get(pageId);
    if (!page) return;

    const updatedStrokes = [...page.strokes, stroke];

    // Optimistic update
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, strokes: updatedStrokes } : p
      )
    }));

    await canvasDb.pages.update(pageId, { strokes: updatedStrokes });
    await canvasDb.documents.update(page.documentId, { updatedAt: new Date() });
  },

  deletePage: async (pageId) => {
    const { currentDocumentId, pages } = get();
    if (!currentDocumentId || pages.length <= 1) return;

    await canvasDb.pages.delete(pageId);
    await get().loadDocument(currentDocumentId);
  },

  exportJSON: async () => {
    const { currentDocumentId } = get();
    if (!currentDocumentId) return '';

    const doc = await canvasDb.documents.get(currentDocumentId);
    const pages = await canvasDb.pages
      .where('documentId')
      .equals(currentDocumentId)
      .toArray();

    const exportData = {
      document: doc,
      pages: pages,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  },

  clearAllData: async () => {
    await canvasDb.documents.clear();
    await canvasDb.pages.clear();
    set({ currentDocumentId: null, pages: [] });
  },
}));
