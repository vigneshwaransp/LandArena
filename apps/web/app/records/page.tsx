'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCw,
  Download,
  Eye,
  Leaf
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LandRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.risk = riskFilter;
      const data = await api.listRecords(params);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [statusFilter, riskFilter]);

  const filtered = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    const ownerName = (r.owner?.name || '').toLowerCase();
    const surveyNo = (r.property?.survey_number || '').toLowerCase();
    const village = (r.location?.village || '').toLowerCase();
    const recId = (r.record_id || '').toLowerCase();
    return ownerName.includes(q) || surveyNo.includes(q) || village.includes(q) || recId.includes(q);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
            Digital Cadastral <span className="italic font-normal text-[#8C9A84]">Record Registry</span>
          </h1>
          <p className="text-xs text-[#8C9A84] mt-1.5 font-sans">
            Official searchable ledger of digitized cadastral titles, ownership claims, and PostGIS validated parcels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://127.0.0.1:8000/api/reports/export/csv"
            download
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] rounded-full text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#8C9A84]" />
            <span>Export Registry (CSV)</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-88">
          <Search className="w-4 h-4 text-[#8C9A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Survey No, Owner, Village, Record ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/30 focus:border-[#2D3A31] placeholder:text-[#8C9A84]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#8C9A84]" />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F2F0EB] border border-[#E6E2DA] rounded-full px-4 py-2 font-medium text-[#2D3A31] focus:outline-none focus:ring-1 focus:ring-[#2D3A31]"
          >
            <option value="">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-[#F2F0EB] border border-[#E6E2DA] rounded-full px-4 py-2 font-medium text-[#2D3A31] focus:outline-none focus:ring-1 focus:ring-[#2D3A31]"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          <button
            onClick={loadRecords}
            className="p-2 text-[#2D3A31] hover:bg-[#F2F0EB] border border-[#E6E2DA] rounded-full transition-all"
            title="Refresh"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-serif italic text-[#8C9A84]">
            Loading cadastral land records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FolderKanban className="w-10 h-10 text-[#DCCFC2] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-serif font-bold text-[#2D3A31]">No matching land records found</p>
            <p className="text-xs text-[#8C9A84] mt-1">Try adjusting search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F0EB] border-b border-[#E6E2DA] text-[#8C9A84] font-serif uppercase text-[10px] tracking-widest font-semibold">
                <tr>
                  <th className="px-6 py-4">Record ID</th>
                  <th className="px-6 py-4">Owner / Relation</th>
                  <th className="px-6 py-4">Survey No</th>
                  <th className="px-6 py-4">Village &amp; District</th>
                  <th className="px-6 py-4">Extent / Area</th>
                  <th className="px-6 py-4">Score &amp; Risk</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]/60">
                {filtered.map((rec) => {
                  const isVerified = rec.status === 'VERIFIED';
                  const isRejected = rec.status === 'REJECTED';
                  const isCritical = rec.risk_level === 'CRITICAL';
                  const isHigh = rec.risk_level === 'HIGH';
                  const isMedium = rec.risk_level === 'MEDIUM';

                  return (
                    <tr key={rec.id} className="hover:bg-[#F9F8F4] transition-all">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-[11px] text-[#2D3A31] bg-[#F2F0EB] px-3 py-1 rounded-full border border-[#E6E2DA]">
                          {rec.record_id}
                        </span>
                        <div className="text-[10px] text-[#8C9A84] font-mono mt-1">v{rec.version} • {new Date(rec.created_at).toLocaleDateString()}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-serif font-bold text-[#2D3A31] text-xs">{rec.owner?.name}</div>
                        <div className="text-[11px] text-[#8C9A84]">S/o: {rec.owner?.father_name || 'N/A'}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-[#2D3A31]">{rec.property?.survey_number}</div>
                        <div className="text-[10px] text-[#8C9A84]">Patta: {rec.property?.patta_number || 'N/A'}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#2D3A31]">{rec.location?.village}</div>
                        <div className="text-[11px] text-[#8C9A84]">{rec.location?.district}, {rec.location?.state}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-[#2D3A31]">{rec.property?.area} {rec.property?.area_unit}</div>
                        <div className="text-[10px] text-[#8C9A84]">{rec.property?.land_type || 'Agricultural'}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2D3A31]">{rec.validation_score}%</span>
                          <span
                            className={`text-[9px] font-serif font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isCritical
                                ? 'bg-[#C27B66]/15 text-[#C27B66] border border-[#C27B66]/30'
                                : isHigh
                                ? 'bg-[#D08C7B]/20 text-[#8C4634] border border-[#D08C7B]/40'
                                : isMedium
                                ? 'bg-[#DCCFC2]/40 text-[#2D3A31] border border-[#DCCFC2]'
                                : 'bg-[#8C9A84]/15 text-[#4F6C57] border border-[#8C9A84]/30'
                            }`}
                          >
                            {rec.risk_level}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4F6C57] bg-[#8C9A84]/15 px-3 py-1 rounded-full border border-[#8C9A84]/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C27B66] bg-[#C27B66]/15 px-3 py-1 rounded-full border border-[#C27B66]/30">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C4634] bg-[#DCCFC2]/40 px-3 py-1 rounded-full border border-[#DCCFC2]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Needs Review</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/records/${rec.id}`}
                            className="p-2 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] rounded-full transition-all shadow-sm"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
