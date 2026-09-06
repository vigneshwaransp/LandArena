'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  RotateCw, 
  ExternalLink,
  Scale
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const data = await api.listAnomalies(severityFilter || undefined);
      setAnomalies(data);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, [severityFilter]);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAnomaly(id);
      loadAnomalies();
    } catch (err: any) {
      alert(err.message || 'Resolution failed');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
              Anomalies &amp; <span className="italic font-normal text-[#C27B66]">Fraud Risk Indicators</span>
            </h1>
            <span className="text-[10px] bg-[#C27B66]/15 text-[#C27B66] font-serif font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#C27B66]/30">
              Explainable AI
            </span>
          </div>
          <p className="text-xs text-[#8C9A84] mt-1.5 font-sans">
            Automated detection of boundary encroachments, contradictory ownership chains, area variances, and forged dates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-white border border-[#E6E2DA] rounded-full px-4 py-2 font-medium text-[#2D3A31] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2D3A31]"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <button
            onClick={loadAnomalies}
            className="p-2 bg-white hover:bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-[#2D3A31] shadow-sm transition-all"
            title="Refresh Anomalies"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="bg-[#F2F0EB] border border-[#E6E2DA] rounded-3xl p-5 flex items-start gap-3.5 shadow-sm">
        <Scale className="w-5 h-5 text-[#2D3A31] shrink-0 mt-0.5" />
        <div className="text-xs text-[#2D3A31]">
          <span className="font-serif font-bold text-sm">Statutory Investigation Notice:</span>
          <p className="mt-1 text-xs text-[#8C9A84] leading-relaxed font-sans">
            This system identifies risk indicators and cross-checks legacy records using AI document intelligence, OCR, and PostGIS cadastral mapping for human investigation. It does not make a final judicial determination of fraud.
          </p>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-xs font-serif italic text-[#8C9A84] border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)]">
            Scanning cadastral records for risk indicators...
          </div>
        ) : anomalies.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)]">
            <CheckCircle2 className="w-10 h-10 text-[#4F6C57] mx-auto mb-2" />
            <h3 className="text-base font-serif font-bold text-[#2D3A31]">No Active Anomalies Flagged</h3>
            <p className="text-xs text-[#8C9A84] mt-1">All digitized deeds satisfy consistency thresholds.</p>
          </div>
        ) : (
          anomalies.map((anom) => {
            const isCritical = anom.severity === 'CRITICAL';
            const isHigh = anom.severity === 'HIGH';

            return (
              <div
                key={anom.id}
                className={`bg-white rounded-3xl border p-6 shadow-[0_10px_30px_rgba(45,58,49,0.06)] space-y-3.5 transition-all ${
                  isCritical ? 'border-[#C27B66]/40 bg-[#C27B66]/5' : 'border-[#E6E2DA]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#E6E2DA]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isCritical
                          ? 'bg-[#C27B66]/15 text-[#C27B66] border border-[#C27B66]/30'
                          : isHigh
                          ? 'bg-[#D08C7B]/20 text-[#8C4634] border border-[#D08C7B]/40'
                          : 'bg-[#DCCFC2]/40 text-[#2D3A31] border border-[#DCCFC2]'
                      }`}
                    >
                      {anom.type}
                    </span>
                    <h3 className="text-base font-serif font-bold text-[#2D3A31]">{anom.title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#C27B66]">
                      {anom.severity} SEVERITY
                    </span>
                    <span className="text-[10px] font-mono bg-[#F2F0EB] text-[#2D3A31] px-2.5 py-1 rounded-full border border-[#E6E2DA]">
                      {Math.round(anom.confidence * 100)}% AI Conf.
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#2D3A31] leading-relaxed font-medium">
                  {anom.explanation}
                </p>

                {/* Evidence Details */}
                {anom.evidence && Object.keys(anom.evidence).length > 0 && (
                  <div className="p-4 bg-[#F2F0EB]/60 rounded-2xl border border-[#E6E2DA] text-xs font-mono text-[#2D3A31] space-y-1.5">
                    <div className="text-[10px] font-serif uppercase tracking-widest font-bold text-[#8C9A84]">
                      Recorded Evidence Breakdown:
                    </div>
                    <pre className="text-[11px] whitespace-pre-wrap text-[#2D3A31]">
                      {JSON.stringify(anom.evidence, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-[10px] text-[#8C9A84] font-mono">
                    Detected: {new Date(anom.created_at).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/records/${anom.record_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] rounded-full text-xs font-semibold transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Land Title</span>
                    </Link>

                    {!anom.resolved && (
                      <button
                        onClick={() => handleResolve(anom.id)}
                        className="px-5 py-2 bg-[#4F6C57] hover:bg-[#3D5544] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
