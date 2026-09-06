'use client';

import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  RotateCw, 
  ShieldCheck, 
  User, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.listAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((l) =>
    (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.record_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif font-bold text-[#2D3A31] tracking-tight">
              Immutable Cadastral <span className="italic font-normal">Audit Trail</span>
            </h1>
            <span className="text-[10px] bg-[#2D3A31] text-[#F9F8F4] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Append-Only Ledger
            </span>
          </div>
          <p className="text-xs text-[#2D3A31]/70 mt-1">
            Complete chronological audit trail recording every digitization, human review approval, rejection, and field amendment.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-xs font-semibold text-[#2D3A31] shadow-[0_2px_10px_rgba(45,58,49,0.03)] transition-all"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#8C9A84]" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)]">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#2D3A31]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit actions, user names, or record IDs..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-[#2D3A31] placeholder-[#2D3A31]/40 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 focus:border-[#8C9A84] transition-all"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#2D3A31]/70">
            Loading immutable audit logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-8 h-8 text-[#2D3A31]/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#2D3A31]">No audit logs match criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F0EB] border-b border-[#E6E2DA] text-[#2D3A31]/70 uppercase text-[10px] tracking-wider font-semibold font-serif">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Officer / Actor</th>
                  <th className="px-5 py-3.5">Action Type</th>
                  <th className="px-5 py-3.5">Record ID</th>
                  <th className="px-5 py-3.5">Modification Summary</th>
                  <th className="px-5 py-3.5">Reason / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FDFCF7] transition-all">
                    <td className="px-5 py-4 text-[#2D3A31]/60 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#2D3A31]">{log.user_name}</div>
                      <span className="text-[10px] font-mono text-[#2D3A31] bg-[#8C9A84]/20 px-2 py-0.5 rounded-full font-bold">
                        {log.user_role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] font-bold bg-[#F2F0EB] text-[#2D3A31] px-2.5 py-1 rounded-full border border-[#E6E2DA]">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-[#2D3A31] font-semibold">
                      {log.record_id ? `#${log.record_id.slice(-6)}` : 'System'}
                    </td>

                    <td className="px-5 py-4">
                      {log.old_value !== null || log.new_value !== null ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[#2D3A31]/40 line-through">{String(log.old_value || 'None')}</span>
                          <ArrowRight className="w-3 h-3 text-[#2D3A31]/40" />
                          <span className="font-bold text-[#2D3A31]">{String(log.new_value || 'None')}</span>
                        </div>
                      ) : (
                        <span className="text-[#2D3A31]/40 text-[11px]">Lifecycle Event</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[#2D3A31]/70 max-w-xs truncate">
                      {log.reason || 'Verified statutory procedure'}
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
