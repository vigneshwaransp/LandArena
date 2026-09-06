'use client';

import React, { useState } from 'react';
import { Settings, Sliders, Globe, Database, ShieldCheck, Save, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const { language, setLanguage } = useAppStore();
  const [areaTolerance, setAreaTolerance] = useState(5.0);
  const [ocrConfidence, setOcrConfidence] = useState(75.0);
  const [highRiskCutoff, setHighRiskCutoff] = useState(65.0);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D3A31] tracking-tight">
          System & <span className="italic font-normal">Validation Engine Settings</span>
        </h1>
        <p className="text-xs text-[#2D3A31]/70 mt-1">
          Configure automated cadastral tolerance thresholds, OCR recognition baselines, and multilingual translation preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Validation Thresholds */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6E2DA]">
            <Sliders className="w-4 h-4 text-[#8C9A84]" />
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
              Cadastral Validation Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2D3A31] mb-1.5">
                Area Variance Tolerance (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={areaTolerance}
                onChange={(e) => setAreaTolerance(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-xs font-mono font-bold text-[#2D3A31] focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 focus:border-[#8C9A84] transition-all"
              />
              <span className="text-[10px] text-[#2D3A31]/60 mt-1.5 block leading-relaxed">
                Permissible delta between deed area & GIS parcel before warning flag.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3A31] mb-1.5">
                Min. OCR Confidence Cutoff (%)
              </label>
              <input
                type="number"
                step="1"
                value={ocrConfidence}
                onChange={(e) => setOcrConfidence(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-xs font-mono font-bold text-[#2D3A31] focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 focus:border-[#8C9A84] transition-all"
              />
              <span className="text-[10px] text-[#2D3A31]/60 mt-1.5 block leading-relaxed">
                Threshold below which scans require mandatory optical re-inspection.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3A31] mb-1.5">
                High-Risk Flag Cutoff Score (%)
              </label>
              <input
                type="number"
                step="1"
                value={highRiskCutoff}
                onChange={(e) => setHighRiskCutoff(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-xs font-mono font-bold text-[#2D3A31] focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 focus:border-[#8C9A84] transition-all"
              />
              <span className="text-[10px] text-[#2D3A31]/60 mt-1.5 block leading-relaxed">
                Composite validation score below which records are tagged High Risk.
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Language & Regional Gazetteer */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6E2DA]">
            <Globe className="w-4 h-4 text-[#8C9A84]" />
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
              Language & Regional Administration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2D3A31] mb-1.5">
                Primary Regional Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-xs font-medium text-[#2D3A31] focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 focus:border-[#8C9A84] transition-all"
              >
                <option value="en">English (Official Revenue Standard)</option>
                <option value="ta">தமிழ் - Tamil Nadu Cadastral Gazette</option>
                <option value="hi">हिन्दी - Hindi Land Records (Khasra/Khatoni)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3A31] mb-1.5">
                Cadastral Jurisdiction Framework
              </label>
              <input
                type="text"
                disabled
                value="Tamil Nadu Land Records (Patta Chitta & FMB)"
                className="w-full px-4 py-2.5 bg-[#F2F0EB]/50 border border-[#E6E2DA] rounded-full text-xs text-[#2D3A31]/60 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Storage & Model Engine Status */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6E2DA]">
            <Database className="w-4 h-4 text-[#8C9A84]" />
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
              AI Engine & PostGIS Backend Architecture
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-[#FDFCF7] rounded-2xl border border-[#E6E2DA]">
              <span className="text-[10px] text-[#2D3A31]/50 block uppercase font-medium">OCR Engine</span>
              <span className="font-bold text-[#2D3A31] mt-1 block">Multilingual OCR</span>
              <span className="text-[10px] text-[#8C9A84] font-semibold">Active • 300 DPI</span>
            </div>
            <div className="p-4 bg-[#FDFCF7] rounded-2xl border border-[#E6E2DA]">
              <span className="text-[10px] text-[#2D3A31]/50 block uppercase font-medium">Spatial GIS</span>
              <span className="font-bold text-[#2D3A31] mt-1 block">PostGIS + Shapely</span>
              <span className="text-[10px] text-[#8C9A84] font-semibold">Active • EPSG:4326</span>
            </div>
            <div className="p-4 bg-[#FDFCF7] rounded-2xl border border-[#E6E2DA]">
              <span className="text-[10px] text-[#2D3A31]/50 block uppercase font-medium">AI Validation</span>
              <span className="font-bold text-[#2D3A31] mt-1 block">Explainable Rule ML</span>
              <span className="text-[10px] text-[#8C9A84] font-semibold">7 Active Rules</span>
            </div>
            <div className="p-4 bg-[#FDFCF7] rounded-2xl border border-[#E6E2DA]">
              <span className="text-[10px] text-[#2D3A31]/50 block uppercase font-medium">Object Storage</span>
              <span className="font-bold text-[#2D3A31] mt-1 block">MinIO / S3 Store</span>
              <span className="text-[10px] text-[#8C9A84] font-semibold">Connected</span>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-semibold text-[#8C9A84] flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Settings Saved</span>
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-7 py-3 bg-[#2D3A31] hover:bg-[#1f2822] text-[#F9F8F4] font-semibold rounded-full text-xs shadow-md transition-all"
          >
            <Save className="w-4 h-4 text-[#8C9A84]" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
