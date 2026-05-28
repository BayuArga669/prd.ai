'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: number;
  title: string;
  status: string;
  template_type: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiDocumentsResponse {
  documents: Document[];
}

interface ApiCreateResponse {
  document: Document;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

type StatusKey = 'draft' | 'in_progress' | 'in_review' | 'complete';

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; border: string; icon: string }> = {
  draft: {
    label: 'Draft',
    color: 'text-on-surface-variant',
    bg: 'bg-surface-container-high',
    border: 'border-on-surface-variant/30',
    icon: 'edit_note',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/35',
    icon: 'pending',
  },
  in_review: {
    label: 'In Review',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/35',
    icon: 'rate_review',
  },
  complete: {
    label: 'Complete',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300',
    icon: 'check_circle',
  },
};

function getStatusConfig(status: string) {
  const key = status.toLowerCase().replace(/ /g, '_') as StatusKey;
  return STATUS_CONFIG[key] ?? STATUS_CONFIG.draft;
}

type SortKey = 'newest' | 'oldest' | 'updated';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'newest', label: 'Newest first', icon: 'arrow_downward' },
  { key: 'oldest', label: 'Oldest first', icon: 'arrow_upward' },
  { key: 'updated', label: 'Recently updated', icon: 'update' },
];

function sortDocuments(docs: Document[], sort: SortKey): Document[] {
  const sorted = [...docs];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'updated':
      return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }
}

const TEMPLATE_ICONS: Record<string, string> = {
  prd: 'description',
  feature: 'widgets',
  api: 'api',
  mobile: 'phone_iphone',
};

function getTemplateIcon(templateType: string | null): string {
  if (!templateType) return 'description';
  return TEMPLATE_ICONS[templateType.toLowerCase()] ?? 'description';
}

