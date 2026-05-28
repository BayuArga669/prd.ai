'use client';

import TopBar from '@/components/TopBar';
import { useState, useEffect, useMemo } from 'react';

interface DocumentRow {
  id: number;
  title: string;
  status: string;
  template_type: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalyticsData {
  totalDocs: number;
  byStatus: Record<string, number>;
  byTemplate: Record<string, number>;
  recentDocs: DocumentRow[];
  docsPerDay: { date: string; count: number }[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function AnalyticsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/documents?limit=500');
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const analytics: AnalyticsData = useMemo(() => {
    const now = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[timeframe];
    const cutoff = new Date(now.getTime() - days * 86400000);

    const filtered = documents.filter((d) => new Date(d.created_at) >= cutoff);
    
    const byStatus: Record<string, number> = {};
    const byTemplate: Record<string, number> = {};
    
    for (const doc of filtered) {
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      const tpl = doc.template_type || 'Custom';
      byTemplate[tpl] = (byTemplate[tpl] || 0) + 1;
    }

    // Build daily histogram
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < Math.min(days, 14); i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const doc of filtered) {
      const key = new Date(doc.created_at).toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key]++;
      }
    }

    const docsPerDay = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      totalDocs: filtered.length,
      byStatus,
      byTemplate,
      recentDocs: filtered.slice(0, 20),
      docsPerDay,
    };
  }, [documents, timeframe]);

  const maxBarValue = Math.max(...analytics.docsPerDay.map((d) => d.count), 1);

  const filteredAuditDocs = analytics.recentDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    'Draft': '#999',
    'In Progress': '#7c52aa',
    'In Review': '#0096cc',
    'Complete': '#16a34a',
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <TopBar />
        <div className="px-6 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-primary animate-spin mb-4 block">progress_activity</span>
            <p className="text-on-surface-variant font-bold text-lg">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopBar />
      <div className="px-6 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <section className="mt-6 md:mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-headline font-black text-on-background mb-2 tracking-tight">
              <span className="text-shimmer">Analytics</span> 📊
            </h2>
            <p className="text-lg text-on-surface-variant font-bold">Track your PRD generation activity and productivity.</p>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex gap-2 bg-surface-container-high rounded-full p-1">
            {(['7d', '30d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => { setTimeframe(tf); setSelectedBar(null); }}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
                  timeframe === tf
                    ? 'bg-primary text-on-primary shadow-[2px_2px_0_#2e1a28]'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="glass-neo-card p-5 rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border-2 border-primary shadow-[2px_2px_0_#e040a0]">
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
            </div>
            <p className="text-3xl font-black text-on-background">{analytics.totalDocs}</p>
            <p className="text-sm text-on-surface-variant font-bold">Total PRDs</p>
          </div>
          <div className="glass-neo-card p-5 rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center border-2 border-green-500 shadow-[2px_2px_0_#16a34a]">
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
            <p className="text-3xl font-black text-on-background">{analytics.byStatus['Complete'] || 0}</p>
            <p className="text-sm text-on-surface-variant font-bold">Completed</p>
          </div>
          <div className="glass-neo-card p-5 rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center border-2 border-secondary shadow-[2px_2px_0_#7c52aa]">
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
            </div>
            <p className="text-3xl font-black text-on-background">{analytics.byStatus['In Progress'] || 0}</p>
            <p className="text-sm text-on-surface-variant font-bold">In Progress</p>
          </div>
          <div className="glass-neo-card p-5 rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center border-2 border-tertiary shadow-[2px_2px_0_#0096cc]">
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
              </div>
            </div>
            <p className="text-3xl font-black text-on-background">{analytics.byStatus['In Review'] || 0}</p>
            <p className="text-sm text-on-surface-variant font-bold">In Review</p>
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart — Documents over time */}
          <div className="lg:col-span-2 glass-neo-card p-6 rounded-2xl bg-white">
            <h3 className="text-lg font-headline font-black text-on-background mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary font-bold">bar_chart</span>
              Documents Created
            </h3>
            {analytics.docsPerDay.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-on-surface-variant font-bold">
                No data for this timeframe
              </div>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {analytics.docsPerDay.map((day, idx) => {
                  const height = maxBarValue > 0 ? (day.count / maxBarValue) * 100 : 0;
                  const isSelected = selectedBar === idx;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className={`text-xs font-bold transition-opacity ${isSelected ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100 text-on-surface-variant'}`}>
                        {day.count}
                      </span>
                      <button
                        onClick={() => setSelectedBar(isSelected ? null : idx)}
                        className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer min-h-[4px] ${
                          isSelected
                            ? 'bg-primary shadow-[0_0_12px_rgba(224,64,160,0.4)]'
                            : 'bg-primary/30 hover:bg-primary/60'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day.date}: ${day.count} doc(s)`}
                      ></button>
                      <span className="text-[10px] text-on-surface-variant font-bold hidden md:block">
                        {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedBar !== null && analytics.docsPerDay[selectedBar] && (
              <div className="mt-4 p-3 bg-primary-container/30 rounded-xl border border-primary/20">
                <p className="text-sm font-bold text-on-background">
                  📅 {new Date(analytics.docsPerDay[selectedBar].date).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' — '}
                  <span className="text-primary">{analytics.docsPerDay[selectedBar].count} document(s)</span> created
                </p>
              </div>
            )}
          </div>

          {/* Status Breakdown — Donut-style */}
          <div className="glass-neo-card p-6 rounded-2xl bg-white">
            <h3 className="text-lg font-headline font-black text-on-background mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary font-bold">donut_large</span>
              Status Breakdown
            </h3>
            {analytics.totalDocs === 0 ? (
              <div className="flex items-center justify-center h-48 text-on-surface-variant font-bold">
                No documents yet
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics.byStatus).map(([status, count]) => {
                  const percentage = Math.round((count / analytics.totalDocs) * 100);
                  const color = statusColors[status] || '#999';
                  return (
                    <div key={status}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-on-background">{status}</span>
                        <span className="text-sm font-bold" style={{ color }}>{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                {/* Template breakdown */}
                <div className="border-t border-outline-variant/30 pt-4 mt-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">By Template</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics.byTemplate).map(([tpl, count]) => (
                      <span key={tpl} className="text-xs font-bold bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full">
                        {tpl}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Document Audit Log */}
        <section className="glass-neo-card p-6 rounded-2xl bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-headline font-black text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary font-bold">list_alt</span>
              Document Log
            </h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-surface-container rounded-xl border-2 border-transparent focus:border-primary focus:ring-0 text-sm font-bold text-on-surface w-full md:w-64"
              />
            </div>
          </div>

          {filteredAuditDocs.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant font-bold">
              {documents.length === 0 ? 'No documents created yet.' : 'No documents match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-on-surface/10">
                    <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Title</th>
                    <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Created</th>
                    <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-on-surface/5 hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/editor/${doc.id}`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-on-background group-hover:text-primary transition-colors">{doc.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{
                            color: statusColors[doc.status] || '#999',
                            backgroundColor: `${statusColors[doc.status] || '#999'}15`,
                            border: `1px solid ${statusColors[doc.status] || '#999'}40`,
                          }}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-on-surface-variant font-bold">{doc.template_type || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-on-surface-variant font-bold">{timeAgo(doc.created_at)}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-on-surface-variant font-bold">{timeAgo(doc.updated_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
