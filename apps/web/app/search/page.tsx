'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Sparkles, 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  MapPin,
  User
} from 'lucide-react';
import { api } from '@/lib/api';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.search(searchTerm);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const quickPills = ['145/2A', 'Ravi Kumar', 'ரவிகுமார்', '89/1', 'Thudupathi', 'P-88421'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D3A31] tracking-tight">
          Global Intelligent <span className="italic font-normal">Land Search</span>
        </h1>
        <p className="text-xs text-[#2D3A31]/70 mt-1">
          Search across survey numbers, transliterated owner names, patta numbers, and village jurisdictions with fuzzy phonetic matching.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E2DA] shadow-[0_4px_20px_rgba(45,58,49,0.03)] space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative flex items-center"
        >
          <Search className="w-5 h-5 text-[#2D3A31]/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Survey No (145/2A), Owner (Ravi Kumar / ரவிகுமார்), Patta No, Village..."
            className="w-full pl-12 pr-32 py-3.5 bg-[#F2F0EB] border border-[#E6E2DA] rounded-full text-xs font-medium text-[#2D3A31] placeholder-[#2D3A31]/40 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 focus:border-[#8C9A84] transition-all"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-5 py-2 bg-[#2D3A31] hover:bg-[#1f2822] disabled:opacity-50 text-[#F9F8F4] rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8C9A84]" />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Quick Search Suggestions */}
        <div className="flex items-center gap-2 text-xs flex-wrap pt-1">
          <span className="text-[11px] font-semibold text-[#2D3A31]/60">Quick Searches:</span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                setQuery(pill);
                handleSearch(pill);
              }}
              className="text-[11px] font-mono bg-[#F2F0EB] hover:bg-[#8C9A84]/20 hover:text-[#2D3A31] text-[#2D3A31]/80 px-3 py-1 rounded-full border border-[#E6E2DA] transition-all"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-[#2D3A31]/70 border border-[#E6E2DA]">
            Scanning land record database & phonetic index...
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E6E2DA]">
            <Search className="w-8 h-8 text-[#2D3A31]/30 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-[#2D3A31]">No matching records found</h3>
            <p className="text-[11px] text-[#2D3A31]/60 mt-0.5">Try searching with a partial survey number or alternate spelling.</p>
          </div>
        ) : (
          results.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-3xl border border-[#E6E2DA] p-5 shadow-[0_4px_20px_rgba(45,58,49,0.03)] hover:border-[#8C9A84] transition-all flex items-center justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#2D3A31] bg-[#F2F0EB] px-2.5 py-0.5 rounded-full border border-[#E6E2DA]">
                    {rec.record_id}
                  </span>
                  <span className="font-mono font-bold text-xs text-[#2D3A31]">
                    Survey No: {rec.property?.survey_number}
                  </span>
                  <span className="text-[10px] font-semibold text-[#2D3A31] bg-[#8C9A84]/20 px-2.5 py-0.5 rounded-full border border-[#8C9A84]/30">
                    {rec.validation_score}% Score
                  </span>
                </div>

                <div className="text-xs font-semibold text-[#2D3A31]">
                  Owner: {rec.owner?.name} (S/o {rec.owner?.father_name || 'N/A'})
                </div>

                <div className="text-[11px] text-[#2D3A31]/70 flex items-center gap-3">
                  <span>Village: <b className="text-[#2D3A31]">{rec.location?.village}</b></span>
                  <span>Area: <b className="text-[#2D3A31]">{rec.property?.area} {rec.property?.area_unit}</b></span>
                  <span>District: <b className="text-[#2D3A31]">{rec.location?.district}</b></span>
                </div>
              </div>

              <Link
                href={`/records/${rec.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F2F0EB] hover:bg-[#2D3A31] hover:text-[#F9F8F4] text-[#2D3A31] rounded-full text-xs font-semibold border border-[#E6E2DA] transition-all shrink-0"
              >
                <span>View Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#2D3A31]/70">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
