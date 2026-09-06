'use client';

import React, { useState } from 'react';
import MapLibreView from '@/components/MapLibreView';

export default function GISMapPage() {
  const [, setSelectedParcel] = useState<any>(null);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
            Cadastral GIS <span className="italic font-normal text-[#8C9A84]">Land Map</span>
          </h1>
          <p className="text-xs text-[#8C9A84] mt-1 font-sans">
            Interactive PostGIS parcel polygon boundaries, spatial area calculation, and physical encroachment overlap detection.
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full rounded-3xl overflow-hidden shadow-[0_15px_35px_rgba(45,58,49,0.08)] border border-[#E6E2DA]">
        <MapLibreView onParcelSelect={(p) => setSelectedParcel(p)} />
      </div>
    </div>
  );
}
