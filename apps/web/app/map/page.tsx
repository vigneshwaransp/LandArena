'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Layers, 
  ShieldCheck, 
  MapPin, 
  UserCheck, 
  FileText,
  Upload,
  ArrowUpRight
} from 'lucide-react';
import MapLibreView from '@/components/MapLibreView';

export default function GISMapPage() {
  const [, setSelectedParcel] = useState<any>(null);

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-3 pb-2">
      {/* Header with Jurisdictional Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-[#2D3A31] tracking-tight">
              Cadastral GIS <span className="italic font-normal text-[#8C9A84]">Jurisdiction &amp; Land Map</span>
            </h1>
            <span className="text-[10px] bg-[#8C9A84]/15 text-[#2D3A31] font-serif uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-[#8C9A84]/30">
              DILRMP Modernization Grid
            </span>
          </div>
          <p className="text-xs text-[#8C9A84] mt-0.5 font-sans">
            Explore Tahsildar revenue taluks, georeferenced cadastral boundaries, real-time GPS coordinates, and spatial overlap detections.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E6E2DA] rounded-full text-[11px] shadow-sm font-mono text-[#4F6C57]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>6 Tahsildar Taluks Live</span>
          </div>

          <Link
            href="/documents/upload"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
          >
            <Upload className="w-3 h-3 text-[#DCCFC2]" />
            <span>Digitize Deed</span>
          </Link>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full rounded-3xl overflow-hidden shadow-[0_15px_35px_rgba(45,58,49,0.08)] border border-[#E6E2DA]">
        <MapLibreView onParcelSelect={(p) => setSelectedParcel(p)} />
      </div>
    </div>
  );
}
