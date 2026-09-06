'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'ADMIN', email: 'admin@example.com', pass: 'admin123', label: 'District Admin', desc: 'Full System & Verification Access' },
    { role: 'OFFICER', email: 'officer@example.com', pass: 'officer123', label: 'Revenue Officer', desc: 'Tahsildar Review & Approval' },
    { role: 'VERIFIER', email: 'verifier@example.com', pass: 'verifier123', label: 'Cadastral Verifier', desc: 'Spatial GIS & Field Verification' },
    { role: 'VIEWER', email: 'viewer@example.com', pass: 'viewer123', label: 'Citizen / Viewer', desc: 'Read-only Record Registry' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex flex-col justify-center items-center p-6 text-[#2D3A31] relative">
      <div className="w-full max-w-md bg-[#2D3A31] border border-[#3E4E43] rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(45,58,49,0.25)] relative overflow-hidden">
        {/* Subtle Decorative Aura */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8C9A84]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#C27B66]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#8C9A84]/20 border border-[#8C9A84]/40 flex items-center justify-center text-[#8C9A84] mb-3.5 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#F9F8F4] tracking-wide">
            Land Record <span className="italic font-normal">Intelligence</span>
          </h1>
          <p className="text-xs text-[#8C9A84] font-medium mt-1">
            SIH 2026 • Government Digitization & Validation Portal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#C27B66]/20 border border-[#C27B66]/40 rounded-2xl text-xs text-[#F9F8F4]">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-[#F9F8F4]/80 mb-1.5">Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C9A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#232D26] border border-[#3E4E43] rounded-full text-xs text-[#F9F8F4] placeholder:text-[#F9F8F4]/40 focus:outline-none focus:border-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84]/30 transition-all"
                placeholder="officer@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F9F8F4]/80 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C9A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#232D26] border border-[#3E4E43] rounded-full text-xs text-[#F9F8F4] placeholder:text-[#F9F8F4]/40 focus:outline-none focus:border-[#8C9A84] focus:ring-2 focus:ring-[#8C9A84]/30 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#8C9A84] hover:bg-[#9cb094] disabled:opacity-50 text-[#2D3A31] font-bold rounded-full text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-3"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Login Accounts */}
        <div className="mt-8 pt-6 border-t border-[#3E4E43] relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C9A84] mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH Demo Fast-Login</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className={`p-2.5 rounded-2xl text-left border transition-all text-xs ${
                  email === acc.email
                    ? 'bg-[#8C9A84]/25 border-[#8C9A84] text-[#F9F8F4]'
                    : 'bg-[#232D26] border-[#3E4E43] text-[#F9F8F4]/70 hover:border-[#8C9A84]/60 hover:text-[#F9F8F4]'
                }`}
              >
                <div className="font-bold text-[11px] text-[#F9F8F4]">{acc.label}</div>
                <div className="text-[10px] text-[#8C9A84] truncate mt-0.5">{acc.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
