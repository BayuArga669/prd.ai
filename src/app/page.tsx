'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type PromptId = 'ride-sharing' | 'ai-calendar' | 'developer-portfolio';

interface PromptData {
  title: string;
  tagline: string;
  prompt: string;
  output: string;
}

const PROMPTS: Record<PromptId, PromptData> = {
  'ride-sharing': {
    title: 'Ride-Sharing for Pets',
    tagline: 'Uber-like transportation booking app built specifically for animals',
    prompt: 'Build a mobile app for booking pet taxi rides with pet-sitting certified drivers.',
    output: `# Product Requirement Document (PRD)
## Project: PetRide - Uber for Pets

### 1. Product Overview
PetRide connects pet owners with background-checked, pet-certified drivers. Allows booking safe, tracked transit for dogs, cats, and small animals.

### 2. Key Features
- **Pet Profiles**: Owners specify breed, size, temperament, and special needs.
- **Live Video Feed**: Camera stream in the backseat so owners watch live.
- **Certified Drivers**: Drivers must pass animal first-aid and safety courses.

### 3. User Flow
1. Owner opens app, inputs pickup/dropoff and specifies pet size.
2. App calculates estimate and pairs with nearby certified driver.
3. Driver arrives, secures pet in harness/carrier, starts trip.`
  },
  'ai-calendar': {
    title: 'AI Meeting Scheduler',
    tagline: 'Automatic scheduling assistant that negotiates times via email',
    prompt: 'An AI calendar assistant that schedules meetings by parsing email threads.',
    output: `# Product Requirement Document (PRD)
## Project: CronoAI - Email Calendar Assistant

### 1. Product Overview
CronoAI is a background service that parses incoming emails to coordinate, negotiate, and book calendar invites automatically without manual triage.

### 2. Key Features
- **Natural Language Parsing**: Analyzes conversational dates ("next Tuesday afternoon").
- **Conflict Resolution**: Cross-references multiple calendars (Google, Outlook).
- **Auto-Drafting**: Suggests replies with proposed times.

### 3. User Flow
1. User CCs assistant@crono.ai on an email thread.
2. CronoAI reads thread, checks calendar availability.
3. Assistant emails back with 3 optimal slots, and books when confirmed.`
  },
  'developer-portfolio': {
    title: 'Dev Portfolio Builder',
    tagline: 'Instant developer portfolio page generated directly from GitHub',
    prompt: 'A generator that parses GitHub profile to create a stunning developer portfolio.',
    output: `# Product Requirement Document (PRD)
## Project: DevShowcase - GitHub Portfolio Builder

### 1. Product Overview
DevShowcase ingests GitHub repositories, star counts, and commit histories, compiling them into a beautiful, personalized, SEO-optimized portfolio.

### 2. Key Features
- **Auto-categorization**: Groups repositories by language and impact.
- **Interactive Charts**: Generates weekly commit heatmaps.
- **Vercel Handoff**: Deploy to a custom domain in 1 click.

### 3. User Flow
1. User signs in via GitHub OAuth.
2. DevShowcase analyzes repos and highlights the best contributions.
3. User edits custom details and clicks "Deploy" to launch instantly.`
  }
};

const FAQS = [
  {
    q: 'How does the AI generate technical specifications?',
    a: 'PRD.ai uses advanced LLMs fine-tuned on thousands of high-quality product specifications. By analyzing your prompt, it maps out requirements, user stories, constraints, and architecture diagrams tailored to your tech stack.'
  },
  {
    q: 'Can I import my existing product notes?',
    a: 'Absolutely! You can paste raw transcripts, scattered bullet points, or upload markdown documents. The AI engine parses unstructured data and turns it into clean, standardized documentation.'
  },
  {
    q: 'What integrations are supported?',
    a: 'We support direct export to Jira (as structured tickets), Notion (as formatted pages), Slack (updates), GitHub (markdown files), and raw Markdown/PDF formats.'
  },
  {
    q: 'How secure is my product data?',
    a: 'Security is our priority. Your data is encrypted in transit and at rest. We do not use your proprietary product data or prompts to train public models.'
  }
];

