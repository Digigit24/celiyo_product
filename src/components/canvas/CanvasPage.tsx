// src/components/canvas/CanvasPage.tsx
import React, { useRef, useState, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { useCanvasStore } from '@/lib/canvas-store';
import { Stroke } from '@/lib/canvas-db';

interface CanvasPageProps {
  pageId: string;
  strokes: Stroke[];
  width: number;
  height: number;
}

export const CanvasPage: React.FC<CanvasPageProps> = ({ pageId, strokes, width, height }) => {
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

    // Draw template grid FIRST (bottom layer)
    ctx.globalCompositeOperation = 'source-over';
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

  }, [strokes, currentStroke, width, height]);

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
