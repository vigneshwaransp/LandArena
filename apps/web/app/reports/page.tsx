'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Code2, 
  CheckCircle2, 
  ShieldCheck, 
  Printer,
  Sparkles,
  ExternalLink,
  Award
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listRecords();
        setRecords(data);
        if (data.length > 0) {
          setSelectedRecordId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load records for reporting:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedRecord = records.find((r) => r.id === selectedRecordId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D3A31] tracking-tight">
          Reports & Statutory <span className="italic font-normal">Export Center</span>
        </h1>
        <p className="text-xs text-[#2D3A31]/70 mt-1">
          Generate official validation certificates, audit export summaries, and cadastral datasets in PDF, CSV, and JSON formats.
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDF Certificate Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between space-y-4 hover:border-[#8C9A84] transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] tracking-wide uppercase">
              Validation Certificate
            </h3>
            <p className="text-[11px] text-[#2D3A31]/70 leading-relaxed">
              Official PDF audit certificate with ownership particulars, cadastral stamp, and rule score breakdown.
            </p>
          </div>

          {selectedRecord ? (
            <a
              href={`http://127.0.0.1:8000/api/reports/validation/${selectedRecord.id}/pdf`}
              download
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#2D3A31] hover:bg-[#1f2822] text-[#F9F8F4] font-semibold rounded-full text-xs shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#8C9A84]" />
              <span>Download PDF</span>
            </a>
          ) : (
            <button disabled className="w-full py-2.5 bg-[#F2F0EB] text-[#2D3A31]/40 font-semibold rounded-full text-xs">
              Select Record
            </button>
          )}
        </div>

        {/* CSV Data Export Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between space-y-4 hover:border-[#8C9A84] transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] tracking-wide uppercase">
              Full Registry Dataset
            </h3>
            <p className="text-[11px] text-[#2D3A31]/70 leading-relaxed">
              Complete tabular export of all digitized land titles with verification scores and GPS coordinates.
            </p>
          </div>

          <a
            href="http://127.0.0.1:8000/api/reports/export/csv"
            download
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] font-semibold rounded-full text-xs border border-[#E6E2DA] shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>

        {/* JSON Schema Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] flex flex-col justify-between space-y-4 hover:border-[#8C9A84] transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] tracking-wide uppercase">
              Raw Structured JSON
            </h3>
            <p className="text-[11px] text-[#2D3A31]/70 leading-relaxed">
              Open GeoJSON & Land Registry REST schema export for state revenue portal interoperability.
            </p>
          </div>

          <a
            href="http://127.0.0.1:8000/api/reports/export/json"
            download
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] font-semibold rounded-full text-xs border border-[#E6E2DA] shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Interactive Report Preview Inspector */}
      <div className="bg-white rounded-3xl border border-[#E6E2DA] p-6 sm:p-8 shadow-[0_4px_20px_rgba(45,58,49,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E2DA]">
          <div>
            <h3 className="text-base font-serif font-bold text-[#2D3A31]">Certificate Live Preview</h3>
            <p className="text-xs text-[#2D3A31]/70 mt-0.5">Select a land record to preview its generated validation certificate</p>
          </div>

          <select
            value={selectedRecordId}
            onChange={(e) => setSelectedRecordId(e.target.value)}
            className="text-xs bg-[#F2F0EB] border border-[#E6E2DA] rounded-full px-4 py-2 font-medium text-[#2D3A31] focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
          >
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                {r.record_id} — {r.owner?.name} (Survey: {r.property?.survey_number})
              </option>
            ))}
          </select>
        </div>

        {selectedRecord && (
          <div className="border-2 border-[#DCCFC2] rounded-2xl p-6 sm:p-8 bg-[#FDFCF7] space-y-6 text-xs shadow-inner">
            {/* Certificate Header */}
            <div className="text-center pb-5 border-b border-[#E6E2DA] space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[10px] font-bold text-[#2D3A31] uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D3A31]" />
                <span>Government of Tamil Nadu • Land Revenue Administration</span>
              </div>
              <h2 className="text-lg font-serif font-bold text-[#2D3A31] pt-2">
                Official Cadastral Validation Certificate
              </h2>
              <p className="text-[11px] text-[#2D3A31]/60">Issued under Smart India Hackathon (SIH 2026) Land Record Digitization Framework</p>
            </div>

            {/* Particulars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-[#E6E2DA]">
              <div>
                <span className="text-[#2D3A31]/50 block text-[10px] uppercase font-medium">Record ID</span>
                <span className="font-mono font-bold text-xs text-[#2D3A31]">{selectedRecord.record_id}</span>
              </div>
              <div>
                <span className="text-[#2D3A31]/50 block text-[10px] uppercase font-medium">Verification Status</span>
                <span className="font-semibold text-xs text-[#2D3A31]">{selectedRecord.status}</span>
              </div>
              <div>
                <span className="text-[#2D3A31]/50 block text-[10px] uppercase font-medium">Validation Score</span>
                <span className="font-mono font-bold text-xs text-[#2D3A31] bg-[#8C9A84]/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {selectedRecord.validation_score}% Verified
                </span>
              </div>
              <div>
                <span className="text-[#2D3A31]/50 block text-[10px] uppercase font-medium">Registered Owner</span>
                <span className="font-bold text-xs text-[#2D3A31]">{selectedRecord.owner?.name}</span>
              </div>
              <div>
                <span className="text-[#2D3A31]/50 block text-[10px] uppercase font-medium">Survey & Subdivision</span>
                <span className="font-mono font-bold text-xs text-[#2D3A31]">{selectedRecord.property?.survey_number}</span>
              </div>
              <div>
                <span className="text-[#2D3A31]/50 block text-[10px] uppercase font-medium">Document Area</span>
                <span className="font-mono font-bold text-xs text-[#2D3A31]">{selectedRecord.property?.area} {selectedRecord.property?.area_unit}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#2D3A31]/60 pt-2 border-t border-[#E6E2DA]">
              <span>Digitally Certified via PostGIS Geometric Verification & CLAHE OCR</span>
              <span className="font-mono text-[#2D3A31]/80">SHA-256: 8f92a10b48...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
