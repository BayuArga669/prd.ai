'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIQuestion {
  id: string;
  question: string;
  type: 'text' | 'chips';
  options?: string[];
  allowCustom?: boolean;
  multiSelect?: boolean;
}

interface WizardFormData {
  productName: string;
  productDescription: string;
  techPreference: 'ai' | 'manual' | null;
  techStack: string[];
}

type StepKey = 0 | 1 | 2 | 3;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Product Info', 'Tech Stack', 'AI Questions', 'Generate'] as const;

const TECH_CATEGORIES: { category: string; items: string[] }[] = [
  { category: 'Frontend', items: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Flutter', 'React Native', 'Swift', 'Kotlin'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'Go', 'Java', 'Rust', 'PHP', 'Ruby', '.NET'] },
  { category: 'Database', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase'] },
  { category: 'Cloud/Infra', items: ['AWS', 'GCP', 'Azure', 'Vercel', 'Docker', 'Kubernetes'] },
];

const BG_STYLE = {
  backgroundColor: '#fef7ff',
  backgroundImage:
    'radial-gradient(#e040a0 0.5px, transparent 0.5px), radial-gradient(#40c0ee 0.5px, transparent 0.5px)',
  backgroundSize: '40px 40px',
  backgroundPosition: '0 0, 20px 20px',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WizardPage() {
  const router = useRouter();

  // Form state
  const [currentStep, setCurrentStep] = useState<StepKey>(0);
  const [formData, setFormData] = useState<WizardFormData>({
    productName: '',
    productDescription: '',
    techPreference: null,
    techStack: [],
  });

  // AI Questions state
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string | string[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transition direction for animations
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll streaming content
  useEffect(() => {
    if (streamContainerRef.current && isGenerating) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [generatedContent, isGenerating]);

  // ─── Validation ───────────────────────────────────────────────────────────

  const isStepValid = useCallback(
    (step: StepKey): boolean => {
      switch (step) {
        case 0:
          return formData.productName.trim().length > 0 && formData.productDescription.trim().length > 0;
        case 1:
          if (!formData.techPreference) return false;
          if (formData.techPreference === 'manual') return formData.techStack.length >= 1;
          return true;
        case 2:
          return true; // AI questions are optional (can skip)
        case 3:
          return true;
        default:
          return false;
      }
    },
    [formData]
  );

  // ─── Step Navigation ─────────────────────────────────────────────────────

  const goToStep = useCallback(
    (target: StepKey) => {
      if (target === currentStep) return;
      setSlideDirection(target > currentStep ? 'forward' : 'backward');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(target);
        setIsTransitioning(false);
      }, 200);
    },
    [currentStep]
  );

  const handleNext = useCallback(() => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      goToStep((currentStep + 1) as StepKey);
    }
  }, [currentStep, isStepValid, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      goToStep((currentStep - 1) as StepKey);
    }
  }, [currentStep, goToStep]);

  // ─── Form Handlers ───────────────────────────────────────────────────────

  const updateField = useCallback(
    (field: keyof WizardFormData, value: string | string[] | 'ai' | 'manual' | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleTech = useCallback((tech: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  }, []);

  // ─── AI Questions ─────────────────────────────────────────────────────────

  const fetchAIQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setQuestionsError(null);
    try {
      const res = await fetch('/api/documents/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          productDescription: formData.productDescription,
          techPreference: formData.techPreference,
          techStack: formData.techStack,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await res.json();
      setAiQuestions(data.questions || []);
      // Reset answers when new questions arrive
      setAiAnswers({});
      setCustomInputs({});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load questions';
      setQuestionsError(message);
    } finally {
      setLoadingQuestions(false);
    }
  }, [formData.productName, formData.productDescription, formData.techPreference, formData.techStack]);

  // Fetch questions when entering step 2
  useEffect(() => {
    if (currentStep === 2 && aiQuestions.length === 0 && !loadingQuestions) {
      fetchAIQuestions();
    }
  }, [currentStep, aiQuestions.length, loadingQuestions, fetchAIQuestions]);

  const toggleChipAnswer = useCallback((questionId: string, option: string) => {
    setAiAnswers((prev) => {
      const current = prev[questionId];
      if (Array.isArray(current)) {
        return {
          ...prev,
          [questionId]: current.includes(option)
            ? current.filter((o) => o !== option)
            : [...current, option],
        };
      }
      return { ...prev, [questionId]: [option] };
    });
  }, []);

  const setTextAnswer = useCallback((questionId: string, value: string) => {
    setAiAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const addCustomChip = useCallback((questionId: string) => {
    const value = customInputs[questionId]?.trim();
    if (!value) return;
    setAiAnswers((prev) => {
      const current = prev[questionId];
      const arr = Array.isArray(current) ? current : [];
      if (arr.includes(value)) return prev;
      return { ...prev, [questionId]: [...arr, value] };
    });
    setCustomInputs((prev) => ({ ...prev, [questionId]: '' }));
  }, [customInputs]);

  const skipQuestion = useCallback((questionId: string) => {
    setAiAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  // Count answered questions
  const answeredCount = aiQuestions.filter((q) => {
    const ans = aiAnswers[q.id];
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'string') return ans.trim().length > 0;
    return false;
  }).length;

  // ─── Generation ───────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsGenerating(true);
    setGeneratedContent('');
    setGenerationComplete(false);
    setDocumentId(null);

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          productDescription: formData.productDescription,
          techPreference: formData.techPreference,
          techStack: formData.techStack,
          aiAnswers,
          platforms: [],
          features: [],
        }),
      });

      if (!response.ok) {
        let errorMsg = `Generation failed (status ${response.status})`;
        try {
          const errBody = await response.json();
          if (errBody.error) errorMsg = errBody.error;
          if (errBody.details) errorMsg += `: ${errBody.details}`;
        } catch {
          // Body was not JSON, use default error
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const headerDocId = response.headers.get('X-Document-Id');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let docId: string | null = headerDocId;
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let chunk = decoder.decode(value, { stream: true });

        if (isFirstChunk) {
          isFirstChunk = false;
          if (chunk.startsWith('__DOC_ID__:')) {
            const newlineIdx = chunk.indexOf('\n');
            if (newlineIdx !== -1) {
              const idLine = chunk.slice('__DOC_ID__:'.length, newlineIdx).trim();
              if (idLine) {
                docId = idLine;
                setDocumentId(idLine);
              }
              chunk = chunk.slice(newlineIdx + 1);
            }
          }
        }

        fullContent += chunk;
        setGeneratedContent(fullContent);
      }

      if (docId && !documentId) {
        setDocumentId(docId);
      }

      if (docId) {
        await fetch(`/api/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: fullContent }),
        });
      }

      setGenerationComplete(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong during generation.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [formData, aiAnswers, documentId]);

  // ─── Progress Bar ─────────────────────────────────────────────────────────

  const progressPercent = (currentStep / (STEP_LABELS.length - 1)) * 100;

  // ─── Transition classes ───────────────────────────────────────────────────

  const transitionClass = isTransitioning
    ? slideDirection === 'forward'
      ? 'opacity-0 translate-x-8'
      : 'opacity-0 -translate-x-8'
    : 'opacity-100 translate-x-0';

  // ─── Render Steps ─────────────────────────────────────────────────────────

  // Step 0: Product Info
  const renderStep0 = () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background" htmlFor="product_name">
          What&apos;s your product called?
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-4 text-primary">
            inventory_2
          </span>
          <input
            id="product_name"
            type="text"
            value={formData.productName}
            onChange={(e) => updateField('productName', e.target.value)}
            placeholder="e.g., TaskFlow, Notedly, HealthPulse..."
            className="w-full bg-surface-container rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 text-on-surface py-4 pl-12 pr-4 text-lg transition-all duration-200 hover:bg-surface-container-highest outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background" htmlFor="product_desc">
          Describe your product in a few sentences
        </label>
        <textarea
          id="product_desc"
          value={formData.productDescription}
          onChange={(e) => updateField('productDescription', e.target.value)}
          placeholder="e.g., A project management tool that helps small teams organize tasks, track deadlines, and collaborate in real-time..."
          rows={4}
          className="w-full bg-surface-container rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 text-on-surface p-4 text-lg transition-all duration-200 resize-none hover:bg-surface-container-highest outline-none"
        />
        <p className="text-sm text-on-surface-variant pl-2">
          The more detail you provide, the better the PRD will be.
        </p>
      </div>
    </div>
  );

  // Step 1: Tech Preferences
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background">
          Preferensi teknologi
        </label>
        <p className="text-on-surface-variant text-sm">
          Udah punya pilihan tech stack, atau mau AI yang tentuin?
        </p>
      </div>

      {/* Two selectable cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Pick */}
        <button
          type="button"
          onClick={() => updateField('techPreference', 'ai')}
          className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${
            formData.techPreference === 'ai'
              ? 'border-primary bg-primary-container shadow-[0_4px_20px_rgba(224,64,160,0.2)]'
              : 'border-outline-variant bg-surface hover:border-primary/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            formData.techPreference === 'ai' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <h3 className="font-black text-on-background text-lg mb-1">Biarkan AI pilih</h3>
          <p className="text-sm text-on-surface-variant">AI rekomendasiin stack yang paling cocok buat project kamu</p>
          {formData.techPreference === 'ai' && (
            <div className="absolute top-4 right-4">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          )}
        </button>

        {/* Manual Pick */}
        <button
          type="button"
          onClick={() => updateField('techPreference', 'manual')}
          className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${
            formData.techPreference === 'manual'
              ? 'border-secondary bg-secondary-fixed shadow-[0_4px_20px_rgba(124,82,170,0.2)]'
              : 'border-outline-variant bg-surface hover:border-secondary/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            formData.techPreference === 'manual' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          </div>
          <h3 className="font-black text-on-background text-lg mb-1">Pilih sendiri</h3>
          <p className="text-sm text-on-surface-variant">Kamu tentuin teknologi yang mau dipakai</p>
          {formData.techPreference === 'manual' && (
            <div className="absolute top-4 right-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          )}
        </button>
      </div>

      {/* Manual tech stack selection */}
      {formData.techPreference === 'manual' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {TECH_CATEGORIES.map((cat) => (
            <div key={cat.category} className="space-y-3">
              <p className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider">{cat.category}</p>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((tech) => {
                  const isSelected = formData.techStack.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? 'border-primary bg-primary-container text-on-primary-container shadow-[0_2px_8px_rgba(224,64,160,0.15)]'
                          : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-xs mr-1 align-middle">check</span>}
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-sm text-on-surface-variant">
            {formData.techStack.length} teknologi dipilih
            {formData.techStack.length === 0 && (
              <span className="text-error ml-2">(minimal 1)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );

  // Step 2: AI Questions
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-on-background text-xl mb-1">Beberapa pertanyaan</h3>
          <p className="text-on-surface-variant text-sm">Biar PRD-nya lebih akurat. Jawab pertanyaan di bawah.</p>
        </div>
        <span className="text-sm font-extrabold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
          {answeredCount}/{aiQuestions.length}
        </span>
      </div>

      {/* Loading skeleton */}
      {loadingQuestions && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 p-5 bg-surface-container rounded-2xl border border-outline-variant/30">
              <div className="h-5 bg-surface-container-high rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-8 bg-surface-container-high rounded-full w-28" />
                <div className="h-8 bg-surface-container-high rounded-full w-32" />
                <div className="h-8 bg-surface-container-high rounded-full w-24" />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary-container rounded-xl">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-on-primary-container font-bold text-sm">AI sedang membuat pertanyaan...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {questionsError && (
        <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="flex-1 font-bold text-sm">{questionsError}</p>
          <button
            type="button"
            onClick={fetchAIQuestions}
            className="px-4 py-2 bg-error text-on-error rounded-lg font-bold text-sm hover:scale-105 transition-transform"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Questions */}
      {!loadingQuestions && aiQuestions.length > 0 && (
        <div className="space-y-5">
          {aiQuestions.map((q, idx) => {
            const answer = aiAnswers[q.id];
            const isAnswered = Array.isArray(answer) ? answer.length > 0 : typeof answer === 'string' && answer.trim().length > 0;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                  isAnswered
                    ? 'border-primary/30 bg-primary-fixed/5'
                    : 'border-outline-variant/30 bg-surface-container'
                }`}
              >
                {/* Question header */}
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-on-background text-base leading-snug flex-1 pr-4">
                    <span className="text-primary font-black mr-1.5">{idx + 1}.</span>
                    {q.question}
                    {q.multiSelect && q.type === 'chips' && (
                      <span className="text-on-surface-variant text-xs font-normal ml-2">(boleh pilih beberapa)</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => skipQuestion(q.id)}
                    className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
                  >
                    Lewati
                  </button>
                </div>

                {/* Text input */}
                {q.type === 'text' && (
                  <textarea
                    value={typeof answer === 'string' ? answer : ''}
                    onChange={(e) => setTextAnswer(q.id, e.target.value)}
                    placeholder="Ketik jawaban..."
                    rows={2}
                    className="w-full bg-white/80 rounded-xl border-2 border-transparent focus:border-primary focus:ring-0 text-on-surface p-4 text-sm transition-all duration-200 resize-none hover:bg-white outline-none"
                  />
                )}

                {/* Chip options */}
                {q.type === 'chips' && q.options && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const isSelected = Array.isArray(answer) && answer.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleChipAnswer(q.id, opt)}
                            className={`px-4 py-2 rounded-full font-bold text-sm border-2 transition-all duration-200 hover:scale-105 ${
                              isSelected
                                ? 'border-primary bg-primary-container text-on-primary-container shadow-[0_2px_8px_rgba(224,64,160,0.15)]'
                                : 'border-outline-variant bg-white text-on-surface-variant hover:border-primary/50'
                            }`}
                          >
                            {isSelected && <span className="material-symbols-outlined text-xs mr-1 align-middle">check</span>}
                            {opt}
                          </button>
                        );
                      })}

                      {/* Custom add button */}
                      {q.allowCustom && (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={customInputs[q.id] || ''}
                            onChange={(e) => setCustomInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomChip(q.id);
                              }
                            }}
                            placeholder="+ Lainnya"
                            className="px-3 py-2 rounded-full border-2 border-dashed border-outline-variant text-sm bg-transparent focus:border-primary outline-none w-28 font-bold text-on-surface-variant placeholder:text-on-surface-variant/50 transition-colors"
                          />
                          {customInputs[q.id]?.trim() && (
                            <button
                              type="button"
                              onClick={() => addCustomChip(q.id)}
                              className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Step 3: Review & Generate
  const renderStep3 = () => (
    <div className="space-y-8">
      {/* Summary */}
      {!isGenerating && !generatedContent && (
        <div className="space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 space-y-5 border border-outline-variant/50">
            <h3 className="text-lg font-black text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                summarize
              </span>
              Review Your Inputs
            </h3>

            {/* Product */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Product Name</p>
              <p className="text-on-surface font-medium text-lg">{formData.productName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</p>
              <p className="text-on-surface leading-relaxed">{formData.productDescription}</p>
            </div>

            <div className="border-t border-outline-variant/30" />

            {/* Tech Stack */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tech Preference</p>
              {formData.techPreference === 'ai' ? (
                <p className="text-on-surface font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI akan merekomendasikan
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.techStack.map((t) => (
                    <span key={t} className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-sm font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Answers */}
            {Object.keys(aiAnswers).length > 0 && (
              <>
                <div className="border-t border-outline-variant/30" />
                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">AI Questions Answered</p>
                  {aiQuestions
                    .filter((q) => {
                      const ans = aiAnswers[q.id];
                      if (Array.isArray(ans)) return ans.length > 0;
                      return typeof ans === 'string' && ans.trim().length > 0;
                    })
                    .map((q) => {
                      const ans = aiAnswers[q.id];
                      return (
                        <div key={q.id} className="space-y-1">
                          <p className="text-xs text-on-surface-variant font-bold">{q.question}</p>
                          {Array.isArray(ans) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {ans.map((a) => (
                                <span key={a} className="bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full text-xs font-bold">{a}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-on-surface text-sm">{ans}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-tertiary text-white font-black text-lg shadow-[0_6px_24px_rgba(224,64,160,0.3)] hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(224,64,160,0.4)] transition-all duration-300 ease-out flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
                Generating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                Generate PRD
              </>
            )}
          </button>
        </div>
      )}

      {/* Generating / Generated Content */}
      {(isGenerating || generatedContent) && (
        <div className="space-y-6">
          {isGenerating && (
            <div className="flex items-center gap-3 px-4 py-3 bg-primary-container rounded-xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-on-primary-container font-bold text-sm">AI is writing your PRD...</span>
            </div>
          )}

          {generationComplete && (
            <div className="flex items-center gap-3 px-4 py-3 bg-tertiary-container rounded-xl">
              <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="text-on-tertiary-container font-bold text-sm">
                PRD generated successfully!
              </span>
            </div>
          )}

          <div
            ref={streamContainerRef}
            className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 max-h-[50vh] overflow-y-auto shadow-inner"
          >
            <div className="prose prose-sm max-w-none text-on-surface whitespace-pre-wrap leading-relaxed font-mono text-sm">
              {generatedContent}
              {isGenerating && (
                <span className="inline-block w-2 h-5 bg-primary ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          </div>

          {generationComplete && documentId && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push(`/editor/${documentId}`)}
                className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-black text-lg shadow-[0_6px_24px_rgba(224,64,160,0.3)] hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(224,64,160,0.4)] transition-all duration-300 ease-out flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  edit_document
                </span>
                Open in Editor
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="py-4 px-8 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container-highest transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">dashboard</span>
                Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const STEP_RENDERERS: Record<StepKey, () => React.ReactNode> = {
    0: renderStep0,
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
  };

  const STEP_SUBTITLES: Record<StepKey, string> = {
    0: 'Tell us about your product.',
    1: 'Pilih preferensi teknologi kamu.',
    2: 'Jawab beberapa pertanyaan dari AI.',
    3: 'Review and generate your PRD.',
  };

  const getNextLabel = (): string => {
    if (currentStep >= 3) return 'Generate';
    return `Next: ${STEP_LABELS[currentStep + 1]}`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 flex flex-col items-center justify-start p-4 md:p-12 h-full overflow-y-auto relative"
      style={BG_STYLE}
    >
      {/* Error Banner */}
      {error && (
        <div className="w-full max-w-3xl mb-4 bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3 shadow-lg animate-in slide-in-from-top z-20">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            error
          </span>
          <p className="flex-1 font-bold text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-on-error-container/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Wizard Card */}
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_8px_32px_rgba(224,64,160,0.1)] p-6 md:p-12 relative transition-shadow duration-300 ease-out hover:shadow-[0_12px_40px_rgba(224,64,160,0.15)] z-10 my-4 md:my-8">
        {/* Decorative Header Accent */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary via-tertiary to-secondary rounded-t-xl" />

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-background tracking-tight mb-2">
            Let&apos;s craft your PRD!
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg">
            Step {currentStep + 1}: {STEP_SUBTITLES[currentStep]}
          </p>
        </div>

        {/* Progress Bar & Stepper */}
        <div className="mb-10 relative px-3">
          {/* Step Labels */}
          <div className="flex justify-between mb-4">
            {STEP_LABELS.map((label, idx) => (
              <span
                key={label}
                className={`text-xs md:text-sm font-extrabold transition-colors duration-300 ${
                  idx <= currentStep ? 'text-primary' : 'text-on-surface-variant/40'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </span>
            ))}
          </div>

          {/* Stepper Track & Dots Container */}
          <div className="relative flex items-center h-8">
            <div className="w-full bg-surface-container-high rounded-full h-1.5 z-0">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="absolute inset-x-0 top-0 bottom-0 flex justify-between items-center z-10 pointer-events-none">
              {STEP_LABELS.map((_, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-primary text-white shadow-[0_2px_8px_rgba(224,64,160,0.3)]'
                        : isCurrent
                        ? 'bg-primary border-4 border-white text-white shadow-[0_2px_8px_rgba(224,64,160,0.4)] scale-110'
                        : 'bg-surface-container-high text-on-surface-variant/40 border-2 border-transparent'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-white text-[10px] font-black">check</span>
                    ) : (
                      <span className={`text-[10px] font-black ${isCurrent ? 'text-white' : 'text-on-surface-variant/50'}`}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content with Transition */}
        <div
          className={`transition-all duration-200 ease-out transform ${transitionClass}`}
        >
          {STEP_RENDERERS[currentStep]()}
        </div>

        {/* Navigation Buttons */}
        {!(currentStep === 3 && (isGenerating || generatedContent)) && (
          <div className="pt-8 flex justify-between items-center border-t border-outline-variant/30 mt-10">
            {/* Back */}
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-full text-secondary font-bold transition-colors duration-200 flex items-center gap-2 ${
                currentStep === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'hover:bg-secondary-container'
              }`}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </button>

            {/* Next / Generate */}
            {currentStep < 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="px-8 py-4 rounded-full bg-primary text-on-primary font-bold text-lg shadow-[0_4px_16px_rgba(224,64,160,0.25)] hover:scale-105 hover:shadow-[0_6px_24px_rgba(224,64,160,0.35)] transition-all duration-200 ease-out flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {getNextLabel()}
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contextual Help FAB */}
      <div className="absolute bottom-8 right-8 hidden md:block z-20">
        <button className="w-16 h-16 bg-tertiary rounded-full shadow-[0_8px_24px_rgba(0,150,204,0.3)] flex items-center justify-center hover:scale-110 transition-transform duration-300 ease-out group relative">
          <span
            className="material-symbols-outlined text-on-tertiary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lightbulb
          </span>
          <div className="absolute bottom-full right-0 mb-4 w-52 bg-inverse-surface text-inverse-on-surface p-3 rounded-lg text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Need help? Each step guides you through building a perfect PRD!
          </div>
        </button>
      </div>
    </div>
  );
}
