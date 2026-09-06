'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  AlertTriangle, 
  ExternalLink,
  Compass,
  Leaf
} from 'lucide-react';
import { api } from '@/lib/api';

interface MapLibreViewProps {
  selectedParcelId?: string;
  highlightSurvey?: string;
  onParcelSelect?: (parcel: any) => void;
}

export default function MapLibreView({
  selectedParcelId,
  highlightSurvey,
  onParcelSelect,
}: MapLibreViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [basemap, setBasemap] = useState<'streets' | 'satellite'>('streets');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Erode District Coordinates (Default center)
    const initialCenter: [number, number] = [77.7172, 11.3410];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              basemap === 'streets'
                ? 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
                : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO / Esri',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: initialCenter,
      zoom: 14.5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapInstance.current = map;

    map.on('load', async () => {
      try {
        const geojson = await api.getParcelsGeoJSON();

        // Add parcels GeoJSON source
        map.addSource('parcels-source', {
          type: 'geojson',
          data: geojson,
        });

        // 1. Polygon Fill Layer (color coded by botanical risk level)
        map.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'risk_level'],
              'CRITICAL', '#C27B66', // Terracotta
              'HIGH', '#D08C7B',     // Light Terracotta
              'MEDIUM', '#DCCFC2',   // Soft Clay Ochre
              '#8C9A84'              // Sage Green Verified
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.7,
              0.45
            ],
          },
        });

        // 2. Polygon Border / Cadastral Outline Layer
        map.addLayer({
          id: 'parcels-line',
          type: 'line',
          source: 'parcels-source',
          paint: {
            'line-color': [
              'match',
              ['get', 'has_overlap'],
              true, '#C27B66',
              '#2D3A31'
            ],
            'line-width': [
              'match',
              ['get', 'has_overlap'],
              true, 3,
              1.75
            ],
          },
        });

        // 3. Survey Number Labels Layer
        map.addLayer({
          id: 'parcels-labels',
          type: 'symbol',
          source: 'parcels-source',
          layout: {
            'text-field': ['concat', 'Survey ', ['get', 'survey_number'], '\n', ['get', 'gis_area_acres'], ' ac'],
            'text-size': 11,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0],
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#2D3A31',
            'text-halo-color': '#F9F8F4',
            'text-halo-width': 2,
          },
        });

        // Click interaction
        map.on('click', 'parcels-fill', (e) => {
          if (e.features && e.features[0]) {
            const feat = e.features[0];
            setSelectedFeature(feat.properties);
            onParcelSelect?.(feat.properties);
          }
        });

        // Cursor pointer
        map.on('mouseenter', 'parcels-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'parcels-fill', () => {
          map.getCanvas().style.cursor = '';
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to load GIS GeoJSON:', err);
        setLoading(false);
      }
    });

    return () => {
      map.remove();
    };
  }, [basemap]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col bg-[#F2F0EB]">
      {/* Map Header / Layer Switcher Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(45,58,49,0.08)] border border-[#E6E2DA] flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 font-serif font-bold text-[#2D3A31]">
            <Compass className="w-4 h-4 text-[#8C9A84]" strokeWidth={1.75} />
            <span>Cadastral GIS Map</span>
          </div>

          <div className="h-3.5 w-px bg-[#E6E2DA]" />

          {/* Basemap Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBasemap('streets')}
              className={`px-3 py-1 rounded-full font-medium text-[11px] transition-all ${
                basemap === 'streets' ? 'bg-[#2D3A31] text-[#F9F8F4] shadow-sm' : 'text-[#2D3A31] hover:bg-[#F2F0EB]'
              }`}
            >
              Cadastral Vector
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-3 py-1 rounded-full font-medium text-[11px] transition-all ${
                basemap === 'satellite' ? 'bg-[#2D3A31] text-[#F9F8F4] shadow-sm' : 'text-[#2D3A31] hover:bg-[#F2F0EB]'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_4px_20px_rgba(45,58,49,0.08)] border border-[#E6E2DA] text-[11px] space-y-2 select-none">
        <div className="font-serif font-bold text-[#2D3A31] pb-1.5 border-b border-[#E6E2DA]">Cadastral Parcel Status</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#8C9A84]" />
          <span className="text-[#2D3A31]">Verified (&lt;5% Area Variance)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#DCCFC2] border border-[#B29D8A]" />
          <span className="text-[#2D3A31]">Area Warning (5-10% Variance)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#C27B66]" />
          <span className="text-[#2D3A31]">Critical / Encroachment Overlap</span>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainer} className="w-full h-full min-h-[450px]" />

      {/* Selected Parcel Inspector Floating Card */}
      {selectedFeature && (
        <div className="absolute top-4 right-14 z-20 w-84 bg-white rounded-3xl shadow-[0_20px_40px_rgba(45,58,49,0.12)] border border-[#E6E2DA] p-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase font-serif tracking-widest text-[#8C9A84] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full">
                Cadastral Survey Parcel
              </span>
              <h3 className="text-base font-serif font-bold text-[#2D3A31] mt-1.5">
                Survey No: <span className="font-mono">{selectedFeature.survey_number}</span>
              </h3>
              <p className="text-xs text-[#8C9A84]">{selectedFeature.village} Village, {selectedFeature.district}</p>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-[#8C9A84] hover:text-[#2D3A31] text-sm font-bold p-1 rounded-full hover:bg-[#F2F0EB]"
            >
              ✕
            </button>
          </div>

          <div className="mt-3.5 space-y-2 text-xs border-t border-[#E6E2DA] pt-3">
            <div className="flex justify-between">
              <span className="text-[#8C9A84]">Registered Owner:</span>
              <span className="font-semibold text-[#2D3A31]">{selectedFeature.owner_name || 'Ravi Kumar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C9A84]">GIS Calculated Area:</span>
              <span className="font-mono font-semibold text-[#2D3A31]">{selectedFeature.gis_area_acres} Acres</span>
            </div>
            {selectedFeature.document_area_acres && (
              <div className="flex justify-between">
                <span className="text-[#8C9A84]">Document Deed Area:</span>
                <span className="font-mono font-semibold text-[#2D3A31]">{selectedFeature.document_area_acres} Acres</span>
              </div>
            )}
            {selectedFeature.area_deviation_pct !== undefined && (
              <div className="flex justify-between">
                <span className="text-[#8C9A84]">Area Deviation:</span>
                <span className={`font-mono font-bold ${selectedFeature.area_deviation_pct > 5 ? 'text-[#C27B66]' : 'text-[#8C9A84]'}`}>
                  {selectedFeature.area_deviation_pct}%
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#8C9A84]">Validation Score:</span>
              <span className="font-bold font-mono text-[#2D3A31] bg-[#F2F0EB] px-2.5 py-0.5 rounded-full border border-[#E6E2DA]">
                {selectedFeature.validation_score}%
              </span>
            </div>

            {/* Overlap Encroachment Warning */}
            {selectedFeature.has_overlap && (
              <div className="p-3 bg-[#C27B66]/10 border border-[#C27B66]/30 rounded-2xl text-[#C27B66] text-[11px] flex items-start gap-2 mt-2.5">
                <AlertTriangle className="w-4 h-4 text-[#C27B66] shrink-0 mt-0.5" />
                <div>
                  <b className="font-serif font-bold">Boundary Overlap Detected!</b>
                  <p className="mt-0.5 text-[10px] leading-tight">Overlaps with adjacent cadastral survey claims.</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Link */}
          {selectedFeature.record_id ? (
            <Link
              href={`/records/${selectedFeature.record_id}`}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              <span>View Full Land Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/records"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#8C9A84] hover:bg-[#73826B] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              <span>Open in Records Registry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
