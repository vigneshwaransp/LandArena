'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FolderKanban, 
  CheckCircle2, 
  Map, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  History, 
  Settings, 
  Compass,
  Sparkles,
  Bot,
  Leaf,
  BrainCircuit
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { toggleAssistant, isAssistantOpen } = useAppStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Land Records', href: '/records', icon: FolderKanban },
    { name: 'Verification', href: '/verification', icon: CheckCircle2 },
    { name: 'Cadastral GIS Map', href: '/map', icon: Map },
    { name: 'Anomalies & Fraud', href: '/anomalies', icon: AlertTriangle },
    { name: 'ML Intelligence', href: '/ml-center', icon: BrainCircuit },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Reports & Exports', href: '/reports', icon: BarChart3 },
    { name: 'Audit Logs', href: '/audit-logs', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#2D3A31] text-[#E1E8E3] flex flex-col shrink-0 border-r border-[#3D5544] select-none transition-all duration-500">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 gap-3.5 border-b border-[#3D5544]/60 bg-[#1E2822]/40">
        <div className="w-10 h-10 rounded-full bg-[#8C9A84] flex items-center justify-center text-[#2D3A31] font-bold shadow-md">
          <Leaf className="w-5 h-5 text-[#2D3A31]" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col">
          <span className="font-serif font-bold text-base tracking-wide text-[#F9F8F4]">
            Land <span className="italic text-[#DCCFC2]">Intel</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-[#8C9A84] font-medium">
            Cadastral Ledger
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-[#8C9A84] uppercase tracking-widest font-serif">
          Cadastral Modules
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-[#8C9A84] text-[#1E2822] font-semibold shadow-sm'
                  : 'text-[#C2D1C6] hover:bg-[#3D5544]/60 hover:text-[#F9F8F4]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#1E2822]' : 'text-[#8C9A84]'}`} strokeWidth={1.75} />
              <span className="tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Quick Launcher */}
      <div className="p-4 border-t border-[#3D5544]/60 bg-[#1E2822]/20">
        <button
          onClick={toggleAssistant}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-300 ${
            isAssistantOpen 
              ? 'bg-[#C27B66] text-white shadow-md' 
              : 'bg-[#3D5544]/60 text-[#F9F8F4] hover:bg-[#3D5544]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#DCCFC2]" strokeWidth={1.75} />
            <span className="font-serif font-medium">Land Assistant</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#2D3A31] text-[#DCCFC2] uppercase font-mono">
            RAG
          </span>
        </button>
      </div>

      {/* Artisanal Seal Footer */}
      <div className="px-5 py-4 bg-[#1E2822]/60 border-t border-[#3D5544]/60 text-[10px] text-[#9DB3A3] leading-relaxed">
        <p className="font-serif italic text-[#DCCFC2] text-xs">Revenue Administration</p>
        <p className="text-[#8C9A84] mt-0.5">Govt of Tamil Nadu • Cadastral Survey</p>
      </div>
    </aside>
  );
}
