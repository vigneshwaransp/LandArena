'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Globe, 
  ChevronDown, 
  Check, 
  Sparkles,
  LogOut,
  Leaf
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time?: string;
  type?: string;
  read: boolean;
}

export default function Navbar() {
  const router = useRouter();
  const { user, setUser, language, setLanguage, toggleAssistant } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Demo roles
  const roles: { role: string; name: string; title: string }[] = [
    { role: 'ADMIN', name: 'Dr. S. Arumugam IAS', title: 'District Revenue Officer' },
    { role: 'OFFICER', name: 'K. Selvakumar', title: 'Tahsildar, Perundurai' },
    { role: 'VERIFIER', name: 'P. Meenakshi', title: 'Cadastral Verifier' },
    { role: 'VIEWER', name: 'R. Senthil', title: 'Public Records Viewer' },
  ];

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await api.listNotifications();
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(
            data.map((n: any) => ({
              id: String(n.id),
              title: n.title,
              message: n.message,
              time: n.created_at
                ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recent',
              type: n.channel === 'EMAIL' ? 'critical' : n.channel === 'SMS' ? 'success' : 'warning',
              read: Boolean(n.read),
            }))
          );
          return;
        }
      } catch (err) {
        // Fallback to default notifications
      }

      setNotifications([
        { id: '1', title: 'Critical Fraud Flagged', message: 'Future date on Deed 145/2A-CLONE', time: '5m ago', type: 'critical', read: false },
        { id: '2', title: 'Area Mismatch Warning', message: 'Record 145/2A has 2.45% GIS deviation', time: '12m ago', type: 'warning', read: false },
        { id: '3', title: 'Digitization Complete', message: 'Patta 210/3C verified successfully', time: '1h ago', type: 'success', read: false },
      ]);
    }
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.warn('Backend notifications update deferred:', err);
    }
  };

  const handleNotificationClick = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.warn('Backend notification update deferred:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRoleSwitch = (r: typeof roles[0]) => {
    setUser({
      sub: `demo-${r.role.toLowerCase()}-id`,
      email: `${r.role.toLowerCase()}@example.com`,
      name: r.name,
      role: r.role,
      department: r.title,
    });
    setShowRoleMenu(false);
  };

  return (
    <header className="h-20 bg-[#F9F8F4]/90 backdrop-blur-md border-b border-[#E6E2DA] px-6 md:px-8 flex items-center justify-between z-20 shrink-0">
      {/* Global Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative w-96 max-w-md">
        <Search className="w-4 h-4 text-[#8C9A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Survey No, Owner, Patta, Village..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-[#F2F0EB] text-[#2D3A31] border border-[#E6E2DA] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/30 focus:border-[#2D3A31] transition-all placeholder:text-[#8C9A84]"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2D3A31] bg-[#F2F0EB] hover:bg-[#E6E2DA]/80 border border-[#E6E2DA] rounded-full transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#8C9A84]" />
            <span className="uppercase font-mono font-semibold">{language}</span>
            <ChevronDown className="w-3 h-3 text-[#8C9A84]" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E6E2DA] rounded-2xl shadow-[0_10px_30px_rgba(45,58,49,0.08)] py-1.5 z-50 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#F2F0EB] transition-colors ${language === 'en' ? 'font-bold text-[#2D3A31] bg-[#F2F0EB]/60' : 'text-[#2D3A31]'}`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-[#8C9A84]" />}
              </button>
              <button
                onClick={() => { setLanguage('ta'); setShowLangMenu(false); }}
                className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#F2F0EB] transition-colors ${language === 'ta' ? 'font-bold text-[#2D3A31] bg-[#F2F0EB]/60' : 'text-[#2D3A31]'}`}
              >
                <span>தமிழ் (Tamil)</span>
                {language === 'ta' && <Check className="w-3.5 h-3.5 text-[#8C9A84]" />}
              </button>
              <button
                onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
                className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#F2F0EB] transition-colors ${language === 'hi' ? 'font-bold text-[#2D3A31] bg-[#F2F0EB]/60' : 'text-[#2D3A31]'}`}
              >
                <span>हिन्दी (Hindi)</span>
                {language === 'hi' && <Check className="w-3.5 h-3.5 text-[#8C9A84]" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-[#2D3A31] bg-[#F2F0EB] hover:bg-[#E6E2DA]/80 border border-[#E6E2DA] rounded-full transition-all shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-[#2D3A31]" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#C27B66] text-white font-bold text-[9px] flex items-center justify-center rounded-full shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-84 bg-white border border-[#E6E2DA] rounded-2xl shadow-[0_10px_30px_rgba(45,58,49,0.08)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E6E2DA]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-bold text-[#2D3A31]">Notifications & Alerts</span>
                  {unreadCount > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C27B66]/15 text-[#C27B66] font-mono font-bold">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8C9A84]/15 text-[#4F6C57] font-mono font-medium">
                      All caught up
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className={`text-[10px] font-semibold transition-colors ${
                    unreadCount > 0
                      ? 'text-[#C27B66] hover:underline cursor-pointer'
                      : 'text-[#8C9A84] opacity-50 cursor-default'
                  }`}
                >
                  {unreadCount > 0 ? 'Mark all read' : 'All read ✓'}
                </button>
              </div>
              <div className="divide-y divide-[#E6E2DA]/60 max-h-64 overflow-y-auto mt-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8C9A84]">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)}
                      className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                        n.read
                          ? 'hover:bg-[#F9F8F4] opacity-65'
                          : 'bg-[#F2F0EB]/50 hover:bg-[#F2F0EB] font-medium'
                      }`}
                      title={n.read ? 'Already read' : 'Click to mark as read'}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C27B66] shrink-0" />
                          )}
                          <span
                            className={`text-[11px] ${
                              n.read ? 'font-normal text-[#2D3A31]/80' : 'font-bold'
                            } ${
                              n.type === 'critical'
                                ? 'text-[#C27B66]'
                                : n.type === 'warning'
                                ? 'text-[#8C9A84]'
                                : 'text-[#4F6C57]'
                            }`}
                          >
                            {n.title}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#8C9A84] font-mono shrink-0 ml-2">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#2D3A31]/80 mt-1 pl-3">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Button */}
        <button
          onClick={toggleAssistant}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D3A31] hover:bg-[#1E2822] text-[#F9F8F4] rounded-full text-xs font-medium shadow-sm transition-all duration-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#DCCFC2]" strokeWidth={1.75} />
          <span className="font-serif">Ask AI</span>
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative pl-2 border-l border-[#E6E2DA]">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 text-left hover:bg-[#F2F0EB] p-1.5 rounded-full transition-all pr-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#2D3A31] text-[#F9F8F4] flex items-center justify-center font-serif font-bold text-xs shadow-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#2D3A31] leading-tight">{user?.name}</span>
              <span className="text-[9px] font-mono font-bold text-[#8C9A84] tracking-wide">{user?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C9A84] ml-1" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E6E2DA] rounded-2xl shadow-[0_10px_30px_rgba(45,58,49,0.08)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-[#E6E2DA] text-[10px] uppercase font-serif tracking-wider text-[#8C9A84]">
                Switch Officer Persona
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => handleRoleSwitch(r)}
                  className={`w-full px-4 py-2.5 text-left flex items-start justify-between hover:bg-[#F9F8F4] transition-all ${user?.role === r.role ? 'bg-[#F2F0EB] text-[#2D3A31] font-medium' : 'text-[#2D3A31]'}`}
                >
                  <div>
                    <div className="text-xs font-semibold">{r.name}</div>
                    <div className="text-[10px] text-[#8C9A84]">{r.title}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#E6E2DA] text-[#2D3A31]">
                    {r.role}
                  </span>
                </button>
              ))}
              <div className="border-t border-[#E6E2DA] mt-1.5 pt-1.5 px-3">
                <button 
                  onClick={() => router.push('/login')}
                  className="w-full py-1.5 text-left text-xs text-[#C27B66] font-medium flex items-center gap-2 hover:bg-[#C27B66]/10 rounded-xl px-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
