'use client';

import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';

interface OCRBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
  confidence: number;
  page?: number;
  field_name?: string;
}

interface DocumentViewerCanvasProps {
  imageUrl: string;
  processedImageUrl?: string;
  ocrBoxes: OCRBox[];
  selectedField?: string | null;
  onBoxSelect?: (box: OCRBox) => void;
  width?: number;
  height?: number;
}

export default function DocumentViewerCanvas({
  imageUrl,
  processedImageUrl,
  ocrBoxes = [],
  selectedField,
  onBoxSelect,
  width = 600,
  height = 800
}: DocumentViewerCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [showProcessed, setShowProcessed] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [hoveredBox, setHoveredBox] = useState<OCRBox | null>(null);

  const activeImage = (showProcessed && processedImageUrl) ? processedImageUrl : imageUrl;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col h-full bg-[#1E2822] rounded-3xl overflow-hidden border border-[#E6E2DA] shadow-[0_20px_40px_rgba(45,58,49,0.12)]">
      {/* Controls Bar */}
      <div className="h-14 bg-[#2D3A31] px-5 flex items-center justify-between border-b border-[#3D5544] text-[#E1E8E3] select-none">
        <div className="flex items-center gap-2.5">
          <span className="font-serif font-bold text-xs text-[#F9F8F4] tracking-wide">Document Scan Canvas</span>
          <span className="text-[10px] bg-[#1E2822] text-[#DCCFC2] font-mono px-2.5 py-0.5 rounded-full border border-[#3D5544]">
            {ocrBoxes.length} OCR Regions
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Processed Threshold View */}
          {processedImageUrl && (
            <button
              onClick={() => setShowProcessed(!showProcessed)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                showProcessed ? 'bg-[#8C9A84] text-[#1E2822] font-semibold shadow-sm' : 'bg-[#1E2822] text-[#C2D1C6] hover:bg-[#3D5544]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showProcessed ? 'CLAHE Enhanced' : 'Raw Scan'}</span>
            </button>
          )}

          {/* Toggle Boxes */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              showBoxes ? 'bg-[#8C9A84]/30 text-[#DCCFC2] border border-[#8C9A84]/50' : 'bg-[#1E2822] text-[#8C9A84]'
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Bounding Boxes</span>
          </button>

          <div className="h-4 w-px bg-[#3D5544] mx-1" />

          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-[#3D5544] rounded-full text-[#C2D1C6] transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[#DCCFC2] w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-[#3D5544] rounded-full text-[#C2D1C6] transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 hover:bg-[#3D5544] rounded-full text-[#C2D1C6] text-xs font-mono"
            title="Reset Zoom"
          >
            100%
          </button>
        </div>
      </div>

      {/* Main Zoomable Canvas Area */}
      <div className="flex-1 relative overflow-auto bg-[#131A16] flex items-center justify-center p-6">
        <div
          className="relative transition-transform duration-100 ease-out origin-top shadow-[0_25px_50px_rgba(0,0,0,0.5)] rounded-md bg-white overflow-hidden"
          style={{
            transform: `scale(${zoom})`,
            width: `${width}px`,
            minHeight: `${height}px`,
          }}
        >
          {/* Document Image */}
          <img
            src={activeImage}
            alt="Cadastral Document Scan"
            className="w-full h-auto object-contain select-none pointer-events-none"
            onError={(e) => {
              (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect fill="%23f9f8f4" width="600" height="800"/><text fill="%232d3a31" font-size="18" font-family="serif" x="50%" y="50%" text-anchor="middle">TAMIL NADU LAND RECORD DOCUMENT</text></svg>';
            }}
          />

          {/* OCR Bounding Boxes Layer */}
          {showBoxes && (
            <div className="absolute inset-0 pointer-events-auto">
              {ocrBoxes.map((box, index) => {
                const isSelected = selectedField && (box.field_name === selectedField || box.text.toLowerCase().includes(selectedField.toLowerCase()));
                const isHighConfidence = box.confidence >= 90;
                const isMediumConfidence = box.confidence >= 75 && box.confidence < 90;

                const boxWidth = Math.max(box.x1 - box.x0, 20);
                const boxHeight = Math.max(box.y1 - box.y0, 15);

                return (
                  <div
                    key={index}
                    onClick={() => onBoxSelect?.(box)}
                    onMouseEnter={() => setHoveredBox(box)}
                    onMouseLeave={() => setHoveredBox(null)}
                    style={{
                      left: `${box.x0}px`,
                      top: `${box.y0}px`,
                      width: `${boxWidth}px`,
                      height: `${boxHeight}px`,
                    }}
                    className={`absolute cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-[#C27B66] bg-[#C27B66]/30 ring-4 ring-[#C27B66]/40 z-30 shadow-lg'
                        : isHighConfidence
                        ? 'border border-[#8C9A84] bg-[#8C9A84]/20 hover:bg-[#8C9A84]/40 z-10'
                        : isMediumConfidence
                        ? 'border border-[#DCCFC2] bg-[#DCCFC2]/20 hover:bg-[#DCCFC2]/40 z-10'
                        : 'border border-[#C27B66] bg-[#C27B66]/20 hover:bg-[#C27B66]/40 z-10'
                    }`}
                  >
                    {/* Bounding Box Tag */}
                    {(isSelected || hoveredBox === box) && (
                      <div className="absolute -top-7 left-0 bg-[#2D3A31] text-[#F9F8F4] text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap z-40 border border-[#3D5544] flex items-center gap-1.5">
                        <span className="font-bold text-[#DCCFC2]">{box.field_name || 'Field'}:</span>
                        <span>{box.confidence}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hover Info Tooltip Bar */}
      {hoveredBox && (
        <div className="h-10 bg-[#1E2822] border-t border-[#3D5544] px-5 flex items-center justify-between text-xs text-[#E1E8E3] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[#8C9A84]">Extracted Text:</span>
            <span className="font-semibold text-[#F9F8F4] truncate font-serif italic">&quot;{hoveredBox.text}&quot;</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
            <span>Field: <b className="text-[#DCCFC2]">{hoveredBox.field_name || 'N/A'}</b></span>
            <span>Confidence: <b className={hoveredBox.confidence >= 90 ? 'text-[#8C9A84]' : 'text-[#C27B66]'}>{hoveredBox.confidence}%</b></span>
          </div>
        </div>
      )}
    </div>
  );
}