export default function Home() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPromptId, setSelectedPromptId] = useState<PromptId>('ride-sharing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: idle, 1: analyzing, 2: structuring, 3: typing, 4: complete
  const [outputText, setOutputText] = useState('');
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const outputRef = useRef<HTMLPreElement>(null);

  // Auto-scroll output window during generation
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputText]);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationStep(1);
    setOutputText('');

    // Step 1: Analyzing
    setTimeout(() => {
      setGenerationStep(2);
      
      // Step 2: Structuring
      setTimeout(() => {
        setGenerationStep(3);
        
        // Step 3: Typewriter effect
        const fullOutput = PROMPTS[selectedPromptId].output;
        let index = 0;
        const interval = setInterval(() => {
          if (index < fullOutput.length) {
            setOutputText((prev) => prev + fullOutput.substring(index, index + 2));
            index += 2; // Type 2 chars at a time for smooth speed
          } else {
            clearInterval(interval);
            setIsGenerating(false);
            setGenerationStep(4);
          }
        }, 15);
      }, 1200);
    }, 1000);
  };

  // Reset simulator if prompt changes
  const handlePromptChange = (id: PromptId) => {
    setSelectedPromptId(id);
    setIsGenerating(false);
    setGenerationStep(0);
    setOutputText('');
  };

  return (
    <div className="min-h-screen flex flex-col font-body relative bg-background">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-60"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] blob-shape"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[120px] blob-shape" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] left-[60%] w-[40%] h-[40%] rounded-full bg-tertiary/15 blur-[90px] blob-shape" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-[60%] left-[10%] w-[30%] h-[30%] rounded-full bg-primary-container/20 blur-[80px] blob-shape" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* TopNavBar */}
      <nav className="bg-surface/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b-4 border-on-surface text-body-base shadow-[0_4px_0_rgba(46,26,40,0.1)]">
        <div className="flex justify-between items-center px-6 md:px-8 h-20 max-w-7xl mx-auto">
          <div className="font-headline text-2xl font-black text-primary flex items-center gap-2.5 bg-primary/10 px-4 py-2 rounded-xl border-2 border-primary rotate-[-2deg] shadow-[2px_2px_0_#e040a0]">
            <Image src="/logo.png" alt="PRD.ai Logo" width={28} height={28} className="rounded-md object-cover border border-primary/20" />
            PRD.ai
          </div>
          <div className="hidden md:flex gap-8 items-center font-bold">
            <a className="text-on-surface hover:text-primary hover:-translate-y-0.5 transition-all duration-200" href="#features">Features</a>
            <a className="text-on-surface hover:text-secondary hover:-translate-y-0.5 transition-all duration-200" href="#demo">Interactive Demo</a>
            <a className="text-on-surface hover:text-tertiary hover:-translate-y-0.5 transition-all duration-200" href="#pricing">Pricing</a>
            <Link className="text-on-surface hover:text-primary hover:-translate-y-0.5 transition-all duration-200" href="/dashboard">Dashboard</Link>
          </div>
          <div className="hidden md:block">
            <Link href="/login?mode=register" className="pop-btn inline-block text-white font-bold px-6 py-3 rounded-xl transition-all">
              Get Started
            </Link>
          </div>
          {/* Mobile Menu Icon */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface bg-surface-container p-2 border-2 border-on-surface rounded-lg shadow-[2px_2px_0_#2e1a28] active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all"
          >
            <span className="material-symbols-outlined font-bold">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-on-surface bg-surface p-6 flex flex-col gap-4 font-bold animate-fadeIn">
            <a onClick={() => setMobileMenuOpen(false)} className="text-on-surface hover:text-primary py-2 border-b border-on-surface/10" href="#features">Features</a>
            <a onClick={() => setMobileMenuOpen(false)} className="text-on-surface hover:text-secondary py-2 border-b border-on-surface/10" href="#demo">Interactive Demo</a>
            <a onClick={() => setMobileMenuOpen(false)} className="text-on-surface hover:text-tertiary py-2 border-b border-on-surface/10" href="#pricing">Pricing</a>
            <Link onClick={() => setMobileMenuOpen(false)} className="text-on-surface hover:text-primary py-2 border-b border-on-surface/10" href="/dashboard">Dashboard</Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/login?mode=register" className="pop-btn text-center text-white py-3 rounded-xl mt-2 block">
              Get Started
            </Link>
          </div>
        )}
      </nav>
      
      <main className="flex-grow pt-28 pb-32 overflow-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 pt-12 md:pt-16 pb-20 flex flex-col items-center text-center relative z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[800px] bg-wavy opacity-30 pointer-events-none -z-10" style={{ maskImage: 'linear-gradient(to bottom, white, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, white, transparent)' }}></div>
          
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full mb-8 border-3 border-on-surface bg-primary shadow-[4px_4px_0_#2e1a28] rotate-[-2deg] hover:rotate-0 transition-transform cursor-pointer">
            <span className="w-3 h-3 rounded-full bg-white animate-pulse border-2 border-on-surface"></span>
            <span className="font-label-caps text-sm text-white font-extrabold tracking-wider">PRD.AI V2.0 IS LIVE</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl max-w-4xl mb-6 leading-[1.1] relative text-on-surface font-black">
            Generate Perfect PRDs in <br/>
            <span className="inline-block relative">
              <span className="relative z-10 text-shimmer">Seconds with AI</span>
              <span className="absolute bottom-2 left-0 w-full h-4 bg-tertiary/20 -rotate-1 -z-10"></span>
            </span>
          </h1>

          <p className="font-body text-on-surface-variant max-w-2xl mb-10 text-lg md:text-xl font-medium bg-white/70 backdrop-blur-sm p-6 rounded-2xl border-3 border-on-surface shadow-[6px_6px_0_rgba(46,26,40,0.1)]">
            From idea to comprehensive technical documentation in one click. Stop staring at blank pages and start building faster. Designed for product managers who demand precision.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20 relative z-20 w-full sm:w-auto">
            <Link href="/login?mode=register" className="pop-btn text-white font-bold px-10 py-4 rounded-xl text-lg text-center">
              Get Started for Free
            </Link>
            <a href="#demo" className="pop-btn-secondary text-white font-bold px-10 py-4 rounded-xl flex items-center justify-center gap-2 text-lg text-center">
              <span className="material-symbols-outlined text-[24px]">play_circle</span>
              Try Interactive Demo
            </a>
          </div>
          
          {/* Interactive Simulator Section */}
          <div id="demo" className="w-full max-w-5xl relative group perspective-1000 scroll-mt-24">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary via-tertiary to-secondary rounded-[2.5rem] blur-2xl opacity-30 animate-pulse -z-10"></div>
            
            {/* Mock IDE/Terminal Card */}
            <div className="w-full rounded-[2rem] overflow-hidden border-4 border-on-surface shadow-[12px_12px_0_#2e1a28] bg-surface z-10 flex flex-col md:flex-row">
              
              {/* Left Pane: Config & Prompt selection */}
              <div className="w-full md:w-2/5 border-b-4 md:border-b-0 md:border-r-4 border-on-surface p-6 bg-surface-container/60 flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-3.5 h-3.5 rounded-full bg-error border border-on-surface"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-primary-container border border-on-surface"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-tertiary border border-on-surface"></span>
                    <span className="text-sm font-bold text-on-surface-variant ml-2 font-mono">prompt_manager.sh</span>
                  </div>

                  <h3 className="text-xl font-headline font-black text-on-surface mb-4">Choose a Prompt</h3>
                  
                  {/* Prompt Selectors */}
                  <div className="flex flex-col gap-3 mb-6">
                    {(Object.keys(PROMPTS) as PromptId[]).map((id) => (
                      <button
                        key={id}
                        onClick={() => handlePromptChange(id)}
                        className={`p-4 rounded-xl border-3 text-left transition-all duration-200 flex items-start gap-3 ${
                          selectedPromptId === id
                            ? 'bg-primary/10 border-primary shadow-[3px_3px_0_#e040a0] -translate-y-0.5'
                            : 'bg-white border-on-surface hover:bg-surface-container-low shadow-[3px_3px_0_#2e1a28]'
                        }`}
                      >
                        <span className={`material-symbols-outlined p-1.5 rounded-lg border-2 border-on-surface ${
                          selectedPromptId === id ? 'bg-primary text-white' : 'bg-surface text-on-surface'
                        }`}>
                          {id === 'ride-sharing' ? 'directions_car' : id === 'ai-calendar' ? 'calendar_today' : 'code'}
                        </span>
                        <div>
                          <div className="font-extrabold text-sm text-on-surface">{PROMPTS[id].title}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{PROMPTS[id].tagline}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Input Box representation */}
                  <div className="bg-white p-4 rounded-xl border-3 border-on-surface font-mono text-sm mb-6 min-h-[90px] shadow-[inset_3px_3px_0_rgba(0,0,0,0.05)] text-on-surface">
                    <span className="text-primary font-bold">input_idea: </span>
                    <span className="font-medium text-on-surface-variant">&quot;{PROMPTS[selectedPromptId].prompt}&quot;</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 px-6 rounded-xl font-bold border-3 border-on-surface flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0_#2e1a28] ${
                    isGenerating
                      ? 'bg-surface-container text-on-surface-variant cursor-not-allowed shadow-[1px_1px_0_#2e1a28] translate-x-0.5 translate-y-0.5'
                      : 'bg-secondary text-white hover:bg-secondary/95 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#2e1a28] active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28]'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isGenerating ? 'animate-spin' : ''}`}>
                    {isGenerating ? 'sync' : 'bolt'}
                  </span>
                  {isGenerating ? 'Generating PRD...' : 'Generate PRD Spec'}
                </button>
              </div>

              {/* Right Pane: Simulated Terminal output */}
              <div className="w-full md:w-3/5 p-6 bg-on-background text-white flex flex-col text-left font-mono">
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">terminal</span>
                    <span className="text-sm font-bold text-white/70">prd_generator_stdout.md</span>
                  </div>
                  {generationStep > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-tertiary animate-pulse">
                      <span>Step {generationStep}/3</span>
                    </div>
                  )}
                </div>

                {/* Output Display Container */}
                <pre 
                  ref={outputRef}
                  className="flex-grow overflow-y-auto text-sm leading-relaxed min-h-[350px] max-h-[450px] whitespace-pre-wrap font-mono scrollbar-thin"
                >
                  {generationStep === 0 && (
                    <div className="text-white/40 h-full flex flex-col items-center justify-center text-center gap-3">
                      <span className="material-symbols-outlined text-4xl animate-bounce">rocket_launch</span>
                      <span>Click the &quot;Generate PRD Spec&quot; button to watch the AI build a complete product requirement spec in real-time.</span>
                    </div>
                  )}

                  {generationStep === 1 && (
                    <div className="text-tertiary flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        <span>[1/3] Analyzing core product concept...</span>
                      </div>
                      <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden mt-2">
                        <div className="bg-tertiary h-full rounded-full animate-[loading_1.2s_ease-in-out_infinite]" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                  )}

                  {generationStep === 2 && (
                    <div className="text-secondary flex flex-col gap-2">
                      <div className="text-white/60">[✓] Concept analysis complete.</div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        <span>[2/3] Extracting user stories &amp; outlining data flows...</span>
                      </div>
                      <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden mt-2">
                        <div className="bg-secondary h-full rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  )}

                  {generationStep >= 3 && (
                    <div className="relative">
                      <div className="text-white font-mono select-text">{outputText}</div>
                      {isGenerating && (
                        <span className="inline-block w-2.5 h-4 bg-tertiary ml-0.5 animate-ping"></span>
                      )}
                    </div>
                  )}
                </pre>

                {generationStep === 4 && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
                    <span>Generated in 2.2s • 345 tokens</span>
                    <span className="text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span> Ready to Export
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
        
        {/* Logo Marquee */}
        <section className="border-y-4 border-on-surface bg-surface-container-high py-8 mb-20 relative overflow-hidden flex items-center shadow-[0_8px_0_rgba(46,26,40,0.05)]">
          <div className="absolute left-0 bg-gradient-to-r from-surface-container-high to-transparent w-24 md:w-32 h-full z-10"></div>
          <div className="absolute right-0 bg-gradient-to-l from-surface-container-high to-transparent w-24 md:w-32 h-full z-10"></div>
          <div className="marquee-container">
            <div className="marquee-content flex gap-16 md:gap-24 items-center px-8 font-display text-2xl md:text-4xl font-black text-on-surface/30">
              <span>Vercel</span> <span className="text-primary text-xl material-symbols-outlined">star</span> <span>Stripe</span> <span className="text-secondary text-xl material-symbols-outlined">star</span> <span>Linear</span> <span className="text-tertiary text-xl material-symbols-outlined">star</span> <span>Notion</span> <span className="text-primary text-xl material-symbols-outlined">star</span> <span>Jira</span> <span className="text-secondary text-xl material-symbols-outlined">star</span> <span>GitHub</span> <span className="text-tertiary text-xl material-symbols-outlined">star</span>
              <span>Vercel</span> <span className="text-primary text-xl material-symbols-outlined">star</span> <span>Stripe</span> <span className="text-secondary text-xl material-symbols-outlined">star</span> <span>Linear</span> <span className="text-tertiary text-xl material-symbols-outlined">star</span> <span>Notion</span> <span className="text-primary text-xl material-symbols-outlined">star</span> <span>Jira</span> <span className="text-secondary text-xl material-symbols-outlined">star</span> <span>GitHub</span>
            </div>
          </div>
        </section>
        
        {/* Features Bento Grid Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 md:px-8 py-16 scroll-mt-24">
          <div className="text-center mb-16 relative">
            <div className="bg-white/70 backdrop-blur-md inline-block px-10 py-5 rounded-[2rem] border-3 border-on-surface shadow-[6px_6px_0_#e040a0] rotate-[-1deg]">
              <h2 className="font-headline text-3xl md:text-4xl text-on-surface font-black">Supercharged Capabilities</h2>
              <p className="font-body text-secondary font-bold text-base md:text-lg mt-1">Built to unblock development teams instantly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Bento 1: AI Command Editor (Col span 2) */}
            <div className="md:col-span-2 glass-neo-card p-6 md:p-8 rounded-[2rem] flex flex-col justify-between group min-h-[350px]">
              <div>
                <span className="bg-primary/10 text-primary border-2 border-primary font-extrabold text-xs px-4 py-1.5 rounded-full w-fit inline-block mb-4">Command Center</span>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-3">AI-Infused Spec Editor</h3>
                <p className="text-on-surface-variant font-medium text-base mb-6 max-w-lg">
                  Refine requirements directly inside your doc. Type <code className="bg-surface-container px-2 py-1 rounded border border-on-surface/20 text-primary font-bold text-sm">/ai</code> to write test cases, expand user stories, or analyze edge cases.
                </p>
              </div>

              {/* Mock Editor UI */}
              <div className="bg-white border-3 border-on-surface rounded-xl p-4 shadow-[4px_4px_0_#2e1a28] font-mono text-xs text-on-surface-variant text-left relative h-52 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-on-surface/10 pb-2 mb-3">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                      spec_draft.md
                    </span>
                    <span className="text-[10px] text-on-surface-variant/40">Markdown</span>
                  </div>
                  <div className="text-on-surface/90 font-bold"># Features &amp; Functional Scope</div>
                  <div className="mt-1 text-on-surface-variant">1. User can upload audio logs to the database.</div>
                </div>

                {/* AI Input Line & Suggestions */}
                <div className="relative mt-2">
                  {/* Floating Suggestions (Popping up above the input) */}
                  <div className="absolute left-2 right-2 bottom-full mb-2 bg-white border-2 border-on-surface p-2.5 rounded-lg shadow-[3px_3px_0_#7c52aa] flex flex-col gap-1.5 z-10">
                    <div className="font-black text-[9px] text-secondary tracking-widest uppercase">Suggestions:</div>
                    <div className="bg-secondary/10 text-secondary border border-secondary/20 px-2 py-1 rounded font-bold flex justify-between items-center text-[10px]">
                      <span>Generate offline queue support spec</span>
                      <span className="font-mono text-[8px] bg-secondary/30 px-1.5 py-0.5 rounded text-secondary/80">Enter</span>
                    </div>
                    <div className="px-2 py-0.5 text-[10px] text-on-surface-variant/70 font-semibold">Outline retry logic parameters</div>
                  </div>

                  {/* Input Line */}
                  <div className="bg-primary/5 text-primary border-2 border-primary/30 p-2.5 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="material-symbols-outlined text-sm font-bold">auto_awesome</span>
                    <span>/ai generate edge cases for upload failures</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 3: Template Library */}
            <div className="glass-neo-card p-6 md:p-8 rounded-[2rem] flex flex-col justify-between group min-h-[350px]">
              <div>
                <span className="bg-tertiary/10 text-tertiary border-2 border-tertiary font-extrabold text-xs px-4 py-1.5 rounded-full w-fit inline-block mb-4">Presets</span>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-3">15+ Templates</h3>
                <p className="text-on-surface-variant font-medium text-base mb-6">
                  Start from proven industry blueprints designed by product experts.
                </p>
              </div>

              {/* Stacked Cards mockup */}
              <div className="relative h-28 flex justify-center items-end">
                <div className="absolute bottom-0 w-[90%] bg-surface border-2 border-on-surface p-3 rounded-xl shadow-[2px_2px_0_#2e1a28] flex items-center justify-between text-xs font-bold text-on-surface/30 rotate-[3deg] translate-y-3">
                  <span>Release Notes Template</span>
                  <span className="material-symbols-outlined text-sm">arrow_outward</span>
                </div>
                <div className="absolute bottom-2 w-[95%] bg-surface border-2 border-on-surface p-3 rounded-xl shadow-[3px_3px_0_#2e1a28] flex items-center justify-between text-xs font-bold text-on-surface/60 rotate-[-2deg] translate-y-1">
                  <span>User Story Spec</span>
                  <span className="material-symbols-outlined text-sm">arrow_outward</span>
                </div>
                <div className="absolute bottom-4 w-full bg-white border-2 border-on-surface p-3.5 rounded-xl shadow-[4px_4px_0_#e040a0] flex items-center justify-between text-xs font-black text-on-surface z-10 hover:-translate-y-1 hover:rotate-0 transition-all cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-sm font-bold animate-pulse">star</span>
                    <span>Standard PRD Spec</span>
                  </span>
                  <span className="material-symbols-outlined text-primary text-sm font-bold">arrow_forward</span>
                </div>
              </div>
            </div>

            {/* Bento 4: Diagram Generator (Col span 3) */}
            <div className="md:col-span-3 glass-neo-card p-6 md:p-8 rounded-[2rem] flex flex-col justify-between group min-h-[350px]">
              <div>
                <span className="bg-primary/10 text-primary border-2 border-primary font-extrabold text-xs px-4 py-1.5 rounded-full w-fit inline-block mb-4">Visualizers</span>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-3">Auto Flowchart Generation</h3>
                <p className="text-on-surface-variant font-medium text-base mb-6 max-w-lg">
                  PRD.ai turns text-based user flows into interactive technical diagrams automatically. Export your flows directly into Mermaid or PNG.
                </p>
              </div>

              {/* Flowchart Mockup */}
              <div className="bg-white border-3 border-on-surface rounded-xl p-4 shadow-[4px_4px_0_#7c52aa] flex justify-between items-center text-xs font-extrabold text-on-surface relative overflow-hidden h-36">
                <div className="bg-primary/10 border-2 border-primary text-primary px-3 py-2 rounded-lg flex items-center gap-1 shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 transition-transform cursor-pointer">
                  <span>User Action</span>
                </div>
                <span className="material-symbols-outlined text-secondary font-bold animate-pulse">arrow_forward</span>
                <div className="bg-secondary/10 border-2 border-secondary text-secondary px-3 py-2 rounded-lg flex flex-col items-center gap-0.5 shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 transition-transform cursor-pointer">
                  <span>AI Engine</span>
                  <span className="text-[9px] font-mono text-secondary/70">processing</span>
                </div>
                <span className="material-symbols-outlined text-tertiary font-bold">arrow_forward</span>
                <div className="bg-tertiary/10 border-2 border-tertiary text-tertiary px-3 py-2 rounded-lg flex items-center gap-1 shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 transition-transform cursor-pointer">
                  <span>Structured Spec</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 relative">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-[60px] pointer-events-none blob-shape"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-tertiary/10 rounded-[60%_40%_30%_70%/50%_60%_40%_50%] blur-[60px] pointer-events-none blob-shape" style={{ animationDelay: '3s' }}></div>
          
          <div className="text-center mb-20 relative z-10 bg-white/70 backdrop-blur-md inline-block px-10 py-5 rounded-[2rem] border-3 border-on-surface shadow-[6px_6px_0_#7c52aa] rotate-[1deg]">
            <h2 className="font-headline text-3xl mb-1 text-on-surface font-black">The Workflow Engine</h2>
            <p className="font-body text-secondary font-bold text-lg">Three steps to deployment-ready documentation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-1.5 bg-on-surface z-0 border-b border-white border-dashed"></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center p-4 group mt-12 md:mt-0">
              <div className="w-28 h-28 rounded-3xl pop-card flex items-center justify-center mb-6 bg-primary-fixed border-3 border-on-surface shadow-[8px_8px_0_#e040a0] rotate-[-5deg] group-hover:rotate-0 transition-transform z-10 relative">
                <span className="material-symbols-outlined text-5xl text-primary font-black">edit_note</span>
                <div className="absolute -top-3 -left-3 w-9 h-9 bg-tertiary rounded-full border-2 border-on-surface flex items-center justify-center text-white font-black text-lg shadow-[2px_2px_0_#2e1a28]">1</div>
              </div>
              <h3 className="font-headline text-xl mb-3 text-on-surface font-black bg-white px-4 py-1.5 rounded-lg border-2 border-on-surface shadow-[3px_3px_0_#e040a0] inline-block">Input your idea</h3>
              <p className="font-body text-on-surface-variant font-medium text-sm bg-white p-4 rounded-xl border-2 border-primary/20 max-w-xs shadow-[2px_2px_0_rgba(0,0,0,0.05)]">Simple text prompt or scratch notes. We handle the unstructured chaos.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center p-4 group md:mt-8">
              <div className="w-28 h-28 rounded-[2rem] pop-card flex items-center justify-center mb-6 bg-secondary-fixed border-3 border-on-surface shadow-[8px_8px_0_#7c52aa] rotate-[5deg] group-hover:rotate-0 transition-transform z-10 relative">
                <span className="material-symbols-outlined text-5xl text-secondary font-black">memory</span>
                <div className="absolute -top-3 -left-3 w-9 h-9 bg-tertiary rounded-full border-2 border-on-surface flex items-center justify-center text-white font-black text-lg shadow-[2px_2px_0_#2e1a28]">2</div>
              </div>
              <h3 className="font-headline text-xl mb-3 text-on-surface font-black bg-white px-4 py-1.5 rounded-lg border-2 border-on-surface shadow-[3px_3px_0_#7c52aa] inline-block">AI structures it</h3>
              <p className="font-body text-on-surface-variant font-medium text-sm bg-white p-4 rounded-xl border-2 border-secondary/20 max-w-xs shadow-[2px_2px_0_rgba(0,0,0,0.05)]">Advanced models analyze, expand, and outline tech requirements instantly.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center p-4 group mt-12 md:mt-0">
              <div className="w-28 h-28 rounded-full pop-card flex items-center justify-center mb-6 bg-tertiary-fixed border-3 border-on-surface shadow-[8px_8px_0_#0096cc] rotate-[-3deg] group-hover:rotate-0 transition-transform z-10 relative">
                <span className="material-symbols-outlined text-5xl text-tertiary font-black">share</span>
                <div className="absolute -top-3 -left-3 w-9 h-9 bg-primary rounded-full border-2 border-on-surface flex items-center justify-center text-white font-black text-lg shadow-[2px_2px_0_#2e1a28]">3</div>
              </div>
              <h3 className="font-headline text-xl mb-3 text-on-surface font-black bg-white px-4 py-1.5 rounded-lg border-2 border-on-surface shadow-[3px_3px_0_#0096cc] inline-block">Export &amp; Share</h3>
              <p className="font-body text-on-surface-variant font-medium text-sm bg-white p-4 rounded-xl border-2 border-tertiary/20 max-w-xs shadow-[2px_2px_0_rgba(0,0,0,0.05)]">One-click export to Markdown, Jira, or Notion to unblock your team.</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 md:px-8 py-20 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="bg-white/70 backdrop-blur-md inline-block px-10 py-5 rounded-[2rem] border-3 border-on-surface shadow-[6px_6px_0_#0096cc] rotate-[-1deg] mb-8">
              <h2 className="font-headline text-3xl md:text-4xl text-on-surface font-black">Flexible Pricing</h2>
              <p className="font-body text-secondary font-bold text-base md:text-lg mt-1">Start writing specs for free, upgrade as you scale.</p>
            </div>

            {/* Toggle monthly/yearly */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className={`text-base font-bold ${billingCycle === 'monthly' ? 'text-primary' : 'text-on-surface-variant'}`}>Monthly</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-16 h-9 rounded-full bg-on-surface border-3 border-on-surface relative transition-colors duration-200 focus:outline-none"
              >
                <div className={`w-5.5 h-5.5 rounded-full bg-white border-2 border-on-surface absolute top-0.5 transition-all duration-200 ${
                  billingCycle === 'yearly' ? 'left-8.5' : 'left-1'
                }`}></div>
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${billingCycle === 'yearly' ? 'text-primary' : 'text-on-surface-variant'}`}>Annually</span>
                <span className="bg-primary text-white font-extrabold text-[10px] tracking-wider px-2 py-1 rounded-md border border-on-surface rotate-[4deg] shadow-[2px_2px_0_#2e1a28]">SAVE 20%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Free Plan */}
            <div className="glass-neo-card p-8 rounded-[2rem] flex flex-col justify-between bg-white relative">
              <div>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-2">Starter</h3>
                <p className="text-on-surface-variant text-sm font-semibold mb-6">For solo founders testing ideas.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black text-on-surface">$0</span>
                  <span className="text-on-surface-variant text-sm font-bold">/ forever</span>
                </div>
                <div className="border-t border-on-surface/10 pt-6 mb-8">
                  <ul className="flex flex-col gap-4 text-sm font-bold text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>3 AI PRD generations per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>Markdown &amp; PDF export</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>Basic template library access</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link href="/login?mode=register" className="w-full py-4 text-center font-bold border-3 border-on-surface rounded-xl bg-white text-on-surface shadow-[4px_4px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all">
                Get Started
              </Link>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="glass-neo-card p-8 rounded-[2rem] flex flex-col justify-between bg-primary-fixed border-primary-container relative rotate-[1deg] shadow-[12px_12px_0_#e040a0]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white font-extrabold text-[10px] tracking-widest px-4 py-1.5 rounded-full border-2 border-on-surface shadow-[2px_2px_0_#2e1a28] uppercase whitespace-nowrap">
                Most Popular
              </div>
              <div>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-2">Product Pro</h3>
                <p className="text-on-surface-variant text-sm font-semibold mb-6">For professional product managers.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black text-on-surface">
                    {billingCycle === 'monthly' ? '$29' : '$23'}
                  </span>
                  <span className="text-on-surface-variant text-sm font-bold">/ month</span>
                </div>
                <div className="border-t border-on-surface/10 pt-6 mb-8">
                  <ul className="flex flex-col gap-4 text-sm font-bold text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg font-bold">check_circle</span>
                      <span>Unlimited generations &amp; edits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg font-bold">check_circle</span>
                      <span>Mermaid flowcharts &amp; diagrams</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg font-bold">check_circle</span>
                      <span>Jira, Notion &amp; Slack integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg font-bold">check_circle</span>
                      <span>All premium templates</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link href="/login?mode=register" className="w-full py-4 text-center font-black border-3 border-on-surface rounded-xl bg-secondary text-white shadow-[4px_4px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all">
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-neo-card p-8 rounded-[2rem] flex flex-col justify-between bg-white relative">
              <div>
                <h3 className="text-2xl font-headline font-black text-on-surface mb-2">Team Enterprise</h3>
                <p className="text-on-surface-variant text-sm font-semibold mb-6">For collaborative product units.</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black text-on-surface">
                    {billingCycle === 'monthly' ? '$89' : '$71'}
                  </span>
                  <span className="text-on-surface-variant text-sm font-bold">/ month</span>
                </div>
                <div className="border-t border-on-surface/10 pt-6 mb-8">
                  <ul className="flex flex-col gap-4 text-sm font-bold text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>Everything in Pro for up to 10 creators</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>Real-time collaborative editing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>Custom templates &amp; formatting styles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg font-bold">check_circle</span>
                      <span>SSO &amp; Advanced Workspace Admin Controls</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link href="/login?mode=register" className="w-full py-4 text-center font-bold border-3 border-on-surface rounded-xl bg-white text-on-surface shadow-[4px_4px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all">
                Contact Sales
              </Link>
            </div>

          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 md:px-8 py-20 relative">
          <div className="text-center mb-16">
            <div className="bg-white/70 backdrop-blur-md inline-block px-10 py-5 rounded-[2rem] border-3 border-on-surface shadow-[6px_6px_0_#7c52aa] rotate-[1deg]">
              <h2 className="font-headline text-3xl text-on-surface font-black">Frequently Asked Questions</h2>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqId === index;
              return (
                <div 
                  key={index} 
                  className="bg-white border-3 border-on-surface rounded-2xl shadow-[4px_4px_0_#2e1a28] overflow-hidden transition-all duration-200"
                >
                  <button 
                    onClick={() => setOpenFaqId(isOpen ? null : index)}
                    className="w-full p-6 text-left font-headline font-black text-on-surface text-lg flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined text-primary font-bold transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      keyboard_arrow_down
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-on-surface-variant font-medium text-base border-t border-on-surface/5 animate-slideDown leading-relaxed select-text">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-5xl mx-auto px-6 md:px-8 py-20 text-center relative">
          <div className="absolute inset-0 bg-wavy opacity-50 z-[-1]" style={{ maskImage: 'radial-gradient(circle, white, transparent)', WebkitMaskImage: 'radial-gradient(circle, white, transparent)' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,rgba(224,64,160,0.15)_0%,transparent_60%)] pointer-events-none rounded-full blur-[40px]"></div>
          
          <div className="relative z-10 bg-primary p-8 md:p-16 rounded-[2.5rem] border-4 border-on-surface shadow-[12px_12px_0_#2e1a28] overflow-hidden -rotate-1">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-[30px] mix-blend-overlay"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-secondary/30 rounded-full blur-[40px] mix-blend-multiply"></div>
            
            <h2 className="font-display text-4xl md:text-5xl mb-4 text-white font-black drop-shadow-[3px_3px_0_#2e1a28] rotate-1">Ready to build faster?</h2>
            <p className="font-body text-white/90 mb-8 text-lg md:text-xl font-bold max-w-xl mx-auto">Join thousands of product managers writing better specifications.</p>
            
            <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto relative z-10 rotate-1">
              <input 
                className="flex-grow bg-white border-3 border-on-surface text-on-surface rounded-xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-secondary/50 shadow-[4px_4px_0_#2e1a28] font-bold text-base placeholder-on-surface/50" 
                placeholder="Enter your work email" 
                type="email" 
                required
              />
              <button 
                className="bg-secondary text-white font-black text-lg px-8 py-4 rounded-xl border-3 border-on-surface shadow-[4px_4px_0_#2e1a28] hover:shadow-[5px_5px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all whitespace-nowrap" 
                type="submit"
              >
                Generate My First PRD
              </button>
            </form>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-surface border-t-4 border-on-surface text-on-surface-variant font-bold text-sm relative z-10 shadow-[0_-4px_0_rgba(46,26,40,0.05)]">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-8 py-8 max-w-7xl mx-auto gap-6">
          <div className="font-headline text-lg font-black text-primary bg-primary/10 px-4 py-2 rounded-xl border-2 border-primary rotate-[2deg] flex items-center gap-2.5">
            <Image src="/logo.png" alt="PRD.ai Logo" width={20} height={20} className="rounded-sm object-cover border border-primary/20" />
            PRD.ai
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center font-bold">
            <a className="text-on-surface hover:text-primary hover:underline decoration-2 underline-offset-4 transition-all" href="#">Privacy Policy</a>
            <a className="text-on-surface hover:text-secondary hover:underline decoration-2 underline-offset-4 transition-all" href="#">Terms of Service</a>
            <a className="text-on-surface hover:text-tertiary hover:underline decoration-2 underline-offset-4 transition-all" href="#">Twitter</a>
            <a className="text-on-surface hover:text-primary hover:underline decoration-2 underline-offset-4 transition-all" href="#">LinkedIn</a>
          </div>
          <div className="text-on-surface/70 text-center md:text-right font-bold bg-surface-container px-4 py-2 rounded-lg border-2 border-on-surface/10">
            © 2026 PRD.ai. Built for precision.
          </div>
        </div>
      </footer>
    </div>
  );
}
