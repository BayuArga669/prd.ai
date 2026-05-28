'use client';

import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DocumentRow {
  id: number;
  title: string;
  status: string;
  template_type: string | null;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  name: string;
  avatar_url: string | null;
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

const statusConfig: Record<string, { color: string; bg: string; border: string; shadow: string }> = {
  'Draft': { color: 'text-on-surface-variant', bg: 'bg-surface-container-high', border: 'border-on-surface-variant/30', shadow: '#666' },
  'In Progress': { color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/35', shadow: '#7c52aa' },
  'In Review': { color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/35', shadow: '#0096cc' },
  'Complete': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', shadow: '#16a34a' },
};

const statusProgress: Record<string, number> = {
  'Draft': 15,
  'In Progress': 50,
  'In Review': 80,
  'Complete': 100,
};

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, docsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/documents?limit=6'),
        ]);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData.documents || []);
          setDocCount(docsData.documents?.length || 0);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const userName = user?.name || 'User';

  return (
    <div className="h-full overflow-y-auto bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopBar initialAvatarUrl={user?.avatar_url || null} />
      <div className="px-6 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full flex flex-col gap-10">
        
        {/* Welcome Section */}
        <section className="mt-6 md:mt-2 relative">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <h2 className="text-4xl md:text-5xl font-headline font-black text-on-background mb-2 tracking-tight">
            Welcome back, <span className="text-shimmer">{userName}!</span> 👋
          </h2>
          <p className="text-lg text-on-surface-variant font-bold">
            {docCount > 0
              ? `You have ${docCount} document${docCount !== 1 ? 's' : ''}. Ready to build something amazing?`
              : 'Ready to create your first PRD?'}
          </p>
        </section>

        {/* Hero/CTA Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main CTA Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-primary-container to-secondary-container rounded-[2rem] p-8 border-4 border-on-surface shadow-[8px_8px_0_#2e1a28] relative overflow-hidden group hover:shadow-[12px_12px_0_#2e1a28] hover:-translate-y-1 transition-all duration-300">
            <div className="relative z-10 w-full md:w-2/3 flex flex-col h-full justify-center text-left">
              <span className="bg-white border-2 border-on-surface text-primary font-black text-xs px-4 py-1.5 rounded-full w-fit mb-4 shadow-[2px_2px_0_#2e1a28] rotate-[-2deg]">
                AI Powered v2.0
              </span>
              <h3 className="text-3xl md:text-4xl font-headline font-black text-on-surface mb-3 leading-tight">
                Generate a comprehensive PRD in seconds.
              </h3>
              <p className="text-on-surface-variant mb-8 font-bold text-sm md:text-base leading-relaxed">
                Just describe your feature, specify your target audience, and let the AI do the heavy documentation lifting.
              </p>
              <Link href="/wizard" className="pop-btn w-fit text-white font-black rounded-xl py-4 px-8 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 select-none">
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Start Generating Spec
              </Link>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary rounded-full opacity-10 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-secondary rounded-full opacity-15 blur-xl group-hover:scale-110 transition-transform duration-500 delay-100"></div>
            <div className="absolute right-10 bottom-10 w-48 h-48 bg-white/10 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-1000 hidden md:flex">
              <span className="material-symbols-outlined text-[100px] text-white/30 animate-pulse">model_training</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-neo-card p-6 rounded-[2rem] flex flex-col justify-between text-left bg-white">
            <div>
              <div className="w-12 h-12 bg-tertiary/10 text-tertiary border-2 border-tertiary rounded-xl flex items-center justify-center mb-5 shadow-[2px_2px_0_#0096cc] rotate-[-4deg]">
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome_motion</span>
              </div>
              <h4 className="text-2xl font-headline font-black text-on-background mb-1">Templates</h4>
              <p className="text-sm text-on-surface-variant font-bold">Start from 6+ proven document presets.</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/templates" className="w-full bg-white hover:bg-surface-container-low text-on-background font-bold rounded-xl border-2 border-on-surface p-3.5 shadow-[3px_3px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all flex items-center justify-between group">
                <span>SaaS Product Launch</span>
                <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform font-bold">arrow_forward</span>
              </Link>
              <Link href="/templates" className="w-full bg-white hover:bg-surface-container-low text-on-background font-bold rounded-xl border-2 border-on-surface p-3.5 shadow-[3px_3px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all flex items-center justify-between group">
                <span>Mobile App Feature</span>
                <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform font-bold">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Documents Section */}
        <section className="text-left">
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-headline font-black text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary font-bold">folder_open</span>
              Recent Documents
              {!loading && docCount > 0 && (
                <span className="text-sm font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-0.5 rounded-full ml-1">{docCount}</span>
              )}
            </h3>
            {docCount > 0 && (
              <Link className="text-primary font-extrabold hover:underline flex items-center gap-1 text-sm md:text-base decoration-2 underline-offset-4" href="/editor">
                View All <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
              </Link>
            )}
          </div>
          
          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-neo-card p-6 rounded-2xl bg-white animate-pulse">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-11 h-11 bg-surface-container-high rounded-xl"></div>
                    <div className="w-6 h-6 bg-surface-container-high rounded"></div>
                  </div>
                  <div className="h-6 bg-surface-container-high rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-surface-container-high rounded w-full mb-2"></div>
                  <div className="h-4 bg-surface-container-high rounded w-2/3 mb-6"></div>
                  <div className="h-2 bg-surface-container-high rounded-full mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-20 bg-surface-container-high rounded"></div>
                    <div className="h-4 w-24 bg-surface-container-high rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            /* Empty State */
            <div className="glass-neo-card p-12 rounded-2xl bg-white text-center">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-dashed border-primary/30">
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>note_add</span>
              </div>
              <h4 className="text-2xl font-headline font-black text-on-background mb-3">No documents yet</h4>
              <p className="text-on-surface-variant font-bold mb-8 max-w-md mx-auto">
                Create your first PRD using our AI-powered wizard or start from a template.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/wizard" className="pop-btn text-white font-black rounded-xl py-3 px-6 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Generate with AI
                </Link>
                <Link href="/templates" className="bg-white hover:bg-surface-container-low text-on-background font-bold rounded-xl border-2 border-on-surface py-3 px-6 shadow-[3px_3px_0_#2e1a28] hover:-translate-y-0.5 transition-all flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined font-bold">dashboard</span>
                  Browse Templates
                </Link>
              </div>
            </div>
          ) : (
            /* Real Document Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {documents.map((doc) => {
                const config = statusConfig[doc.status] || statusConfig['Draft'];
                const progress = statusProgress[doc.status] || 15;
                const iconColors = ['primary', 'secondary', 'tertiary'];
                const colorIdx = doc.id % 3;
                const iconColor = iconColors[colorIdx];

                return (
                  <Link
                    key={doc.id}
                    href={`/editor/${doc.id}`}
                    className="glass-neo-card p-6 rounded-2xl flex flex-col justify-between bg-white relative transition-all group cursor-pointer"
                    style={{ ['--hover-shadow' as string]: config.shadow }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div className={`w-11 h-11 bg-${iconColor}/10 text-${iconColor} border-2 border-${iconColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-[2px_2px_0_${config.shadow}]`}>
                          <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                        </div>
                        {doc.template_type && (
                          <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">
                            {doc.template_type}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-black text-on-background mb-2 line-clamp-2">{doc.title}</h4>
                      <p className="text-sm text-on-surface-variant font-bold mb-6">
                        Created {timeAgo(doc.created_at)}
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="w-full bg-surface-container-low border border-on-surface/10 h-2 rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: config.shadow,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-extrabold ${config.color} ${config.bg} border ${config.border} px-3 py-1 rounded-md`}>
                          {doc.status}
                        </span>
                        <span className="text-on-surface-variant/75 font-bold">Updated {timeAgo(doc.updated_at)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
