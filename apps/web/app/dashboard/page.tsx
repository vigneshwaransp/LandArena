'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Upload, 
  Map, 
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Activity,
  Leaf
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Building, 
  Globe, 
  ChevronRight, 
  Check, 
  Layers, 
  Compass 
} from 'lucide-react';
import { api } from '@/lib/api';
import { MOCK_DASHBOARD_STATS } from '@/lib/mockData';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [dilrmp, setDilrmp] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const [statsData, dilrmpData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getDILRMPStatus().catch(() => null)
        ]);
        if (!isMounted) return;
        if (statsData && typeof statsData.total_records !== 'undefined') {
          setStats(statsData);
        } else {
          setStats(MOCK_DASHBOARD_STATS);
        }
        setDilrmp(dilrmpData);
      } catch (err) {
        console.warn('Dashboard stats fallback activated:', err);
        if (isMounted) setStats(MOCK_DASHBOARD_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#8C9A84] animate-spin" />
          <span className="text-xs font-serif italic text-[#8C9A84]">Aggregating cadastral intelligence...</span>
        </div>
      </div>
    );
  }

  // Chart Data preparation
  const trendData = [
    { month: 'Jan', records: 120, verified: 95 },
    { month: 'Feb', records: 210, verified: 175 },
    { month: 'Mar', records: 340, verified: 290 },
    { month: 'Apr', records: 480, verified: 420 },
    { month: 'May', records: 610, verified: 550 },
    { month: 'Jun', records: 780, verified: 690 },
    { month: 'Jul', records: stats?.total_records || 25, verified: stats?.verified_records || 18 },
  ];

  const riskPieData = [
    { name: 'Low Risk', value: stats?.records_by_risk?.LOW || 18, color: '#8C9A84' },
    { name: 'Medium Risk', value: stats?.records_by_risk?.MEDIUM || 5, color: '#DCCFC2' },
    { name: 'High / Critical Risk', value: (stats?.records_by_risk?.HIGH || 0) + (stats?.records_by_risk?.CRITICAL || 2), color: '#C27B66' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A31] tracking-tight">
              Cadastral Intelligence <span className="italic font-normal text-[#8C9A84]">&amp; Land Ledger</span>
            </h1>
            <span className="text-[10px] bg-[#8C9A84]/15 text-[#2D3A31] font-serif uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-[#8C9A84]/30">
              Live GIS &amp; OCR
            </span>
          </div>
          <p className="text-xs text-[#8C9A84] mt-1.5 max-w-2xl font-sans">
            Real-time status of digitized legacy deeds, cadastral polygon validations, and fraud risk indicators.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] rounded-full text-xs font-semibold shadow-sm transition-all"
          >
            <Map className="w-3.5 h-3.5 text-[#8C9A84]" strokeWidth={1.75} />
            <span>Open Cadastral Map</span>
          </Link>
          <Link
            href="/documents/upload"
            className="flex items-center gap-2 px-5 py-2 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-[#DCCFC2]" strokeWidth={1.75} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Records */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col justify-between hover:shadow-[0_15px_35px_rgba(45,58,49,0.1)] transition-all">
          <div className="flex items-center justify-between text-[#8C9A84]">
            <span className="text-[10px] font-serif uppercase tracking-widest font-semibold">Total Land Records</span>
            <div className="w-9 h-9 rounded-full bg-[#F2F0EB] text-[#2D3A31] flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#2D3A31]">{stats?.total_records || 25}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#4F6C57] font-medium mt-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{stats?.processed_today || 5} processed today</span>
            </div>
          </div>
        </div>

        {/* Verified Records */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col justify-between hover:shadow-[0_15px_35px_rgba(45,58,49,0.1)] transition-all">
          <div className="flex items-center justify-between text-[#8C9A84]">
            <span className="text-[10px] font-serif uppercase tracking-widest font-semibold">Verified Records</span>
            <div className="w-9 h-9 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-[#4F6C57]" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#2D3A31]">{stats?.verified_records || 18}</div>
            <div className="text-[11px] text-[#8C9A84] font-medium mt-1.5">
              {stats?.total_records ? Math.round((stats.verified_records / stats.total_records) * 100) : 75}% statutory verification rate
            </div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col justify-between hover:shadow-[0_15px_35px_rgba(45,58,49,0.1)] transition-all">
          <div className="flex items-center justify-between text-[#8C9A84]">
            <span className="text-[10px] font-serif uppercase tracking-widest font-semibold">Pending Review</span>
            <div className="w-9 h-9 rounded-full bg-[#DCCFC2]/30 text-[#2D3A31] flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-4 h-4 text-[#8C4634]" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#2D3A31]">{stats?.pending_verification || 5}</div>
            <div className="text-[11px] text-[#8C4634] font-medium mt-1.5">
              Requires revenue officer review
            </div>
          </div>
        </div>

        {/* High Risk Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col justify-between hover:shadow-[0_15px_35px_rgba(45,58,49,0.1)] transition-all">
          <div className="flex items-center justify-between text-[#8C9A84]">
            <span className="text-[10px] font-serif uppercase tracking-widest font-semibold">Fraud Risk Alerts</span>
            <div className="w-9 h-9 rounded-full bg-[#C27B66]/15 text-[#C27B66] flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-4 h-4 text-[#C27B66]" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-serif font-bold text-[#C27B66]">{stats?.high_risk_records || 2}</div>
            <div className="text-[11px] text-[#C27B66] font-medium mt-1.5">
              Boundary overlap / Date anomaly
            </div>
          </div>
        </div>
      </div>

      {/* OCR & Validation Quality Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#2D3A31] text-[#F9F8F4] rounded-3xl p-6 md:p-8 border border-[#3D5544] shadow-[0_20px_40px_rgba(45,58,49,0.12)]">
        <div>
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="text-[#C2D1C6] font-serif">Average OCR Recognition Confidence</span>
            <span className="font-bold text-[#8C9A84] font-mono text-sm">{stats?.average_ocr_confidence || 94.2}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#1E2822] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#8C9A84] rounded-full transition-all duration-500"
              style={{ width: `${stats?.average_ocr_confidence || 94.2}%` }}
            />
          </div>
          <span className="text-[10px] text-[#8C9A84] mt-2 block">Multilingual OCR across English, தமிழ் (Tamil), and हिन्दी (Hindi).</span>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="text-[#C2D1C6] font-serif">Average Cadastral Validation Composite Score</span>
            <span className="font-bold text-[#DCCFC2] font-mono text-sm">{stats?.average_validation_score || 89.5}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#1E2822] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#DCCFC2] rounded-full transition-all duration-500"
              style={{ width: `${stats?.average_validation_score || 89.5}%` }}
            />
          </div>
          <span className="text-[10px] text-[#8C9A84] mt-2 block">Evaluated across Owner, Survey, Area, Location, and PostGIS checks.</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
                Digitization &amp; Verification Velocity
              </h3>
              <p className="text-[11px] text-[#8C9A84]">Monthly cumulative volume of digitized deeds</p>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#2D3A31] bg-[#F2F0EB] px-3 py-1 rounded-full border border-[#E6E2DA]">
              FY 2026
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8C9A84" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8C9A84" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F0EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8C9A84' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8C9A84' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#2D3A31', borderColor: '#3D5544', borderRadius: '16px', color: '#F9F8F4', fontSize: '11px' }}
                  itemStyle={{ color: '#F9F8F4' }}
                />
                <Area type="monotone" dataKey="records" stroke="#2D3A31" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRec)" name="Digitized Records" />
                <Area type="monotone" dataKey="verified" stroke="#8C9A84" strokeWidth={2} fillOpacity={0} name="Approved Records" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Donut Chart (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
              Risk Level Distribution
            </h3>
            <p className="text-[11px] text-[#8C9A84]">Breakdown of AI anomaly detections</p>
          </div>

          <div className="h-52 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#2D3A31', borderColor: '#3D5544', borderRadius: '16px', color: '#F9F8F4', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E6E2DA] text-center">
            {riskPieData.map((item) => (
              <div key={item.name} className="flex flex-col">
                <span className="text-[10px] text-[#8C9A84] truncate">{item.name}</span>
                <span className="text-xs font-serif font-bold font-mono mt-0.5" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State-wise and District-wise Digitization Progress (DILRMP) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6E2DA]">
          <div>
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#8C9A84]" />
              <h2 className="text-base font-serif font-bold text-[#2D3A31]">
                State-wise &amp; District-wise Digitization Progress (DILRMP)
              </h2>
            </div>
            <p className="text-xs text-[#8C9A84] mt-0.5">
              National land records modernization compliance monitoring across states and districts.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1 bg-[#8C9A84]/15 text-[#2D3A31] rounded-full font-semibold border border-[#8C9A84]/30">
              National Score: 95.2%
            </span>
          </div>
        </div>

        {/* National Core Components Mini-KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F9F8F4] rounded-2xl border border-[#E6E2DA]">
            <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold block">RoR Computerization</span>
            <div className="text-xl font-serif font-bold text-[#2D3A31] mt-1">{dilrmp?.national_digitization_pct || 95.2}%</div>
            <span className="text-[10px] text-[#8C9A84]">18.4 Cr Land Parcels</span>
          </div>
          <div className="p-4 bg-[#F9F8F4] rounded-2xl border border-[#E6E2DA]">
            <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold block">Cadastral Maps Georeferenced</span>
            <div className="text-xl font-serif font-bold text-[#2D3A31] mt-1">{dilrmp?.cadastral_maps_georeferenced_pct || 89.6}%</div>
            <span className="text-[10px] text-[#8C9A84]">24.6 Lakh FMB Maps</span>
          </div>
          <div className="p-4 bg-[#F9F8F4] rounded-2xl border border-[#E6E2DA]">
            <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold block">Mutation Integration</span>
            <div className="text-xl font-serif font-bold text-[#2D3A31] mt-1">{dilrmp?.roor_mutation_integration_pct || 93.4}%</div>
            <span className="text-[10px] text-[#8C9A84]">Auto-mutation synced</span>
          </div>
          <div className="p-4 bg-[#F9F8F4] rounded-2xl border border-[#E6E2DA]">
            <span className="text-[10px] uppercase font-serif text-[#8C9A84] font-semibold block">SRO Office Integration</span>
            <div className="text-xl font-serif font-bold text-[#2D3A31] mt-1">{dilrmp?.sro_revenue_integration_pct || 91.7}%</div>
            <span className="text-[10px] text-[#8C9A84]">5,182 of 5,329 SROs</span>
          </div>
        </div>

        {/* State Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(dilrmp?.state_rankings || [
            { state_name: 'Tamil Nadu' },
            { state_name: 'Karnataka' },
            { state_name: 'Maharashtra' },
            { state_name: 'Gujarat' },
            { state_name: 'Uttar Pradesh' },
            { state_name: 'Madhya Pradesh' }
          ]).map((st: any) => (
            <button
              key={st.state_name}
              onClick={() => setSelectedState(st.state_name)}
              className={`px-4 py-1.5 rounded-full text-xs font-serif font-medium whitespace-nowrap transition-all ${
                selectedState === st.state_name
                  ? 'bg-[#2D3A31] text-[#F9F8F4] shadow-sm font-semibold'
                  : 'bg-[#F2F0EB] text-[#2D3A31] hover:bg-[#E6E2DA]'
              }`}
            >
              {st.state_name}
            </button>
          ))}
        </div>

        {/* Selected State & District Drill-Down */}
        {(() => {
          const stateObj = (dilrmp?.state_rankings || []).find((s: any) => s.state_name === selectedState) || (dilrmp?.state_rankings || [])[0];
          if (!stateObj) return null;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: State Score Overview */}
              <div className="lg:col-span-4 bg-[#F9F8F4] p-5 rounded-2xl border border-[#E6E2DA] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#2D3A31]">{stateObj.state_name}</span>
                  <span className="text-xs font-mono font-bold text-[#4F6C57] bg-[#8C9A84]/15 px-2.5 py-0.5 rounded-full">
                    {stateObj.overall_dilrmp_score}% Score
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8C9A84]">Villages Digitized:</span>
                      <span className="font-mono font-semibold text-[#2D3A31]">{stateObj.digitized_villages_pct}%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#8C9A84] h-full" style={{ width: `${stateObj.digitized_villages_pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8C9A84]">Cadastral Maps Digitized:</span>
                      <span className="font-mono font-semibold text-[#2D3A31]">{stateObj.cadastral_maps_digitized_pct}%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2D3A31] h-full" style={{ width: `${stateObj.cadastral_maps_digitized_pct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8C9A84]">Mutation Computerized:</span>
                      <span className="font-mono font-semibold text-[#2D3A31]">{stateObj.mutation_computerized_pct}%</span>
                    </div>
                    <div className="w-full bg-[#E6E2DA] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#8C9A84] h-full" style={{ width: `${stateObj.mutation_computerized_pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6E2DA] text-[10px] text-[#8C9A84]">
                  Total Villages: <b className="text-[#2D3A31]">{stateObj.total_villages?.toLocaleString()}</b> • Districts: <b className="text-[#2D3A31]">{stateObj.districts_count}</b>
                </div>
              </div>

              {/* Right: District Breakdown Table */}
              <div className="lg:col-span-8 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2DA] text-[#8C9A84] font-serif uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">District Name</th>
                      <th className="py-2.5 px-3">Digitized Parcels</th>
                      <th className="py-2.5 px-3">Progress</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA]/60">
                    {(stateObj.top_districts || []).map((d: any) => (
                      <tr key={d.district} className="hover:bg-[#F9F8F4]">
                        <td className="py-3 px-3 font-medium text-[#2D3A31]">{d.district}</td>
                        <td className="py-3 px-3 font-mono text-[#8C9A84]">{d.digitized_parcels?.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-[#F2F0EB] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#8C9A84] h-full" style={{ width: `${d.progress_pct}%` }} />
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-[#2D3A31]">{d.progress_pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            d.status === 'COMPLETED'
                              ? 'bg-[#8C9A84]/15 text-[#4F6C57]'
                              : 'bg-[#DCCFC2]/40 text-[#8C4634]'
                          }`}>
                            {d.status === 'COMPLETED' ? 'COMPLETED' : 'IN PROGRESS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Recent Audit Ledger */}
      <div className="bg-white rounded-3xl border border-[#E6E2DA] shadow-[0_10px_30px_rgba(45,58,49,0.06)] overflow-hidden">
        <div className="px-6 py-4.5 border-b border-[#E6E2DA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-[#8C9A84]" />
            <h3 className="text-xs font-serif font-bold text-[#2D3A31] uppercase tracking-wider">
              Recent Cadastral Audit Ledger Events
            </h3>
          </div>

          <Link href="/audit-logs" className="text-xs text-[#2D3A31] font-semibold hover:text-[#8C9A84] transition-colors flex items-center gap-1 font-serif">
            <span>View Full Audit Trail</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#8C9A84]" />
          </Link>
        </div>

        <div className="divide-y divide-[#E6E2DA]/60">
          {(stats?.recent_activity || []).slice(0, 5).map((log: any) => (
            <div key={log.id} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-[#F9F8F4] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F2F0EB] text-[#2D3A31] flex items-center justify-center font-serif font-bold text-xs shadow-sm">
                  {log.user_role?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="font-semibold text-[#2D3A31]">
                    {log.action.replace(/_/g, ' ')}
                    {log.record_id && <span className="font-mono text-[#8C9A84] ml-2">#{log.record_id.slice(-6)}</span>}
                  </div>
                  <div className="text-[11px] text-[#8C9A84]">{log.reason || 'Automated cadastral verification check'}</div>
                </div>
              </div>

              <div className="text-right text-[11px] text-[#8C9A84]">
                <span className="font-medium text-[#2D3A31] block">{log.user_name}</span>
                <span className="font-mono">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
