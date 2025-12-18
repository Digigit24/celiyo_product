// src/components/canvas/CanvasToolbar.tsx
import React, { useState, useRef } from 'react';
import { useCanvasStore } from '@/lib/canvas-store';
import { Pen, Eraser, Plus, Download, Loader2, Palette, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PDFDocument, rgb } from 'pdf-lib';
import { getStroke } from 'perfect-freehand';
import { hexToRgb } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CanvasToolbarProps {
  visitId: string;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ visitId }) => {
  const navigate = useNavigate();
  const {
    currentTool,
    setTool,
    currentSize,
    setSize,
    currentColor,
    setColor,
    addPage,
    pages,
    currentDocumentId,
    exportJSON,
  } = useCanvasStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    navigate(`/opd/consultation/${visitId}`);
  };

  const handleExportPDF = async () => {
    if (!currentDocumentId) return;
    setIsExporting(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const page of pages) {
        const pdfPage = pdfDoc.addPage([794, 1123]);
        const { width, height } = pdfPage.getSize();

        // Draw template layer (grid background)
        const lineSpacing = 32;
        for (let y = 0; y < height; y += lineSpacing) {
          pdfPage.drawLine({
            start: { x: 96, y: height - y },
            end: { x: width, y: height - y },
            thickness: 0.5,
            color: rgb(0.9, 0.9, 0.9),
          });
        }

        // Draw red margin line
        pdfPage.drawLine({
          start: { x: 96, y: 0 },
          end: { x: 96, y: height },
          thickness: 1,
          color: rgb(1, 0.7, 0.7),
        });

        // Draw strokes
        for (const stroke of page.strokes) {
          if (stroke.isEraser) continue;
          if (stroke.points.length < 2) continue;

          // Convert points - flip Y coordinate for PDF
          const points = stroke.points.map(p => [
            p.x,
            height - p.y,
            p.pressure || 0.5
          ] as [number, number, number]);

          // Generate smooth stroke
          const outlinePoints = getStroke(points, {
            size: stroke.size,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            simulatePressure: true,
          });

          if (outlinePoints.length < 2) continue;

          // Convert hex color to RGB
          const rgbColor = hexToRgb(stroke.color);
          if (!rgbColor) continue;

          // Draw filled path using lines connecting the outline points
          for (let i = 0; i < outlinePoints.length - 1; i++) {
            pdfPage.drawLine({
              start: { x: outlinePoints[i][0], y: outlinePoints[i][1] },
              end: { x: outlinePoints[i + 1][0], y: outlinePoints[i + 1][1] },
              thickness: stroke.size / 2,
              color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canvas-visit-${visitId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed - check console for details');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const json = await exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canvas-visit-${visitId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('JSON export failed', e);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex justify-between items-center py-4 px-6 bg-white border-b shadow-sm">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Consultation
      </Button>

      {/* Center Toolbar */}
      <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
        {/* Tools Section */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1">
          <Button
            variant={currentTool === 'pen' ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool('pen')}
            className={`rounded-md transition-all ${currentTool === 'pen' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            title="Pen Tool"
          >
            <Pen className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === 'eraser' ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool('eraser')}
            className={`rounded-md transition-all ${currentTool === 'eraser' ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            title="Eraser Tool"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Size Slider */}
        <div className="flex items-center gap-2">
          <Slider
            orientation="horizontal"
            value={[currentSize]}
            onValueChange={([v]) => setSize(v)}
            max={20}
            min={1}
            step={1}
            className="w-20"
          />
          <span className="text-xs font-semibold text-gray-700 w-5">{currentSize}</span>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded-lg transition-all"
            title="Pick Color"
          >
            <Palette className="w-4 h-4 text-gray-600" />
            <div
              className="w-5 h-5 rounded border-2 border-gray-400 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg p-3 shadow-xl z-50">
              <input
                ref={colorInputRef}
                type="color"
                value={currentColor}
                onChange={(e) => {
                  setColor(e.target.value);
                }}
                className="w-14 h-14 cursor-pointer rounded border-2 border-gray-300"
              />
              <div className="mt-3 grid grid-cols-5 gap-2">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setColor(color);
                      setShowColorPicker(false);
                    }}
                    className="w-5 h-5 rounded border-2 border-gray-400 hover:border-gray-700 transition-all"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Actions Section */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={addPage}
            title="Add New Page"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-all"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            title="Export as PDF"
            disabled={isExporting}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportJSON}
            title="Export as JSON"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-all"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right side placeholder */}
      <div className="w-32" />
    </div>
  );
};
