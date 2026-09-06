'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Upload, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  RotateCw,
  Search,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.listDocuments(statusFilter || undefined);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const filtered = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
            Digitized Cadastral <span className="italic font-normal text-[#8C9A84]">Documents</span>
          </h1>
          <p className="text-xs text-[#8C9A84] mt-1.5 font-sans">
            Repository of scanned pattas, sale deeds, tax receipts, and cadastral survey field measurement records.
          </p>
        </div>

        <Link
          href="/documents/upload"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all w-fit"
        >
          <Upload className="w-3.5 h-3.5 text-[#DCCFC2]" strokeWidth={1.75} />
          <span>Upload New Documents</span>
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-88">
          <Search className="w-4 h-4 text-[#8C9A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document filename or type..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/30 focus:border-[#2D3A31] placeholder:text-[#8C9A84]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#8C9A84]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F2F0EB] border border-[#E6E2DA] rounded-full px-4 py-2 font-medium text-[#2D3A31] focus:outline-none focus:ring-1 focus:ring-[#2D3A31]"
          >
            <option value="">All Processing Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PREPROCESSING">Preprocessing</option>
            <option value="OCR_PROCESSING">OCR Processing</option>
            <option value="EXTRACTING">Extracting Entities</option>
            <option value="FAILED">Failed</option>
          </select>

          <button
            onClick={loadDocuments}
            className="p-2 text-[#2D3A31] hover:bg-[#F2F0EB] border border-[#E6E2DA] rounded-full transition-all"
            title="Refresh"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-serif italic text-[#8C9A84]">
            Loading cadastral document repository...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-[#DCCFC2] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-serif font-bold text-[#2D3A31]">No documents found</p>
            <p className="text-xs text-[#8C9A84] mt-1">Upload a legacy document scan to initiate AI digitization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F0EB] border-b border-[#E6E2DA] text-[#8C9A84] font-serif uppercase text-[10px] tracking-widest font-semibold">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Classified Type</th>
                  <th className="px-6 py-4">Pages</th>
                  <th className="px-6 py-4">Processing Status</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]/60">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F9F8F4] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#F2F0EB] text-[#2D3A31] flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#2D3A31] truncate max-w-xs">{doc.filename}</div>
                          <div className="text-[10px] text-[#8C9A84] font-mono">{Math.round(doc.file_size / 1024)} KB • {doc.mime_type}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] font-bold bg-[#F2F0EB] text-[#2D3A31] px-2.5 py-1 rounded-full border border-[#E6E2DA]">
                        {doc.document_type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[#2D3A31] font-medium font-mono">
                      {doc.page_count} page(s)
                    </td>

                    <td className="px-6 py-4">
                      {doc.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4F6C57] bg-[#8C9A84]/15 px-3 py-1 rounded-full border border-[#8C9A84]/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4F6C57]" />
                          <span>Completed</span>
                        </span>
                      ) : doc.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C27B66] bg-[#C27B66]/15 px-3 py-1 rounded-full border border-[#C27B66]/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2D3A31] bg-[#DCCFC2]/40 px-3 py-1 rounded-full border border-[#DCCFC2]">
                          <RotateCw className="w-3.5 h-3.5 animate-spin text-[#8C9A84]" />
                          <span>{doc.current_stage || doc.status}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-[#8C9A84] font-mono mb-1">
                          <span>{doc.processing_progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F2F0EB] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              doc.status === 'COMPLETED' ? 'bg-[#8C9A84]' : 'bg-[#2D3A31]'
                            }`}
                            style={{ width: `${doc.processing_progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[#8C9A84] text-[11px] font-mono">
                      {new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] font-semibold rounded-full text-xs transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Studio</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
