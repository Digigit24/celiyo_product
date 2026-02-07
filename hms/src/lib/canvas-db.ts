// src/lib/canvas-db.ts
import Dexie, { Table } from 'dexie';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  size: number;
  isEraser?: boolean;
}

export interface CanvasPage {
  id: string;
  documentId: string;
  order: number;
  strokes: Stroke[];
}

export interface CanvasDocument {
  id: string;
  visitId: number; // OPD visit ID
  responseId: number; // Template response ID
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

class CanvasDB extends Dexie {
  documents!: Table<CanvasDocument>;
  pages!: Table<CanvasPage>;

  constructor() {
    super('CanvasDB');
    this.version(1).stores({
      documents: 'id, visitId, responseId, updatedAt',
      pages: 'id, documentId, order',
    });
  }
}

export const canvasDb = new CanvasDB();
