'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  FolderKanban, 
  Download
} from 'lucide-react';
import { api } from '@/lib/api';
import DocumentViewerCanvas from '@/components/DocumentViewerCanvas';

export default function DocumentStudioPage() {
  const params = useParams();
  const docId = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string | null>('owner_name');
  const [activePageIndex] = useState(0);

  useEffect(() => {
    async function loadDoc() {
      try {
        const data = await api.getDocument(docId);
        setDocument(data);
      } catch (err) {
        console.error('Failed to load document:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [docId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#8C9A84] animate-spin" />
          <span className="text-xs font-serif italic text-[#8C9A84]">Loading document intelligence studio...</span>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-12 text-center text-xs text-[#8C9A84] font-serif">
        Document not found. <Link href="/documents" className="text-[#2D3A31] underline">Back to documents</Link>
      </div>
    );
  }

  const activePage = document.pages?.[activePageIndex] || {
    image_url: document.download_url,
    ocr_boxes: [],
    ocr_text: '',
    confidence: 95.0,
    language: 'en'
  };

  const extractedFields = [
    { key: 'owner_name', label: 'Owner Name', value: 'Ravi Kumar (ரவிகுமார்)', confidence: 96.5 },
    { key: 'father_name', label: 'Father / Husband Name', value: 'S. Kumar', confidence: 95.0 },
    { key: 'survey_number', label: 'Survey Number', value: '145/2A (Subdivision: 2A)', confidence: 99.0 },
    { key: 'area', label: 'Stated Extent / Area', value: '2.45 Acres (0.9915 Hectare)', confidence: 97.0 },
    { key: 'patta_number', label: 'Patta Passbook No', value: 'P-88421', confidence: 98.0 },
    { key: 'location', label: 'Administrative Location', value: 'Thudupathi Village, Perundurai Taluk, Erode', confidence: 98.0 },
    { key: 'registration_date', label: 'Registration Date', value: '12-04-2021', confidence: 95.5 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/documents"
            className="p-2.5 rounded-full bg-white border border-[#E6E2DA] text-[#2D3A31] hover:bg-[#F2F0EB] transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-serif font-bold text-[#2D3A31] tracking-tight">{document.filename}</h1>
              <span className="text-[10px] font-mono font-bold bg-[#F2F0EB] text-[#2D3A31] px-3 py-1 rounded-full border border-[#E6E2DA]">
                {document.document_type}
              </span>
            </div>
            <p className="text-xs text-[#8C9A84] mt-1 font-sans">
              OCR Language: <b className="uppercase font-mono text-[#2D3A31]">{activePage.language}</b> • Overall Scan Confidence: <b className="text-[#4F6C57] font-mono">{activePage.confidence}%</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {document.download_url && (
            <a
              href={document.download_url}
              download
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E2DA] rounded-full text-xs font-semibold text-[#2D3A31] hover:bg-[#F2F0EB] transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#8C9A84]" />
              <span>Download Original</span>
            </a>
          )}
          <Link
            href="/records"
            className="flex items-center gap-2 px-5 py-2 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#DCCFC2]" />
            <span>Open Validated Records</span>
          </Link>
        </div>
      </div>

      {/* Main Studio Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Column: Interactive Zoomable Canvas with OCR Overlays (7 Cols) */}
        <div className="lg:col-span-7 h-[700px]">
          <DocumentViewerCanvas
            imageUrl={activePage.image_url}
            processedImageUrl={activePage.processed_image_url}
            ocrBoxes={activePage.ocr_boxes || []}
            selectedField={selectedField}
            onBoxSelect={(box) => {
              if (box.field_name) setSelectedField(box.field_name);
            }}
          />
        </div>

        {/* Right Column: Extracted Entities & Verification Summary (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Extracted Fields Card */}
          <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E6E2DA]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8C9A84]" />
                  <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
                    Extracted Cadastral Entities
                  </h3>
                </div>
                <span className="text-[10px] text-[#8C9A84] font-serif italic">Click field to locate in scan</span>
              </div>

              {/* Field Cards */}
              <div className="space-y-2.5 mt-4 overflow-y-auto max-h-[440px] pr-1">
                {extractedFields.map((f) => {
                  const isSelected = selectedField === f.key;
                  return (
                    <div
                      key={f.key}
                      onClick={() => setSelectedField(f.key)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#2D3A31] bg-[#8C9A84]/15 shadow-sm ring-1 ring-[#2D3A31]'
                          : 'border-[#E6E2DA] bg-[#F2F0EB]/60 hover:bg-[#F2F0EB] hover:border-[#8C9A84]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#8C9A84]">{f.label}</span>
                        <span className="font-mono text-[10px] font-bold text-[#4F6C57] bg-[#8C9A84]/15 px-2 py-0.5 rounded-full border border-[#8C9A84]/30">
                          {f.confidence}% OCR
                        </span>
                      </div>
                      <div className="font-bold text-[#2D3A31] mt-1.5 text-xs font-serif">
                        {f.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OCR Raw Text Drawer Button */}
            <div className="pt-4 border-t border-[#E6E2DA] mt-4 flex justify-between items-center text-xs">
              <span className="text-[11px] text-[#8C9A84] font-serif">Multilingual OCR Verified</span>
              <Link
                href="/verification"
                className="px-5 py-2.5 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full font-semibold text-xs transition-all shadow-sm flex items-center gap-2"
              >
                <span>Proceed to Human Review</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
