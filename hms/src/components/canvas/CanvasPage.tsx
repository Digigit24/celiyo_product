// src/components/canvas/CanvasPage.tsx
import React, { useRef, useState, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { useCanvasStore } from '@/lib/canvas-store';
import { Stroke } from '@/lib/canvas-db';
import { TemplateField, FieldType } from '@/types/opdTemplate.types';

interface CanvasPageProps {
  pageId: string;
  strokes: Stroke[];
  width: number;
  height: number;
  templateFields?: TemplateField[];
}

// Helper function to calculate field height based on field type
const getFieldHeight = (fieldType: FieldType): number => {
  const lineHeight = 32;

  // Textarea fields get 5 lines
  if (fieldType === 'textarea') {
    return lineHeight * 5;
  }

  // All other field types get 1 line
  return lineHeight;
};

// Helper function to draw template fields
const drawTemplateFields = (
  ctx: CanvasRenderingContext2D,
  fields: TemplateField[],
  canvasWidth: number,
  canvasHeight: number
) => {
  const leftMargin = 40;
  const labelWidth = 200;
  const rightMargin = 40;
  const writingAreaStartX = leftMargin + labelWidth + 20;
  const writingAreaEndX = canvasWidth - rightMargin;
  const lineHeight = 32;
  const topPadding = 60;
  const fieldSpacing = 24;

  let currentY = topPadding;

  fields.forEach((field, index) => {
    const fieldHeight = getFieldHeight(field.field_type);
    const numLines = Math.ceil(fieldHeight / lineHeight);

    // Draw field label
    ctx.fillStyle = '#374151';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';

    // Wrap label text if too long
    const maxLabelWidth = labelWidth - 10;
    let labelText = field.field_label;
    if (field.is_required) {
      labelText += ' *';
    }

    // Simple text wrapping
    const words = labelText.split(' ');
    let line = '';
    let labelY = currentY;

    words.forEach((word) => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLabelWidth && line !== '') {
        ctx.fillText(line.trim(), leftMargin, labelY);
        line = word + ' ';
        labelY += 18;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line.trim(), leftMargin, labelY);

    // Draw writing area lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;

    for (let i = 0; i < numLines; i++) {
      const lineY = currentY + (i * lineHeight) + lineHeight;
      ctx.beginPath();
      ctx.moveTo(writingAreaStartX, lineY);
      ctx.lineTo(writingAreaEndX, lineY);
      ctx.stroke();
    }

    // Draw vertical separator between label and writing area
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin + labelWidth, currentY);
    ctx.lineTo(leftMargin + labelWidth, currentY + fieldHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Move to next field position
    currentY += fieldHeight + fieldSpacing;
  });
};

export const CanvasPage: React.FC<CanvasPageProps> = ({
  pageId,
  strokes,
  width,
  height,
  templateFields = []
}) => {
  const { currentTool, currentColor, currentSize, saveStroke } = useCanvasStore();
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const isDrawing = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render all strokes to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Clear canvas completely
    ctx.clearRect(0, 0, width, height);

    // Draw template layer FIRST (bottom layer)
    ctx.globalCompositeOperation = 'source-over';

    if (templateFields && templateFields.length > 0) {
      // Draw template fields with labels and writing areas
      drawTemplateFields(ctx, templateFields, width, height);
    } else {
      // Fallback: Draw default grid if no template fields
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      const lineSpacing = 32;
      const startX = 96; // Matches padding in template layer

      // Draw horizontal grid lines
      for (let y = 0; y < height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw left margin line in red
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
    }

    // Draw saved strokes (excluding eraser strokes - they're handled as drawing operations)
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      const inputPoints = stroke.points.map(p => [p.x, p.y, p.pressure || 0.5] as [number, number, number]);
      const outlinePoints = getStroke(inputPoints, {
        size: stroke.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      });

      if (outlinePoints.length < 2) return;

      if (stroke.isEraser) {
        // Eraser: use destination-out to remove pixels
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
      } else {
        // Normal stroke
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = stroke.color;
      }

      ctx.beginPath();
      ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
      outlinePoints.forEach(point => ctx.lineTo(point[0], point[1]));
      ctx.closePath();
      ctx.fill();
    });

    // Draw current stroke being drawn
    if (currentStroke && currentStroke.points.length > 0) {
      const inputPoints = currentStroke.points.map(p => [p.x, p.y, p.pressure || 0.5] as [number, number, number]);
      const outlinePoints = getStroke(inputPoints, {
        size: currentStroke.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      });

      if (outlinePoints.length > 1) {
        if (currentStroke.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = currentStroke.color;
        }

        ctx.beginPath();
        ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
        outlinePoints.forEach(point => ctx.lineTo(point[0], point[1]));
        ctx.closePath();
        ctx.fill();
      }
    }

  }, [strokes, currentStroke, width, height, templateFields]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawing.current = true;

    const newStroke: Stroke = {
      points: [{ x, y, pressure: 0.5 }],
      color: currentTool === 'eraser' ? '#ffffff' : currentColor,
      size: currentSize,
      isEraser: currentTool === 'eraser'
    };
    setCurrentStroke(newStroke);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x, y, pressure: 0.5 }]
      };
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStroke && currentStroke.points.length > 1) {
      saveStroke(pageId, currentStroke);
    }
    setCurrentStroke(null);
  };

  return (
    <div
      className="bg-white shadow-md mx-auto mb-8 overflow-hidden relative"
      style={{ width, height }}
      data-testid={`page-${pageId}`}
    >
      {/* Page ID Label */}
      <div className="absolute top-12 right-12 text-xs text-gray-300 font-mono pointer-events-none select-none z-0">
        {pageId.slice(0, 8)}
      </div>

      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair"
        style={{ zIndex: 1 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid={`canvas-${pageId}`}
      />
    </div>
  );
};
