'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardFormData {
  productName: string;
  productDescription: string;
  primaryGoal: string;
  targetAudience: string;
  platforms: string[];
  features: string[];
}

type StepKey = 0 | 1 | 2 | 3;

interface PlatformOption {
  id: string;
  label: string;
  icon: string;
}

interface SuggestedFeatureMap {
  [platform: string]: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Product Info', 'Goals & Audience', 'Key Features', 'Generate'] as const;

const PLATFORM_OPTIONS: PlatformOption[] = [
  { id: 'Web', label: 'Web', icon: 'desktop_windows' },
  { id: 'iOS', label: 'iOS', icon: 'smartphone' },
  { id: 'Android', label: 'Android', icon: 'android' },
  { id: 'Wearable', label: 'Wearable', icon: 'watch' },
  { id: 'Desktop', label: 'Desktop', icon: 'laptop_mac' },
];

const SUGGESTED_FEATURES: SuggestedFeatureMap = {
  Web: ['Responsive Dashboard', 'User Authentication', 'Search & Filtering', 'Dark Mode', 'Data Export'],
  iOS: ['Push Notifications', 'Biometric Login', 'Offline Mode', 'Widget Support', 'Haptic Feedback'],
  Android: ['Push Notifications', 'Material You Theming', 'Offline Mode', 'Home Screen Widgets', 'Background Sync'],
  Wearable: ['Health Metrics', 'Glanceable UI', 'Haptic Alerts', 'Complication Support', 'Voice Commands'],
  Desktop: ['Keyboard Shortcuts', 'System Tray Integration', 'Auto Updates', 'Multi-Window Support', 'File System Access'],
};

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
    primaryGoal: '',
    targetAudience: '',
    platforms: [],
    features: [],
  });

  // Step 3: feature input
  const [featureInput, setFeatureInput] = useState('');

  // Step 4: generation
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
          return formData.primaryGoal.trim().length > 0 && formData.targetAudience.trim().length > 0;
        case 2:
          return formData.features.length >= 1;
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
    (field: keyof WizardFormData, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const togglePlatform = useCallback((platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  }, []);

  const addFeature = useCallback(() => {
    const trimmed = featureInput.trim();
    if (trimmed && !formData.features.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
      setFeatureInput('');
    }
  }, [featureInput, formData.features]);

  const removeFeature = useCallback((feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }));
  }, []);

  const addSuggestedFeatures = useCallback(() => {
    const suggestions: string[] = [];
    formData.platforms.forEach((platform) => {
      const platformFeatures = SUGGESTED_FEATURES[platform];
      if (platformFeatures) {
        platformFeatures.forEach((f) => {
          if (!formData.features.includes(f) && !suggestions.includes(f)) {
            suggestions.push(f);
          }
        });
      }
    });
    if (suggestions.length > 0) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, ...suggestions],
      }));
    }
  }, [formData.platforms, formData.features]);

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
          primaryGoal: formData.primaryGoal,
          targetAudience: formData.targetAudience,
          platforms: formData.platforms,
          features: formData.features,
        }),
      });

      if (!response.ok) {
        // Try to read error message from JSON body
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

      // Also try header (may work in some environments)
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

        // Parse document ID from first chunk prefix
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

      // If we got a docId from header but not set yet
      if (docId && !documentId) {
        setDocumentId(docId);
      }

      // Save the final content to the document
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
  }, [formData, documentId]);

  // ─── Progress Bar ─────────────────────────────────────────────────────────

  const progressPercent = ((currentStep + 1) / STEP_LABELS.length) * 100;

  // ─── Transition classes ───────────────────────────────────────────────────

  const transitionClass = isTransitioning
    ? slideDirection === 'forward'
      ? 'opacity-0 translate-x-8'
      : 'opacity-0 -translate-x-8'
    : 'opacity-100 translate-x-0';

  // ─── Render Steps ─────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-8">
      {/* Product Name */}
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

      {/* Product Description */}
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

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Primary Goal */}
      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background" htmlFor="primary_goal">
          What is the primary goal of this product?
        </label>
        <textarea
          id="primary_goal"
          value={formData.primaryGoal}
          onChange={(e) => updateField('primaryGoal', e.target.value)}
          placeholder="e.g., Increase user retention by 20% by simplifying the onboarding flow."
          rows={3}
          className="w-full bg-surface-container rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 text-on-surface p-4 text-lg transition-all duration-200 resize-none hover:bg-surface-container-highest outline-none"
        />
        <p className="text-sm text-on-surface-variant pl-2">
          Try to be specific and measurable if possible.
        </p>
      </div>

      {/* Target Audience */}
      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background" htmlFor="target_audience">
          Who is your target audience?
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-4 text-tertiary">groups</span>
          <input
            id="target_audience"
            type="text"
            value={formData.targetAudience}
            onChange={(e) => updateField('targetAudience', e.target.value)}
            placeholder="e.g., Freelance designers, Small business owners..."
            className="w-full bg-surface-container rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 text-on-surface py-4 pl-12 pr-4 text-lg transition-all duration-200 hover:bg-surface-container-highest outline-none"
          />
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background">Target Platforms</label>
        <div className="flex flex-wrap gap-3">
          {PLATFORM_OPTIONS.map((platform) => {
            const isActive = formData.platforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={`px-6 py-2 rounded-full border-2 font-bold transition-all duration-200 ease-out flex items-center gap-2 hover:scale-105 ${
                  isActive
                    ? 'border-primary bg-primary-container text-on-primary-container shadow-[0_2px_8px_rgba(224,64,160,0.2)]'
                    : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary'
                }`}
              >
                <span
                  className="material-symbols-outlined text-sm"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {platform.icon}
                </span>
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      {/* Feature Input */}
      <div className="space-y-3">
        <label className="block font-label text-lg font-bold text-on-background" htmlFor="feature_input">
          Add key features for your product
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-3.5 text-secondary">
              add_circle
            </span>
            <input
              id="feature_input"
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
              placeholder="e.g., User Authentication, Real-time Chat..."
              className="w-full bg-surface-container rounded-lg border-2 border-transparent focus:border-primary focus:ring-0 text-on-surface py-3 pl-12 pr-4 text-lg transition-all duration-200 hover:bg-surface-container-highest outline-none"
            />
          </div>
          <button
            type="button"
            onClick={addFeature}
            disabled={!featureInput.trim()}
            className="px-6 py-3 rounded-lg bg-primary text-on-primary font-bold shadow-[0_4px_16px_rgba(224,64,160,0.25)] hover:scale-105 hover:shadow-[0_6px_24px_rgba(224,64,160,0.35)] transition-all duration-200 ease-out disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add
          </button>
        </div>
      </div>

      {/* Suggested Features */}
      {formData.platforms.length > 0 && (
        <div>
          <button
            type="button"
            onClick={addSuggestedFeatures}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-tertiary-container text-on-tertiary-container font-bold text-sm hover:scale-105 transition-all duration-200 shadow-[0_2px_8px_rgba(0,150,204,0.15)]"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            Add suggested features for {formData.platforms.join(', ')}
          </button>
        </div>
      )}

      {/* Feature Tags */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-on-surface-variant">
            {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''} added
            {formData.features.length === 0 && (
              <span className="text-error ml-2">(minimum 1 required)</span>
            )}
          </p>
        </div>

        {formData.features.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {formData.features.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-full text-sm font-bold shadow-sm group hover:shadow-md transition-shadow"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="w-5 h-5 rounded-full bg-on-primary-fixed/20 hover:bg-on-primary-fixed/40 flex items-center justify-center transition-colors ml-1"
                  aria-label={`Remove ${feature}`}
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            ))}
          </div>
        )}

        {formData.features.length === 0 && (
          <div className="border-2 border-dashed border-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center text-on-surface-variant gap-3">
            <span className="material-symbols-outlined text-4xl opacity-40">featured_play_list</span>
            <p className="font-bold text-sm">No features added yet</p>
            <p className="text-xs">Type a feature above and press Enter or click Add</p>
          </div>
        )}
      </div>
    </div>
  );

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

            {/* Goals */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Primary Goal</p>
              <p className="text-on-surface leading-relaxed">{formData.primaryGoal}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target Audience</p>
              <p className="text-on-surface font-medium">{formData.targetAudience}</p>
            </div>

            <div className="border-t border-outline-variant/30" />

            {/* Platforms */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {formData.platforms.length > 0 ? (
                  formData.platforms.map((p) => (
                    <span
                      key={p}
                      className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-sm font-bold"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-on-surface-variant text-sm italic">No platforms specified</span>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Features ({formData.features.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((f) => (
                  <span
                    key={f}
                    className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-sm font-bold"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
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
          {/* Status indicator */}
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

          {/* Streaming content */}
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

          {/* Post-generation actions */}
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
    1: 'Define your goals and who you\u2019re building for.',
    2: 'List the key features you want to include.',
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

        {/* Progress Bar */}
        <div className="mb-10 relative">
          {/* Step Labels */}
          <div className="flex justify-between mb-2">
            {STEP_LABELS.map((label, idx) => (
              <span
                key={label}
                className={`text-label-md font-bold transition-colors duration-300 text-xs md:text-sm ${
                  idx <= currentStep ? 'text-primary' : 'text-outline'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </span>
            ))}
          </div>

          {/* Bar Track */}
          <div className="w-full bg-surface-container-high rounded-full h-3 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full shadow-[0_2px_8px_rgba(224,64,160,0.4)] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Dots */}
          <div className="absolute top-6 left-0 w-full flex justify-between px-0">
            {STEP_LABELS.map((_, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isFuture = idx > currentStep;
              return (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center -mt-[18px] transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary shadow-[0_2px_8px_rgba(224,64,160,0.3)]'
                      : isCurrent
                      ? 'bg-secondary border-4 border-white shadow-[0_2px_8px_rgba(124,82,170,0.3)]'
                      : 'bg-surface-container-high'
                  } ${idx === 0 ? '-ml-0' : idx === STEP_LABELS.length - 1 ? '-mr-0' : ''}`}
                >
                  {isCompleted && (
                    <span className="material-symbols-outlined text-on-primary text-xs font-bold">check</span>
                  )}
                  {isFuture && (
                    <span className="text-on-surface-variant text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
              );
            })}
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
              Back
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
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-4 w-52 bg-inverse-surface text-inverse-on-surface p-3 rounded-lg text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Need help? Each step guides you through building a perfect PRD!
          </div>
        </button>
      </div>
    </div>
  );
}
