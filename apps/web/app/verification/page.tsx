'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  RotateCw, 
  Check, 
  X, 
  Eye,
  Leaf
} from 'lucide-react';
import { api } from '@/lib/api';

export default function VerificationQueuePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, rList] = await Promise.all([
        api.listVerificationTasks(statusFilter || undefined),
        api.listRecords()
      ]);
      setTasks(tList);
      setRecords(rList);
    } catch (err) {
      console.error('Failed to load verification tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (recId: string) => {
    try {
      await api.approveRecord(recId, "Approved from verification queue.");
      loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (recId: string) => {
    const reason = prompt("Enter rejection reason:", "Discrepancy in recorded boundary extent.");
    if (!reason) return;
    try {
      await api.rejectRecord(recId, reason);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
            Human-in-the-Loop <span className="italic font-normal text-[#8C9A84]">Verification Portal</span>
          </h1>
          <p className="text-xs text-[#8C9A84] mt-1.5 font-sans">
            Revenue officer decision center. Review AI-extracted entities against original scanned deeds and approve, edit, or reject titles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-[#E6E2DA] rounded-full px-4 py-2 font-medium text-[#2D3A31] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2D3A31]"
          >
            <option value="">All Tasks</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved Tasks</option>
            <option value="REJECTED">Rejected Tasks</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 bg-white hover:bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-[#2D3A31] shadow-sm transition-all"
            title="Refresh Queue"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-xs font-serif italic text-[#8C9A84] border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)]">
            Loading verification tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)]">
            <CheckCircle2 className="w-10 h-10 text-[#4F6C57] mx-auto mb-2" />
            <h3 className="text-base font-serif font-bold text-[#2D3A31]">Verification Queue Clear</h3>
            <p className="text-xs text-[#8C9A84] mt-1">All uploaded records have been processed and resolved.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const rec = records.find((r) => r.id === task.record_id) || {};
            const isPending = task.status === 'PENDING';
            const isUrgent = task.priority === 'URGENT';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-3xl border p-6 shadow-[0_10px_30px_rgba(45,58,49,0.06)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isUrgent ? 'border-[#C27B66]/40 bg-[#C27B66]/5' : 'border-[#E6E2DA]'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-xs text-[#2D3A31] bg-[#F2F0EB] px-3 py-1 rounded-full border border-[#E6E2DA]">
                      {rec.record_id || `ID: ${task.record_id?.slice(-8)}`}
                    </span>
                    <span
                      className={`text-[9px] font-serif font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-[#C27B66]/15 text-[#C27B66] border border-[#C27B66]/30'
                          : 'bg-[#DCCFC2]/40 text-[#2D3A31] border border-[#DCCFC2]'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                    <span className="text-xs font-semibold text-[#8C9A84]">
                      Survey No: <b className="font-mono text-[#2D3A31]">{rec.property?.survey_number || '145/2A'}</b>
                    </span>
                  </div>

                  <div className="text-sm font-serif font-bold text-[#2D3A31]">
                    Owner: {rec.owner?.name || 'Ravi Kumar'} • Extent: {rec.property?.area || '2.45'} {rec.property?.area_unit || 'acres'}
                  </div>

                  <p className="text-xs text-[#8C9A84]">
                    Village: <b className="text-[#2D3A31]">{rec.location?.village || 'Thudupathi'}</b> • District: <b className="text-[#2D3A31]">{rec.location?.district || 'Erode'}</b> • Score: <b className="text-[#2D3A31] font-mono">{rec.validation_score || 78.5}%</b>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href={`/records/${task.record_id}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] rounded-full text-xs font-semibold transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Record</span>
                  </Link>

                  {isPending && (
                    <>
                      <button
                        onClick={() => handleApprove(task.record_id)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4F6C57] hover:bg-[#3D5544] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleReject(task.record_id)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#C27B66] hover:bg-[#A95E4A] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