const CARD_HOVER_COLORS = ['#e040a0', '#7c52aa', '#0096cc'];

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="glass-neo-card p-6 rounded-2xl bg-white animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="w-11 h-11 bg-surface-container-high rounded-xl" />
        <div className="w-6 h-6 bg-surface-container-high rounded-lg" />
      </div>
      <div className="h-5 bg-surface-container-high rounded-lg w-3/4 mb-3" />
      <div className="h-4 bg-surface-container-high rounded-lg w-full mb-2" />
      <div className="h-4 bg-surface-container-high rounded-lg w-2/3 mb-6" />
      <div className="flex justify-between items-center mt-auto">
        <div className="h-6 bg-surface-container-high rounded-md w-20" />
        <div className="h-4 bg-surface-container-high rounded-md w-24" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function EditorListPage() {
  const router = useRouter();

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch documents
  // -------------------------------------------------------------------------



  useEffect(() => {
    let cancelled = false;
    async function loadDocuments() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/documents');
        if (!res.ok) throw new Error('Failed to fetch documents');
        const data: ApiDocumentsResponse = await res.json();
        if (!cancelled) setDocuments(data.documents ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDocuments();
    return () => { cancelled = true; };
  }, []);




  // -------------------------------------------------------------------------
  // Create document
  // -------------------------------------------------------------------------

  async function handleCreate() {
    if (!newDocTitle.trim()) return;
    try {
      setCreating(true);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDocTitle.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create document');
      const data: ApiCreateResponse = await res.json();
      router.push(`/editor/${data.document.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create document';
      setError(message);
      setCreating(false);
    }
  }

  // -------------------------------------------------------------------------
  // Delete document
  // -------------------------------------------------------------------------

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/documents/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const filtered = documents
    .filter((doc) => {
      if (statusFilter && doc.status.toLowerCase().replace(/ /g, '_') !== statusFilter) return false;
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

  const sorted = sortDocuments(filtered, sortKey);

  const statusCounts = documents.reduce<Record<string, number>>((acc, doc) => {
    const key = doc.status.toLowerCase().replace(/ /g, '_');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="h-full overflow-y-auto bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopBar />

      <div className="px-6 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full flex flex-col gap-8">

        {/* ---- Header ---- */}
        <section className="mt-6 md:mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-headline font-black text-on-background tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
              My Documents
            </h2>
            {!loading && (
              <p className="text-base text-on-surface-variant font-bold mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <button
            onClick={() => { setShowCreateModal(true); setNewDocTitle(''); }}
            className="pop-btn w-fit text-white font-black rounded-xl py-3 px-6 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 select-none active:translate-y-0.5 active:shadow-[2px_2px_0_#2e1a28]"
          >
            <span className="material-symbols-outlined font-bold">add</span>
            New Document
          </button>
        </section>

        {/* ---- Search + Filters ---- */}
        <section className="flex flex-col gap-4">
          {/* Search + Sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold">search</span>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-on-surface rounded-xl text-on-surface font-bold shadow-[3px_3px_0_#2e1a28] focus:shadow-[4px_4px_0_#e040a0] focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-on-surface rounded-xl font-bold shadow-[3px_3px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all text-on-surface whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-lg">sort</span>
                {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white border-2 border-on-surface rounded-xl shadow-[4px_4px_0_#2e1a28] z-50 overflow-hidden min-w-[200px]">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left font-bold hover:bg-primary-fixed/20 transition-colors ${sortKey === opt.key ? 'text-primary bg-primary-fixed/10' : 'text-on-surface'}`}
                      >
                        <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-full font-extrabold text-sm border-2 transition-all ${
                statusFilter === null
                  ? 'bg-on-surface text-white border-on-surface shadow-[2px_2px_0_#e040a0]'
                  : 'bg-white text-on-surface border-on-surface shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              All ({documents.length})
            </button>
            {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((key) => {
              const cfg = STATUS_CONFIG[key];
              const count = statusCounts[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                  className={`px-4 py-2 rounded-full font-extrabold text-sm border-2 transition-all flex items-center gap-1.5 ${
                    statusFilter === key
                      ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-[2px_2px_0_currentColor]`
                      : 'bg-white text-on-surface border-on-surface/20 hover:border-on-surface shadow-[2px_2px_0_transparent] hover:shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* ---- Error banner ---- */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl font-bold flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            {error}
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* ---- Loading skeleton ---- */}
        {loading && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </section>
        )}

        {/* ---- Empty state ---- */}
        {!loading && documents.length === 0 && (
          <section className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-8 border-4 border-dashed border-primary/30">
              <span className="material-symbols-outlined text-[64px] text-primary/50">description</span>
            </div>
            <h3 className="text-2xl font-headline font-black text-on-background mb-2">No documents yet</h3>
            <p className="text-on-surface-variant font-bold mb-8 max-w-md">
              Create your first PRD and start documenting your product ideas with the power of AI.
            </p>
            <button
              onClick={() => { setShowCreateModal(true); setNewDocTitle(''); }}
              className="pop-btn text-white font-black rounded-xl py-4 px-8 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 select-none"
            >
              <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Create your first PRD
            </button>
          </section>
        )}

        {/* ---- No results from filter ---- */}
        {!loading && documents.length > 0 && sorted.length === 0 && (
          <section className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 mb-4">search_off</span>
            <h3 className="text-xl font-headline font-black text-on-background mb-1">No matching documents</h3>
            <p className="text-on-surface-variant font-bold">Try adjusting your search or filters.</p>
          </section>
        )}

        {/* ---- Document cards grid ---- */}
        {!loading && sorted.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sorted.map((doc, idx) => {
              const sc = getStatusConfig(doc.status);
              const hoverColor = CARD_HOVER_COLORS[idx % CARD_HOVER_COLORS.length];
              const iconName = getTemplateIcon(doc.template_type);

              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/editor/${doc.id}`)}
                  className="glass-neo-card p-6 rounded-2xl flex flex-col justify-between bg-white relative cursor-pointer transition-all duration-300 group"
                  style={{ ['--hover-shadow' as string]: hoverColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `10px 10px 0 ${hoverColor}`)}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                >
                  {/* Top row */}
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div
                        className="w-11 h-11 bg-primary/10 text-primary border-2 border-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                        style={{ boxShadow: `2px 2px 0 ${hoverColor}` }}
                      >
                        <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }}
                        className="text-on-surface-variant/50 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                        title="Delete document"
                      >
                        <span className="material-symbols-outlined font-bold">delete</span>
                      </button>
                    </div>
                    <h4 className="text-xl font-black text-on-background mb-2 line-clamp-1">{doc.title}</h4>
                    {doc.template_type && (
                      <p className="text-xs text-on-surface-variant/70 font-bold mb-3 uppercase tracking-wider">
                        {doc.template_type}
                      </p>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="mt-auto pt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-extrabold ${sc.color} ${sc.bg} border ${sc.border} px-3 py-1 rounded-md flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{sc.icon}</span>
                        {sc.label}
                      </span>
                      <span className="text-on-surface-variant/75 font-bold">
                        {timeAgo(doc.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      {/* ==================================================================
          Create Document Modal
         ================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => !creating && setShowCreateModal(false)} />

          {/* Modal */}
          <div className="relative bg-white border-3 border-on-surface rounded-2xl shadow-[8px_8px_0_#2e1a28] w-full max-w-md mx-4 p-8 animate-in zoom-in-95 fade-in">
            <h3 className="text-2xl font-headline font-black text-on-background mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>note_add</span>
              New Document
            </h3>
            <p className="text-sm text-on-surface-variant font-bold mb-6">Give your document a name to get started.</p>

            <input
              autoFocus
              type="text"
              placeholder="e.g. User Authentication PRD"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              className="w-full px-4 py-3 bg-white border-2 border-on-surface rounded-xl text-on-surface font-bold shadow-[3px_3px_0_#2e1a28] focus:shadow-[4px_4px_0_#e040a0] focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/50 mb-6"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="px-5 py-2.5 bg-white text-on-surface font-bold rounded-xl border-2 border-on-surface shadow-[3px_3px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newDocTitle.trim()}
                className="pop-btn text-white font-black rounded-xl px-6 py-2.5 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-[2px_2px_0_#2e1a28]"
              >
                {creating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">add</span>
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          Delete Confirmation Dialog
         ================================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />

          {/* Modal */}
          <div className="relative bg-white border-3 border-on-surface rounded-2xl shadow-[8px_8px_0_#2e1a28] w-full max-w-sm mx-4 p-8">
            <div className="w-14 h-14 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-center mb-5 mx-auto shadow-[3px_3px_0_#ef4444]">
              <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            </div>
            <h3 className="text-xl font-headline font-black text-on-background mb-2 text-center">Delete Document?</h3>
            <p className="text-sm text-on-surface-variant font-bold mb-6 text-center">
              &quot;{deleteTarget.title}&quot; will be permanently deleted. This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 bg-white text-on-surface font-bold rounded-xl border-2 border-on-surface shadow-[3px_3px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2.5 bg-red-500 text-white font-black rounded-xl border-2 border-red-700 shadow-[4px_4px_0_#991b1b] hover:shadow-[6px_6px_0_#991b1b] transition-all flex items-center gap-2 disabled:opacity-50 active:translate-y-0.5 active:shadow-[2px_2px_0_#991b1b]"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">delete</span>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
