'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Settings, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api, getApiBase } from '@/lib/api';

export default function ApiStatusBanner() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'sleeping' | 'error'>('checking');
  const [currentBase, setCurrentBase] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [testing, setTesting] = useState<boolean>(false);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      const data = await api.getDashboardStats();
      if (data && typeof data.total_records !== 'undefined') {
        setStatus('connected');
        return true;
      }
      setStatus('sleeping');
      return false;
    } catch (err) {
      console.warn('Backend API connection check:', err);
      setStatus('sleeping');
      return false;
    }
  };

  useEffect(() => {
    setCurrentBase(getApiBase());
    if (typeof window !== 'undefined') {
      setCustomUrl(localStorage.getItem('custom_api_url') || '');
    }
    checkConnection();
  }, []);

  // Periodic retry when sleeping
  useEffect(() => {
    if (status !== 'sleeping') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          checkConnection();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const handleSaveCustomUrl = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const trimmed = customUrl.trim();
      if (trimmed) {
        localStorage.setItem('custom_api_url', trimmed);
      } else {
        localStorage.removeItem('custom_api_url');
      }
      setCurrentBase(getApiBase());
      const ok = await checkConnection();
      if (ok) {
        setTestResult('Success! Connected to backend.');
        setTimeout(() => setShowModal(false), 1200);
      } else {
        setTestResult('Endpoint saved, but backend did not respond yet. It may still be waking up.');
      }
    } catch (e: any) {
      setTestResult(`Connection error: ${e.message || 'Failed'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('custom_api_url');
    setCustomUrl('');
    setCurrentBase(getApiBase());
    checkConnection();
    setTestResult('Reset to default (/api proxy).');
  };

  if (status === 'connected') {
    return (
      <div className="bg-[#4F6C57]/10 border-b border-[#4F6C57]/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-[#2D3A31]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4F6C57] animate-pulse" />
          <span className="font-semibold text-[#4F6C57]">Backend API Connected:</span>
          <span className="font-mono text-[#8C9A84]">{currentBase}</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-[10px] text-[#8C9A84] hover:text-[#2D3A31] underline flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          <span>Configure Endpoint</span>
        </button>

        {showModal && renderModal()}
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#C27B66]/15 border-b border-[#C27B66]/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#2D3A31]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C27B66] animate-ping" />
          <div>
            <span className="font-semibold text-[#8C4634]">Connecting to Land Record API</span>
            <span className="text-[#8C9A84] ml-2">
              (Free-tier cloud servers sleep when idle & take ~50s to wake up. Auto-retrying in {countdown}s...)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setCountdown(10); checkConnection(); }}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#2D3A31] text-[#F9F8F4] rounded-full text-[11px] font-semibold hover:bg-[#1E2822] transition-all shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
            <span>{status === 'checking' ? 'Testing...' : 'Retry Now'}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E6E2DA] text-[#2D3A31] rounded-full text-[11px] font-medium hover:bg-[#F2F0EB] transition-all shadow-sm"
          >
            <Settings className="w-3 h-3 text-[#8C9A84]" />
            <span>Set API URL</span>
          </button>
        </div>
      </div>

      {showModal && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#F9F8F4] rounded-3xl border border-[#E6E2DA] max-w-md w-full p-6 shadow-[0_20px_50px_rgba(45,58,49,0.15)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#8C9A84]" />
              <h3 className="font-serif font-bold text-sm text-[#2D3A31]">Backend API Connection</h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 hover:bg-[#E6E2DA] rounded-full text-[#8C9A84] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs text-[#2D3A31]">
            <div>
              <label className="text-[11px] font-serif uppercase tracking-wider text-[#8C9A84] font-semibold block mb-1">
                Active Resolved Endpoint
              </label>
              <div className="p-2.5 bg-white border border-[#E6E2DA] rounded-xl font-mono text-[11px] text-[#2D3A31] break-all">
                {currentBase}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-serif uppercase tracking-wider text-[#8C9A84] font-semibold block mb-1">
                Custom Backend URL (Optional)
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="e.g. https://landarena-api.onrender.com"
                className="w-full p-2.5 bg-white border border-[#E6E2DA] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
              />
              <span className="text-[10px] text-[#8C9A84] mt-1 block">
                If your backend is hosted on Render or another domain, paste the URL here to connect directly.
              </span>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${testResult.startsWith('Success') ? 'bg-[#4F6C57]/15 text-[#4F6C57]' : 'bg-[#C27B66]/15 text-[#8C4634]'}`}>
                {testResult.startsWith('Success') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E6E2DA]">
            <button
              onClick={handleReset}
              className="text-xs text-[#8C9A84] hover:text-[#2D3A31] underline font-medium"
            >
              Reset to Default Proxy
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#F2F0EB] text-[#2D3A31] rounded-full text-xs font-medium hover:bg-[#E6E2DA] transition-all"
              >
                Close
              </button>
              <button
                onClick={handleSaveCustomUrl}
                disabled={testing}
                className="px-5 py-2 bg-[#2D3A31] text-[#F9F8F4] rounded-full text-xs font-semibold hover:bg-[#1E2822] transition-all shadow-sm disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
