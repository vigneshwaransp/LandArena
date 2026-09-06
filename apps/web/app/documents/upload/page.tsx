'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Leaf
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DocumentUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const stages = [
    { id: 1, name: 'Upload & Ingestion', desc: 'Secure multipart file upload' },
    { id: 2, name: 'PDF Conversion & Enhancement', desc: 'PyMuPDF 300 DPI render + CLAHE deskew' },
    { id: 3, name: 'Multilingual OCR', desc: 'Optical character extraction (English / Tamil / Hindi)' },
    { id: 4, name: 'NLP Entity Extraction', desc: 'Extract Owner, Survey No, Area, Boundaries' },
    { id: 5, name: 'Cross-Record & GIS Validation', desc: 'PostGIS spatial & historical registry cross-check' },
    { id: 6, name: 'Fraud Risk & Anomaly Scoring', desc: 'Explainable validation score generation' },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(15);
    setCurrentStage('Uploading document to secure object storage...');

    try {
      const doc = await api.uploadDocument(selectedFile);

      setTimeout(() => {
        setUploadProgress(35);
        setCurrentStage('PDF Conversion & CLAHE Image Enhancement...');
      }, 700);

      setTimeout(() => {
        setUploadProgress(60);
        setCurrentStage('Running Multilingual Optical Character Recognition...');
      }, 1400);

      setTimeout(() => {
        setUploadProgress(85);
        setCurrentStage('Extracting entities & running PostGIS cadastral validation...');
      }, 2100);

      setTimeout(() => {
        setUploadProgress(100);
        setCurrentStage('Digitization Complete!');
        router.push(`/documents/${doc.id}`);
      }, 2900);

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
          Upload Legacy <span className="italic font-normal text-[#8C9A84]">Land Records</span>
        </h1>
        <p className="text-xs text-[#8C9A84] mt-1.5 font-sans">
          Upload scanned deeds, patta passbooks, field measurement sketches, or tax receipts for automated AI digitization and validation.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#C27B66]/10 border border-[#C27B66]/30 rounded-3xl text-xs text-[#C27B66] flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#C27B66] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag and Drop Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-[0_10px_30px_rgba(45,58,49,0.06)] ${
          selectedFile
            ? 'border-[#8C9A84] bg-[#8C9A84]/10'
            : 'border-[#E6E2DA] hover:border-[#8C9A84] bg-white hover:bg-[#F2F0EB]/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.tiff"
          className="hidden"
        />

        <div className="w-16 h-16 rounded-full bg-[#F2F0EB] text-[#2D3A31] flex items-center justify-center mb-4 shadow-sm">
          <Upload className="w-7 h-7 text-[#2D3A31]" strokeWidth={1.75} />
        </div>

        {selectedFile ? (
          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest font-bold text-[#2D3A31] bg-[#8C9A84]/20 px-3 py-1 rounded-full border border-[#8C9A84]/40">
              File Selected
            </span>
            <h3 className="text-base font-serif font-bold text-[#2D3A31] mt-2.5">{selectedFile.name}</h3>
            <p className="text-xs text-[#8C9A84] mt-0.5 font-mono">
              {Math.round(selectedFile.size / 1024)} KB • Ready for Cadastral Pipeline
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-serif font-bold text-[#2D3A31]">
              Drag &amp; drop your land documents here, or <span className="text-[#8C9A84] underline underline-offset-4">browse files</span>
            </h3>
            <p className="text-xs text-[#8C9A84] mt-1.5 font-sans">
              Supports PDF, PNG, JPG, JPEG, TIFF (Max configurable 50 MB)
            </p>
          </div>
        )}
      </div>

      {/* Live Pipeline Visualizer */}
      {uploading && (
        <div className="bg-white rounded-3xl p-8 border border-[#E6E2DA] shadow-[0_20px_40px_rgba(45,58,49,0.1)] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#8C9A84] animate-spin" />
              <span className="text-xs font-serif font-bold text-[#2D3A31]">{currentStage}</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#2D3A31]">{uploadProgress}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#F2F0EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D3A31] rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          {/* Steps list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
            {stages.map((st) => {
              const isDone = (uploadProgress / 100) * 6 >= st.id;
              const isCurrent = (uploadProgress / 100) * 6 >= st.id - 0.5 && !isDone;

              return (
                <div
                  key={st.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-all ${
                    isDone
                      ? 'bg-[#8C9A84]/15 border-[#8C9A84]/30 text-[#2D3A31]'
                      : isCurrent
                      ? 'bg-[#F2F0EB] border-[#2D3A31] text-[#2D3A31]'
                      : 'bg-[#F9F8F4] border-[#E6E2DA] text-[#8C9A84] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-serif font-bold text-[11px]">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4F6C57]" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#2D3A31] text-[#F9F8F4] flex items-center justify-center text-[9px] font-mono">
                        {st.id}
                      </span>
                    )}
                    <span>{st.name}</span>
                  </div>
                  <p className="text-[10px] text-[#8C9A84] mt-1 leading-tight font-sans">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Start Button */}
      {selectedFile && !uploading && (
        <button
          onClick={handleUpload}
          className="w-full py-3.5 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] font-serif font-bold rounded-full text-xs shadow-md transition-all flex items-center justify-center gap-2.5"
        >
          <span>Start Cadastral Digitization &amp; Validation Pipeline</span>
          <ArrowRight className="w-4 h-4 text-[#DCCFC2]" />
        </button>
      )}
    </div>
  );
}
