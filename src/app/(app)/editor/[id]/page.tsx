'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentData {
  id: number;
  title: string;
  content: string;
  status: string;
  template_type: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiDocumentResponse {
  document: DocumentData;
}

type ViewMode = 'edit' | 'preview' | 'split';

type StatusKey = 'draft' | 'in_progress' | 'in_review' | 'complete';

const STATUS_OPTIONS: { key: StatusKey; label: string; color: string; bg: string }[] = [
  { key: 'draft', label: 'Draft', color: 'text-on-surface-variant', bg: 'bg-surface-container-high' },
  { key: 'in_progress', label: 'In Progress', color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'in_review', label: 'In Review', color: 'text-tertiary', bg: 'bg-tertiary/10' },
  { key: 'complete', label: 'Complete', color: 'text-green-600', bg: 'bg-green-50' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeStatus(status: string): StatusKey {
  return status.toLowerCase().replace(/ /g, '_') as StatusKey;
}

function displayStatus(key: StatusKey): string {
  return STATUS_OPTIONS.find((o) => o.key === key)?.label ?? 'Draft';
}

// ---------------------------------------------------------------------------
// Markdown renderer (lazy import)
// ---------------------------------------------------------------------------

let markedPromise: Promise<typeof import('marked')> | null = null;

function getMarked() {
  if (!markedPromise) {
    markedPromise = import('marked');
  }
  return markedPromise;
}

async function renderMarkdown(md: string): Promise<string> {
  const { marked } = await getMarked();
  const result = marked(md);
  // marked may return string | Promise<string>
  return typeof result === 'string' ? result : await result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Document data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<StatusKey>('draft');
  const [renderedHtml, setRenderedHtml] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit');

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // -------------------------------------------------------------------------
  // Fetch document
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchDoc() {
      try {
        setLoading(true);
        setNotFound(false);
        setError(null);
        const res = await fetch(`/api/documents/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error('Failed to load document');
        const data: ApiDocumentResponse = await res.json();
        const doc = data.document;
        setTitle(doc.title);
        setContent(doc.content ?? '');
        setStatus(normalizeStatus(doc.status));
        setLastSaved(new Date(doc.updated_at));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [id]);

  // -------------------------------------------------------------------------
  // Markdown rendering
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    renderMarkdown(content).then((html) => {
      if (!cancelled) setRenderedHtml(html);
    });
    return () => { cancelled = true; };
  }, [content]);

  // -------------------------------------------------------------------------
  // Save logic
  // -------------------------------------------------------------------------

  const saveDocument = useCallback(async (contentToSave?: string, titleToSave?: string, statusToSave?: StatusKey) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToSave ?? title,
          content: contentToSave ?? content,
          status: displayStatus(statusToSave ?? status),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [id, title, content, status]);

  function handleContentChange(newContent: string) {
    setContent(newContent);
    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent);
    }, 3000);
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(undefined, newTitle);
    }, 3000);
  }

  function handleStatusChange(newStatus: StatusKey) {
    setStatus(newStatus);
    setShowStatusMenu(false);
    setHasUnsavedChanges(true);
    // Save immediately on status change
    saveDocument(undefined, undefined, newStatus);
  }

  // Ctrl+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveDocument();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveDocument]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Export functions
  // -------------------------------------------------------------------------

  function exportMarkdown() {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'DM Sans', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 28px; border-bottom: 2px solid #e040a0; padding-bottom: 8px; }
          h2 { font-size: 22px; color: #7c52aa; margin-top: 24px; }
          h3 { font-size: 18px; color: #0096cc; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
          pre { background: #f0f0f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
          blockquote { border-left: 4px solid #e040a0; margin-left: 0; padding-left: 16px; color: #555; }
          ul, ol { padding-left: 24px; }
          li { margin-bottom: 4px; }
          hr { border: none; border-top: 2px solid #eee; margin: 24px 0; }
        </style>
      </head>
      <body>${renderedHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // -------------------------------------------------------------------------
  // View mode helpers
  // -------------------------------------------------------------------------

  const VIEW_MODES: { key: ViewMode; icon: string; label: string }[] = [
    { key: 'edit', icon: 'edit', label: 'Edit' },
    { key: 'split', icon: 'vertical_split', label: 'Split' },
    { key: 'preview', icon: 'visibility', label: 'Preview' },
  ];

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            </div>
            <p className="text-on-surface-variant font-bold">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Not found state
  // -------------------------------------------------------------------------

  if (notFound) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-24 h-24 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-5xl">search_off</span>
            </div>
            <h2 className="text-3xl font-headline font-black text-on-background">Document not found</h2>
            <p className="text-on-surface-variant font-bold max-w-md">
              The document you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/editor')}
              className="pop-btn text-white font-black rounded-xl py-3 px-6 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 mt-4"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error && !content) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <TopBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-24 h-24 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <h2 className="text-2xl font-headline font-black text-on-background">Something went wrong</h2>
            <p className="text-on-surface-variant font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="pop-btn text-white font-black rounded-xl py-3 px-6 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 mt-4"
            >
              <span className="material-symbols-outlined">refresh</span>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  const currentStatusOpt = STATUS_OPTIONS.find((o) => o.key === status) ?? STATUS_OPTIONS[0];

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">

      {/* ================================================================
          Editor Header Bar
         ================================================================ */}
      <header className="flex-shrink-0 flex flex-wrap items-center gap-3 px-4 md:px-6 py-3 bg-surface border-b-2 border-on-surface/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] z-30">
        {/* Back button */}
        <button
          onClick={() => router.push('/editor')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface hover:text-primary bg-white border-2 border-on-surface shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0_#2e1a28] transition-all flex-shrink-0"
          title="Back to documents"
        >
          <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
        </button>

        {/* Title (editable) */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg md:text-xl font-headline font-black text-on-background bg-transparent border-none focus:outline-none flex-1 min-w-0 truncate placeholder:text-on-surface-variant/50"
            placeholder="Untitled Document"
          />
          {hasUnsavedChanges && (
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse flex-shrink-0" title="Unsaved changes" />
          )}
        </div>

        {/* Status selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-xs border-2 transition-all ${currentStatusOpt.color} ${currentStatusOpt.bg} border-current/30 hover:scale-105`}
          >
            {currentStatusOpt.label}
            <span className="material-symbols-outlined text-xs">expand_more</span>
          </button>
          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white border-2 border-on-surface rounded-xl shadow-[4px_4px_0_#2e1a28] z-50 overflow-hidden min-w-[160px]">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleStatusChange(opt.key)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left font-bold text-sm hover:bg-primary-fixed/20 transition-colors ${status === opt.key ? 'bg-primary-fixed/10 text-primary' : 'text-on-surface'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.bg} border ${opt.color}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Save indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant/60 font-bold flex-shrink-0">
          {saving ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              Saving...
            </>
          ) : lastSaved ? (
            <>
              <span className="material-symbols-outlined text-sm text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              Saved {formatTime(lastSaved)}
            </>
          ) : null}
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-on-surface/15" />

        {/* View mode toggle (desktop) */}
        <div className="hidden md:flex items-center bg-surface-container-high rounded-xl border-2 border-on-surface/10 p-0.5">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                viewMode === mode.key
                  ? 'bg-primary text-on-primary shadow-[2px_2px_0_#2e1a28]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title={mode.label}
            >
              <span className="material-symbols-outlined text-sm">{mode.icon}</span>
              <span className="hidden lg:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile panel toggle */}
        <div className="flex md:hidden items-center bg-surface-container-high rounded-xl border-2 border-on-surface/10 p-0.5">
          <button
            onClick={() => setMobilePanel('edit')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              mobilePanel === 'edit'
                ? 'bg-primary text-on-primary shadow-[2px_2px_0_#2e1a28]'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </button>
          <button
            onClick={() => setMobilePanel('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              mobilePanel === 'preview'
                ? 'bg-primary text-on-primary shadow-[2px_2px_0_#2e1a28]'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Preview
          </button>
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-on-surface/15" />

        {/* Export buttons */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-on-surface font-bold text-xs rounded-xl border-2 border-on-surface shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0_#2e1a28] transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            .md
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-on-surface font-bold text-xs rounded-xl border-2 border-on-surface shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0_#2e1a28] transition-all"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            PDF
          </button>
        </div>

        {/* Manual save */}
        <button
          onClick={() => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); saveDocument(); }}
          disabled={saving || !hasUnsavedChanges}
          className="flex items-center gap-1.5 px-3 py-1.5 pop-btn text-white font-black text-xs rounded-xl shadow-[2px_2px_0_#2e1a28] hover:shadow-[3px_3px_0_#2e1a28] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-[0px_0px_0_#2e1a28] flex-shrink-0"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          Save
        </button>
      </header>

      {/* ================================================================
          Editor Body
         ================================================================ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ---------- Editor Panel ---------- */}
        {/* Desktop: visible in edit/split mode. Mobile: visible when mobilePanel === 'edit' */}
        <div
          className={`flex flex-col overflow-hidden border-r border-on-surface/10 bg-surface-container-lowest
            ${viewMode === 'preview' ? 'hidden md:hidden' : ''}
            ${viewMode === 'edit' ? 'flex-1' : ''}
            ${viewMode === 'split' ? 'hidden md:flex md:w-[60%]' : ''}
            ${mobilePanel === 'edit' && viewMode === 'split' ? '!flex flex-1 md:!w-[60%] md:flex-none' : ''}
            ${mobilePanel === 'preview' && viewMode === 'split' ? '!hidden md:!flex' : ''}
          `}
        >
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-surface-container-lowest border-b border-on-surface/5 text-xs text-on-surface-variant/60 font-bold flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">edit</span>
              MARKDOWN EDITOR
            </div>
            <div className="flex items-center gap-4">
              <span>{wordCount(content)} words</span>
              <span>{content.length} chars</span>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your document in Markdown..."
            className="flex-1 w-full p-6 md:p-8 bg-transparent text-on-surface font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-on-surface-variant/30 selection:bg-primary-fixed selection:text-on-primary-fixed"
            spellCheck
          />
        </div>

        {/* ---------- Preview Panel ---------- */}
        {/* Desktop: visible in preview/split mode. Mobile: visible when mobilePanel === 'preview' */}
        <div
          className={`flex flex-col overflow-hidden bg-white
            ${viewMode === 'edit' ? 'hidden md:hidden' : ''}
            ${viewMode === 'preview' ? 'flex-1' : ''}
            ${viewMode === 'split' ? 'hidden md:flex md:w-[40%]' : ''}
            ${mobilePanel === 'preview' && viewMode === 'split' ? '!flex flex-1 md:!w-[40%] md:flex-none' : ''}
            ${mobilePanel === 'edit' && viewMode === 'split' ? '!hidden md:!flex' : ''}
          `}
        >
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-on-surface/5 text-xs text-on-surface-variant/60 font-bold flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-sm">visibility</span>
              PREVIEW
            </div>

            {/* Mobile export buttons */}
            <div className="flex sm:hidden items-center gap-2">
              <button onClick={exportMarkdown} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">download</span>
              </button>
              <button onClick={exportPDF} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
              </button>
            </div>
          </div>

          {/* Rendered markdown */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {content ? (
              <article
                className="prose prose-lg max-w-none
                  prose-headings:font-headline prose-headings:font-black prose-headings:text-on-background
                  prose-h1:text-3xl prose-h1:border-b-2 prose-h1:border-primary prose-h1:pb-3
                  prose-h2:text-2xl prose-h2:text-secondary
                  prose-h3:text-xl prose-h3:text-tertiary
                  prose-p:text-on-surface prose-p:leading-relaxed
                  prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-on-background prose-strong:font-black
                  prose-code:bg-surface-container prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-surface-container prose-pre:border-2 prose-pre:border-on-surface/10 prose-pre:rounded-xl
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary-fixed/10 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                  prose-table:border-2 prose-table:border-on-surface/15 prose-table:rounded-xl
                  prose-th:bg-surface-container prose-th:font-black
                  prose-td:border prose-td:border-on-surface/10 prose-td:px-3 prose-td:py-2
                  prose-th:border prose-th:border-on-surface/10 prose-th:px-3 prose-th:py-2
                  prose-img:rounded-xl prose-img:border-2 prose-img:border-on-surface/10
                  prose-hr:border-on-surface/10
                  prose-li:text-on-surface"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 mb-4">article</span>
                <p className="text-on-surface-variant font-bold">Your preview will appear here</p>
                <p className="text-on-surface-variant/60 text-sm font-bold mt-1">Start writing Markdown in the editor</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          Bottom status bar
         ================================================================ */}
      <footer className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-2 bg-surface border-t border-on-surface/10 text-xs text-on-surface-variant/60 font-bold">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">description</span>
            Markdown
          </span>
          <span>{wordCount(content)} words</span>
          <span>{content.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-4">
          {saving && (
            <span className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-xs animate-spin">sync</span>
              Saving
            </span>
          )}
          {!saving && lastSaved && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              Last saved {formatTime(lastSaved)}
            </span>
          )}
          <span className="hidden sm:inline">Ctrl+S to save</span>
        </div>
      </footer>

      {/* ================================================================
          Error toast
         ================================================================ */}
      {error && content && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-5 py-3 rounded-xl font-bold shadow-[4px_4px_0_#991b1b] border-2 border-red-700 flex items-center gap-3 max-w-md">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-200">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
