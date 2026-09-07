'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  AlertTriangle, 
  ExternalLink,
  Compass,
  UserCheck,
  MapPin,
  ChevronDown,
  Layers,
  Building,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { MOCK_GEOJSON, MOCK_TAHSILDARS } from '@/lib/mockData';

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
  const hqMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [basemap, setBasemap] = useState<'streets' | 'satellite'>('streets');

  // Tahsildar Jurisdiction State
  const [tahsildars, setTahsildars] = useState<any[]>(MOCK_TAHSILDARS);
  const [selectedTahsildar, setSelectedTahsildar] = useState<any | null>(null);
  const [showTahsildarMenu, setShowTahsildarMenu] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Live GPS Cursor Coordinates Tracker
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Government Systems Overlay Toggles
  const [showOverlaysMenu, setShowOverlaysMenu] = useState(false);
  const [govOverlays, setGovOverlays] = useState({
    dilrmpGrid: true,
    stateLrms: true,
    sroRegistry: false,
  });

  // Load Tahsildars from API or fallback
  useEffect(() => {
    async function fetchTahsildars() {
      try {
        const data = await api.getTahsildars();
        if (Array.isArray(data) && data.length > 0) {
          setTahsildars(data);
        }
      } catch (err) {
        console.warn('Using fallback Tahsildars list:', err);
      }
    }
    fetchTahsildars();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Default center: Erode District Headquarters
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

    // Track live cursor coordinates
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: Number(e.lngLat.lat.toFixed(6)),
        lng: Number(e.lngLat.lng.toFixed(6)),
      });
    });

    map.on('mouseout', () => {
      setCursorCoords(null);
    });

    map.on('load', async () => {
      try {
        let geojson: any;
        try {
          geojson = await api.getParcelsGeoJSON();
          if (!geojson || !geojson.features || geojson.features.length === 0) {
            geojson = MOCK_GEOJSON;
          }
        } catch {
          geojson = MOCK_GEOJSON;
        }

        // Add parcels GeoJSON source
        map.addSource('parcels-source', {
          type: 'geojson',
          data: geojson,
        });

        // 1. Cadastral Parcel Polygon Fill
        map.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'risk_level'],
              'CRITICAL', '#C27B66',
              'HIGH', '#D08C7B',
              'MEDIUM', '#DCCFC2',
              '#8C9A84'
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.75,
              0.5
            ],
          },
        });

        // 2. Cadastral Parcel Boundary Line
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

        // 3. Cadastral Survey Labels
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

        // 4. Tahsildar Administrative Boundary Source & Layers (Initialized empty)
        map.addSource('tahsildar-boundary-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.addLayer({
          id: 'tahsildar-boundary-fill',
          type: 'fill',
          source: 'tahsildar-boundary-source',
          paint: {
            'fill-color': '#8C9A84',
            'fill-opacity': 0.12,
          }
        });

        map.addLayer({
          id: 'tahsildar-boundary-line',
          type: 'line',
          source: 'tahsildar-boundary-source',
          paint: {
            'line-color': '#2D3A31',
            'line-width': 3,
            'line-dasharray': [4, 2]
          }
        });

        // Click interaction on parcels
        map.on('click', 'parcels-fill', (e) => {
          if (e.features && e.features[0]) {
            const feat = e.features[0];
            setSelectedFeature(feat.properties);
            onParcelSelect?.(feat.properties);
          }
        });

        map.on('mouseenter', 'parcels-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'parcels-fill', () => {
          map.getCanvas().style.cursor = '';
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize GIS Map layers:', err);
        setLoading(false);
      }
    });

    return () => {
      map.remove();
    };
  }, [basemap]);

  // Handle Tahsildar Selection: Fly to Taluk and highlight administrative region
  const handleSelectTahsildar = (tah: any) => {
    setSelectedTahsildar(tah);
    setShowTahsildarMenu(false);
    setSelectedFeature(null);

    const map = mapInstance.current;
    if (!map) return;

    if (!tah) {
      // Clear Tahsildar boundary & reset view to district
      const source = map.getSource('tahsildar-boundary-source') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      if (hqMarkerRef.current) {
        hqMarkerRef.current.remove();
        hqMarkerRef.current = null;
      }
      map.flyTo({ center: [77.7172, 11.3410], zoom: 14.5, duration: 1200 });
      return;
    }

    // 1. Update Tahsildar Boundary GeoJSON Source
    const source = map.getSource('tahsildar-boundary-source') as maplibregl.GeoJSONSource;
    if (source && tah.boundary_geojson) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: tah.boundary_geojson,
            properties: {
              taluk: tah.taluk,
              tahsildar: tah.name,
              area_acres: tah.area_acres
            }
          }
        ]
      });
    }

    // 2. Smoothly fly camera to Tahsildar bounding box
    if (tah.bbox && tah.bbox.length === 4) {
      map.fitBounds(
        [
          [tah.bbox[0], tah.bbox[1]], // Southwest [min_lng, min_lat]
          [tah.bbox[2], tah.bbox[3]]  // Northeast [max_lng, max_lat]
        ],
        {
          padding: 80,
          duration: 1600,
          maxZoom: 15
        }
      );
    } else {
      map.flyTo({
        center: [tah.center.lng, tah.center.lat],
        zoom: 13.5,
        duration: 1500
      });
    }

    // 3. Create / Update Taluk Headquarters Marker
    if (hqMarkerRef.current) {
      hqMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'tahsildar-hq-marker';
    el.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #2D3A31; border: 2.5px solid #F9F8F4; box-shadow: 0 4px 15px rgba(45,58,49,0.35); display: flex; align-items: center; justify-content: center; color: #F9F8F4; font-size: 14px; font-weight: bold;">
          🏛️
        </div>
        <div style="background-color: #2D3A31; color: #F9F8F4; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-family: serif; font-weight: bold; margin-top: 4px; white-space: nowrap; border: 1px solid #3D5544; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          ${tah.taluk} Taluk HQ
        </div>
      </div>
    `;

    hqMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([tah.center.lng, tah.center.lat])
      .addTo(map);
  };

  const copyCoordinates = (lat: number, lng: number) => {
    const text = `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col bg-[#F2F0EB]">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-14 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Main Title Badge */}
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-[0_4px_20px_rgba(45,58,49,0.08)] border border-[#E6E2DA] flex items-center gap-2 text-xs">
            <Compass className="w-4 h-4 text-[#8C9A84]" strokeWidth={1.75} />
            <span className="font-serif font-bold text-[#2D3A31]">Cadastral GIS</span>
          </div>

          {/* Tahsildar Jurisdiction Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTahsildarMenu(!showTahsildarMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-serif font-semibold transition-all shadow-[0_4px_20px_rgba(45,58,49,0.08)] border ${
                selectedTahsildar
                  ? 'bg-[#2D3A31] text-[#F9F8F4] border-[#1E2822]'
                  : 'bg-white/95 backdrop-blur-md text-[#2D3A31] border-[#E6E2DA] hover:bg-[#F2F0EB]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#8C9A84]" />
              <span>
                {selectedTahsildar ? `${selectedTahsildar.name} (${selectedTahsildar.taluk})` : 'Select Tahsildar Jurisdiction'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>

            {showTahsildarMenu && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white/98 backdrop-blur-md rounded-2xl border border-[#E6E2DA] shadow-[0_15px_40px_rgba(45,58,49,0.15)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#E6E2DA] flex items-center justify-between">
                  <span className="text-[10px] uppercase font-serif tracking-widest text-[#8C9A84] font-bold">
                    Revenue Taluks &amp; Tahsildars
                  </span>
                  {selectedTahsildar && (
                    <button
                      onClick={() => handleSelectTahsildar(null)}
                      className="text-[10px] text-[#C27B66] hover:underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset District View</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#E6E2DA]/50 mt-1">
                  {tahsildars.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTahsildar(t)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                        selectedTahsildar?.id === t.id
                          ? 'bg-[#2D3A31] text-[#F9F8F4]'
                          : 'hover:bg-[#F2F0EB] text-[#2D3A31]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-serif font-bold leading-tight">{t.name}</div>
                        <div className={`text-[10px] font-sans mt-0.5 ${selectedTahsildar?.id === t.id ? 'text-[#DCCFC2]' : 'text-[#8C9A84]'}`}>
                          {t.title} • {t.taluk} Taluk
                        </div>
                        <div className={`text-[9px] font-mono mt-1 flex items-center gap-2 ${selectedTahsildar?.id === t.id ? 'text-[#8C9A84]' : 'text-[#4F6C57]'}`}>
                          <span>Lat: {t.center.lat}° N</span>
                          <span>Lng: {t.center.lng}° E</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ml-2 ${
                        selectedTahsildar?.id === t.id
                          ? 'bg-[#F9F8F4] text-[#2D3A31]'
                          : 'bg-[#8C9A84]/15 text-[#2D3A31]'
                      }`}>
                        {t.taluk}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Government Database Overlays Button */}
          <div className="relative">
            <button
              onClick={() => setShowOverlaysMenu(!showOverlaysMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/95 backdrop-blur-md hover:bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] rounded-full text-xs font-medium shadow-[0_4px_20px_rgba(45,58,49,0.08)] transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-[#8C9A84]" />
              <span>Govt DB Layers</span>
              <ChevronDown className="w-3 h-3 text-[#8C9A84]" />
            </button>

            {showOverlaysMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white/98 backdrop-blur-md rounded-2xl border border-[#E6E2DA] shadow-[0_15px_40px_rgba(45,58,49,0.15)] p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="font-serif font-bold text-[11px] text-[#2D3A31] pb-1.5 border-b border-[#E6E2DA]">
                  National &amp; State GIS Integrations
                </div>
                <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-[#F2F0EB] rounded-lg">
                  <span className="text-[11px] text-[#2D3A31]">🏛️ DILRMP National Grid</span>
                  <input
                    type="checkbox"
                    checked={govOverlays.dilrmpGrid}
                    onChange={(e) => setGovOverlays({ ...govOverlays, dilrmpGrid: e.target.checked })}
                    className="accent-[#2D3A31]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-[#F2F0EB] rounded-lg">
                  <span className="text-[11px] text-[#2D3A31]">📜 State LRMS Mutation Sync</span>
                  <input
                    type="checkbox"
                    checked={govOverlays.stateLrms}
                    onChange={(e) => setGovOverlays({ ...govOverlays, stateLrms: e.target.checked })}
                    className="accent-[#2D3A31]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-[#F2F0EB] rounded-lg">
                  <span className="text-[11px] text-[#2D3A31]">🏢 SRO Deed Registration Feed</span>
                  <input
                    type="checkbox"
                    checked={govOverlays.sroRegistry}
                    onChange={(e) => setGovOverlays({ ...govOverlays, sroRegistry: e.target.checked })}
                    className="accent-[#2D3A31]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right: Basemap Switcher */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-full shadow-[0_4px_20px_rgba(45,58,49,0.08)] border border-[#E6E2DA] flex items-center gap-1 pointer-events-auto">
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

      {/* Main Map Canvas */}
      <div ref={mapContainer} className="w-full h-full min-h-[480px]" />

      {/* Bottom-Left Cadastral Parcel Status Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-[0_4px_20px_rgba(45,58,49,0.08)] border border-[#E6E2DA] text-[11px] space-y-1.5 select-none max-w-xs">
        <div className="font-serif font-bold text-[#2D3A31] pb-1 border-b border-[#E6E2DA] flex items-center justify-between">
          <span>Cadastral Parcel Classification</span>
          <span className="text-[9px] font-mono text-[#8C9A84]">PostGIS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8C9A84]" />
          <span className="text-[#2D3A31] text-[10.5px]">Verified (&lt;5% Area Deviation)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DCCFC2] border border-[#B29D8A]" />
          <span className="text-[#2D3A31] text-[10.5px]">Area Warning (5-10% Deviation)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C27B66]" />
          <span className="text-[#2D3A31] text-[10.5px]">Critical / Boundary Encroachment</span>
        </div>
        {selectedTahsildar && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#E6E2DA]/60">
            <span className="w-2.5 h-2.5 rounded-sm border-2 border-dashed border-[#2D3A31] bg-[#8C9A84]/20" />
            <span className="text-[#2D3A31] text-[10.5px] font-semibold">{selectedTahsildar.taluk} Taluk Boundary</span>
          </div>
        )}
      </div>

      {/* Bottom-Right Live GPS Coordinates HUD */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#2D3A31]/95 text-[#F9F8F4] backdrop-blur-md px-4 py-2 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.25)] border border-[#3D5544] text-[11px] font-mono flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8C9A84] animate-pulse" />
          <span className="text-[#8C9A84] uppercase text-[9px] font-sans font-bold tracking-wider">GPS Cursor:</span>
        </div>
        {cursorCoords ? (
          <div className="flex items-center gap-2 text-xs">
            <span>Lat: <b className="text-white">{cursorCoords.lat}° N</b></span>
            <span className="text-[#8C9A84]">|</span>
            <span>Lng: <b className="text-white">{cursorCoords.lng}° E</b></span>
          </div>
        ) : selectedTahsildar ? (
          <div className="flex items-center gap-2 text-xs">
            <span>HQ Lat: <b className="text-[#DCCFC2]">{selectedTahsildar.center.lat}° N</b></span>
            <span className="text-[#8C9A84]">|</span>
            <span>HQ Lng: <b className="text-[#DCCFC2]">{selectedTahsildar.center.lng}° E</b></span>
          </div>
        ) : (
          <span className="text-[10px] text-[#8C9A84] italic">Hover on map for coordinates</span>
        )}
      </div>

      {/* Selected Tahsildar Jurisdiction Inspector Card (Floating Right) */}
      {selectedTahsildar && !selectedFeature && (
        <div className="absolute top-20 right-4 z-20 w-88 max-w-sm bg-white/98 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(45,58,49,0.18)] border border-[#E6E2DA] p-5 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2D3A31] text-[#F9F8F4] flex items-center justify-center font-serif text-lg font-bold shadow-sm">
                🏛️
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase font-serif tracking-widest text-[#8C9A84] bg-[#8C9A84]/15 px-2 py-0.5 rounded-full border border-[#8C9A84]/30">
                  Revenue Jurisdiction
                </span>
                <h3 className="text-sm font-serif font-bold text-[#2D3A31] mt-0.5">
                  {selectedTahsildar.name}
                </h3>
                <p className="text-[11px] text-[#8C9A84]">{selectedTahsildar.title}</p>
              </div>
            </div>
            <button
              onClick={() => handleSelectTahsildar(null)}
              className="text-[#8C9A84] hover:text-[#2D3A31] text-xs font-bold p-1 rounded-full hover:bg-[#F2F0EB]"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Geographic Coordinates Box */}
          <div className="mt-3.5 p-3 bg-[#F9F8F4] rounded-2xl border border-[#E6E2DA] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8C9A84] font-serif font-medium">Headquarters Coordinates:</span>
              <button
                onClick={() => copyCoordinates(selectedTahsildar.center.lat, selectedTahsildar.center.lng)}
                className="flex items-center gap-1 text-[10px] text-[#4F6C57] font-semibold hover:underline"
              >
                {copiedCoords ? <Check className="w-3 h-3 text-[#4F6C57]" /> : <Copy className="w-3 h-3 text-[#8C9A84]" />}
                <span>{copiedCoords ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs font-bold text-[#2D3A31] flex items-center justify-between">
              <span>Latitude: {selectedTahsildar.center.lat.toFixed(4)}° N</span>
              <span>Longitude: {selectedTahsildar.center.lng.toFixed(4)}° E</span>
            </div>
            <div className="text-[10px] text-[#8C9A84] font-mono border-t border-[#E6E2DA] pt-1">
              BBox: [{selectedTahsildar.bbox.join(', ')}]
            </div>
          </div>

          {/* Taluk Statistics Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#F2F0EB] rounded-xl">
              <span className="text-[10px] text-[#8C9A84] uppercase font-serif block">Cadastral Area</span>
              <span className="font-serif font-bold text-[#2D3A31] text-sm">{selectedTahsildar.area_acres?.toLocaleString()} ac</span>
              <span className="text-[9px] text-[#8C9A84] block mt-0.5 font-mono">{selectedTahsildar.area_sqkm} sq km</span>
            </div>
            <div className="p-2.5 bg-[#F2F0EB] rounded-xl">
              <span className="text-[10px] text-[#8C9A84] uppercase font-serif block">Digitized Parcels</span>
              <span className="font-serif font-bold text-[#4F6C57] text-sm">{selectedTahsildar.digitized_parcels?.toLocaleString()}</span>
              <span className="text-[9px] text-[#8C9A84] block mt-0.5 font-mono">of {selectedTahsildar.total_parcels?.toLocaleString()} total</span>
            </div>
          </div>

          {/* Revenue Villages List */}
          <div className="mt-3 text-xs">
            <span className="text-[10px] font-serif uppercase tracking-wider text-[#8C9A84] font-semibold block mb-1">
              Revenue Villages Under Jurisdiction ({selectedTahsildar.revenue_villages?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-white border border-[#E6E2DA] rounded-xl">
              {selectedTahsildar.revenue_villages?.map((v: string) => (
                <span key={v} className="text-[10px] bg-[#F2F0EB] text-[#2D3A31] px-2 py-0.5 rounded-full font-medium border border-[#E6E2DA]/60">
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Contact and Status */}
          <div className="mt-3 pt-2.5 border-t border-[#E6E2DA] flex items-center justify-between text-[11px] text-[#8C9A84]">
            <div className="flex items-center gap-1.5 text-[#4F6C57] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DILRMP: {selectedTahsildar.dilrmp_compliance_pct}%</span>
            </div>
            <a href={`tel:${selectedTahsildar.contact?.phone}`} className="hover:text-[#2D3A31] flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{selectedTahsildar.contact?.phone}</span>
            </a>
          </div>
        </div>
      )}

      {/* Selected Parcel Inspector Floating Card */}
      {selectedFeature && (
        <div className="absolute top-20 right-4 z-20 w-88 max-w-sm bg-white/98 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(45,58,49,0.18)] border border-[#E6E2DA] p-5 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase font-serif tracking-widest text-[#8C9A84] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full border border-[#8C9A84]/30">
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
