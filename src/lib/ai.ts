/**
 * AI Integration Layer — Groq API Client
 * Uses native fetch() for zero-dependency Groq LLM calls.
 * Generates structured PRD documents from wizard inputs.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface WizardInputs {
  productName: string;
  productDescription: string;
  primaryGoal: string;
  targetAudience: string;
  platforms: string[];
  features: string[];
  templateType?: string;
  techPreference?: 'ai' | 'manual';
  techStack?: string[];
  aiAnswers?: Record<string, string | string[]>;
}

export interface AIQuestion {
  id: string;
  question: string;
  type: 'text' | 'chips';
  options?: string[];
  allowCustom?: boolean;
  multiSelect?: boolean;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqStreamChoice {
  delta: { content?: string };
  finish_reason: string | null;
}

interface GroqStreamChunk {
  choices: GroqStreamChoice[];
}

/**
 * Build the system prompt for PRD generation
 */
function buildSystemPrompt(): string {
  return `You are an expert Product Manager and Technical Writer. Your job is to generate comprehensive, professional Product Requirements Documents (PRDs).

Generate the PRD in clean Markdown format with the following sections:
1. **Executive Summary** — A concise overview of what this product/feature is and why it matters
2. **Problem Statement** — The core problem being solved and its impact
3. **Goals & Success Metrics** — Measurable objectives and KPIs
4. **Target Audience** — Detailed user personas and segments
5. **User Stories** — At least 5 user stories in "As a [role], I want [feature] so that [benefit]" format
6. **Functional Requirements** — Detailed feature specifications with acceptance criteria
7. **Non-Functional Requirements** — Performance, security, scalability, accessibility requirements
8. **Technical Approach** — High-level architecture and technology recommendations
9. **UI/UX Considerations** — Key design principles and interaction patterns
10. **Risks & Mitigations** — Potential risks and mitigation strategies
11. **Timeline & Milestones** — Phased rollout plan with estimated timeframes
12. **Appendix** — Glossary, references, and additional context

Rules:
- Be specific and actionable, not vague
- Include realistic metrics and numbers
- Write in professional but accessible language
- Use proper Markdown formatting (headers, lists, bold, tables where appropriate)
- Each section should be substantive (at least 3-5 bullet points or a solid paragraph)
- Total document should be 1500-3000 words`;
}

/**
 * Build the user prompt from wizard inputs
 */
function buildUserPrompt(inputs: WizardInputs): string {
  const platformList = inputs.platforms.length > 0
    ? inputs.platforms.join(', ')
    : 'Web';

  const featureList = inputs.features.length > 0
    ? inputs.features.map((f, i) => `${i + 1}. ${f}`).join('\n')
    : 'To be defined based on the product goals';

  // Build tech stack section
  let techSection = '';
  if (inputs.techPreference === 'manual' && inputs.techStack && inputs.techStack.length > 0) {
    techSection = `\n**Preferred Technology Stack:** ${inputs.techStack.join(', ')}`;
  } else if (inputs.techPreference === 'ai') {
    techSection = '\n**Technology Stack:** Please recommend the most suitable technology stack based on the product requirements.';
  }

  // Build AI answers section
  let aiAnswersSection = '';
  if (inputs.aiAnswers && Object.keys(inputs.aiAnswers).length > 0) {
    const answersFormatted = Object.entries(inputs.aiAnswers)
      .filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return typeof v === 'string' && v.trim().length > 0;
      })
      .map(([key, val]) => {
        const answer = Array.isArray(val) ? val.join(', ') : val;
        return `- **${key}:** ${answer}`;
      })
      .join('\n');
    if (answersFormatted) {
      aiAnswersSection = `\n\n**Additional Context from User:**\n${answersFormatted}`;
    }
  }

  return `Generate a complete PRD for the following product:

**Product Name:** ${inputs.productName}
**Description:** ${inputs.productDescription}
**Primary Goal:** ${inputs.primaryGoal || 'To be determined from context'}
**Target Audience:** ${inputs.targetAudience || 'To be determined from context'}
**Target Platforms:** ${platformList}${techSection}

**Key Features:**
${featureList}

${inputs.templateType ? `**Template Category:** ${inputs.templateType}` : ''}${aiAnswersSection}

Please generate a comprehensive, production-ready PRD document now.`;
}

/**
 * Generate a PRD using Groq API (non-streaming)
 * Returns the full generated markdown content.
 */
export async function generatePRD(inputs: WizardInputs): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    console.warn('GROQ_API_KEY not set — using fallback template generation');
    return generateFallbackPRD(inputs);
  }

  const messages: GroqMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(inputs) },
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Groq API error:', response.status, errBody);
      return generateFallbackPRD(inputs);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateFallbackPRD(inputs);
  } catch (error) {
    console.error('Groq API request failed:', error);
    return generateFallbackPRD(inputs);
  }
}

/**
 * Generate a PRD using Groq API with streaming.
 * Returns a ReadableStream that emits text chunks.
 */
export async function generatePRDStream(inputs: WizardInputs): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    // Return fallback as a stream
    const fallback = generateFallbackPRD(inputs);
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(fallback));
        controller.close();
      },
    });
  }

  const messages: GroqMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(inputs) },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.9,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const fallback = generateFallbackPRD(inputs);
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(fallback));
        controller.close();
      },
    });
  }

  // Transform the SSE stream into plain text chunks
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed: GroqStreamChunk = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Generate contextual follow-up questions based on product info.
 * Calls Groq API and returns structured JSON questions.
 */
export async function generateQuestions(
  productName: string,
  productDescription: string,
  techPreference: 'ai' | 'manual',
  techStack?: string[]
): Promise<AIQuestion[]> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    console.warn('GROQ_API_KEY not set — using fallback questions');
    return getFallbackQuestions(productName);
  }

  const techInfo = techPreference === 'manual' && techStack && techStack.length > 0
    ? `The user has chosen these technologies: ${techStack.join(', ')}.`
    : 'The user wants AI to recommend the tech stack.';

  const systemPrompt = `You are an expert Product Manager helping users build a Product Requirements Document (PRD).
Based on the product information provided, generate exactly 5 follow-up questions that will help create a more detailed and accurate PRD.

Rules:
- Questions MUST be in Bahasa Indonesia (Indonesian language)
- Each question should be concise and clear
- Mix question types: some should be open-ended text answers, others should have selectable chip options
- For chip-type questions, provide 4-6 relevant options based on the product
- Questions should cover: user persona/story, core features, competitive advantage, key user actions, and retention/engagement
- Make options specific to the product described, not generic

Return ONLY valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "q1",
    "question": "...",
    "type": "text"
  },
  {
    "id": "q2",
    "question": "...",
    "type": "chips",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "allowCustom": true,
    "multiSelect": true
  }
]`;

  const userPrompt = `Product Name: ${productName}
Product Description: ${productDescription}
Tech Context: ${techInfo}

Generate 5 contextual follow-up questions for this product's PRD.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error for questions:', response.status);
      return getFallbackQuestions(productName);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getFallbackQuestions(productName);
    }

    // Parse JSON from the response (handle possible markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const questions: AIQuestion[] = JSON.parse(jsonStr);

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return getFallbackQuestions(productName);
    }

    return questions.slice(0, 5).map((q, i) => ({
      id: q.id || `q${i + 1}`,
      question: q.question || '',
      type: q.type === 'chips' ? 'chips' : 'text',
      options: q.options,
      allowCustom: q.allowCustom ?? true,
      multiSelect: q.multiSelect ?? true,
    }));
  } catch (error) {
    console.error('generateQuestions error:', error);
    return getFallbackQuestions(productName);
  }
}

/**
 * Fallback questions when AI is unavailable
 */
function getFallbackQuestions(productName: string): AIQuestion[] {
  return [
    {
      id: 'q1',
      question: `Ceritakan seseorang yang paling butuh ${productName}. Sekarang mereka ngapain buat mengatasi masalahnya?`,
      type: 'text',
    },
    {
      id: 'q2',
      question: `Hal apa yang harus berhasil dilakukan pengguna saat pertama kali buka ${productName}?`,
      type: 'chips',
      options: ['Buat akun baru', 'Lihat fitur utama', 'Mulai pakai langsung', 'Import data lama'],
      allowCustom: true,
      multiSelect: true,
    },
    {
      id: 'q3',
      question: `Fitur mana saja yang paling wajib ada di ${productName}? (boleh pilih beberapa)`,
      type: 'chips',
      options: ['Dashboard utama', 'Notifikasi', 'Laporan/Analytics', 'Kolaborasi tim', 'Ekspor data'],
      allowCustom: true,
      multiSelect: true,
    },
    {
      id: 'q4',
      question: `Kenapa ${productName} lebih bagus daripada solusi yang sudah ada sekarang?`,
      type: 'chips',
      options: ['Lebih cepat', 'Tampilan lebih enak', 'Lebih murah', 'Fitur lebih lengkap'],
      allowCustom: true,
      multiSelect: true,
    },
    {
      id: 'q5',
      question: `Apa yang bikin pengguna mau buka ${productName} terus tiap hari?`,
      type: 'chips',
      options: ['Lihat progress', 'Dapat notifikasi penting', 'Update data baru', 'Kolaborasi dengan tim'],
      allowCustom: true,
      multiSelect: true,
    },
  ];
}

/**
 * Fallback PRD generation when no AI API key is available.
 * Produces a well-structured template-based document.
 */
function generateFallbackPRD(inputs: WizardInputs): string {
  const platforms = inputs.platforms.length > 0 ? inputs.platforms.join(', ') : 'Web';
  const features = inputs.features.length > 0
    ? inputs.features.map((f) => `- ${f}`).join('\n')
    : '- Core feature set to be defined';

  return `# ${inputs.productName} — Product Requirements Document

## Executive Summary

${inputs.productName} is a product designed to ${inputs.productDescription || 'solve key challenges for its target users'}. The primary objective is to ${inputs.primaryGoal || 'deliver value to users through innovative features and seamless experience'}.

This PRD outlines the requirements, user stories, technical approach, and timeline for building ${inputs.productName} targeting ${inputs.targetAudience || 'the intended user base'} across ${platforms}.

---

## Problem Statement

Users currently face challenges that ${inputs.productName} aims to address:
- Lack of streamlined solutions for the identified problem space
- Existing alternatives are either too complex, too expensive, or too limited
- The target audience (${inputs.targetAudience || 'users'}) needs a purpose-built solution

**Impact:** Without this product, users will continue to experience friction and inefficiency in their workflows.

---

## Goals & Success Metrics

### Primary Goal
${inputs.primaryGoal || 'Deliver a high-quality product that meets user needs'}

### Key Performance Indicators (KPIs)
| Metric | Target | Timeframe |
|--------|--------|-----------|
| User Adoption Rate | 1,000 active users | 3 months post-launch |
| User Retention (D30) | > 40% | Ongoing |
| Task Completion Rate | > 85% | Ongoing |
| Net Promoter Score (NPS) | > 50 | 6 months post-launch |
| Average Session Duration | > 5 minutes | Ongoing |

---

## Target Audience

### Primary Persona
- **Who:** ${inputs.targetAudience || 'Target users'}
- **Demographics:** Professionals aged 25-45
- **Pain Points:** Need for efficient, reliable tools
- **Goals:** Accomplish tasks faster with less friction

### Secondary Persona
- **Who:** Team leads and managers overseeing the primary users
- **Goals:** Visibility, reporting, and team coordination

---

## User Stories

1. As a new user, I want to quickly understand the product value so that I can decide to adopt it.
2. As a returning user, I want my preferences saved so that I can pick up where I left off.
3. As a power user, I want keyboard shortcuts and bulk actions so that I can work efficiently.
4. As a team lead, I want to see activity reports so that I can track team productivity.
5. As an admin, I want to manage user roles and permissions so that I can control access levels.

---

## Functional Requirements

### Key Features
${features}

### Detailed Requirements
1. **User Authentication** — Secure login/signup with email and social providers
2. **Core Workflow** — Primary value-delivery features aligned with the product goal
3. **Data Management** — CRUD operations for user-generated content
4. **Collaboration** — Sharing, commenting, and team features
5. **Export & Integration** — Data export (PDF, CSV) and third-party integrations

---

## Non-Functional Requirements

- **Performance:** Page load < 2s, API response < 500ms
- **Scalability:** Support 10,000 concurrent users
- **Security:** OWASP Top 10 compliance, data encryption at rest and in transit
- **Accessibility:** WCAG 2.1 AA compliance
- **Availability:** 99.9% uptime SLA
- **Platforms:** ${platforms}

---

## Technical Approach

### Architecture
- **Frontend:** React/Next.js with server-side rendering
- **Backend:** Node.js API with RESTful endpoints
- **Database:** MySQL/TiDB for relational data
- **AI/ML:** LLM integration for intelligent features
- **Infrastructure:** Cloud-hosted with CDN for static assets

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MySQL (TiDB Cloud) |
| AI | Groq API (LLaMA 3) |
| Deployment | Vercel / AWS |

---

## UI/UX Considerations

- Clean, modern interface with consistent design language
- Mobile-first responsive design for ${platforms}
- Progressive disclosure — show complexity only when needed
- Meaningful loading states and error handling
- Accessibility-first approach with proper ARIA labels

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | High | Strict MVP definition, phased releases |
| Technical debt | Medium | Medium | Code reviews, refactoring sprints |
| Low adoption | High | Medium | Beta testing, user feedback loops |
| API rate limits | Medium | Low | Caching, fallback mechanisms |
| Data security breach | Critical | Low | Security audits, encryption, RBAC |

---

## Timeline & Milestones

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: Foundation | Weeks 1-2 | Core architecture, auth, database |
| Phase 2: MVP Features | Weeks 3-6 | Primary features, basic UI |
| Phase 3: Polish | Weeks 7-8 | UI refinement, testing, bug fixes |
| Phase 4: Beta Launch | Week 9 | Limited release, feedback collection |
| Phase 5: GA Launch | Week 12 | Full public release |

---

## Appendix

### Glossary
- **PRD:** Product Requirements Document
- **MVP:** Minimum Viable Product
- **KPI:** Key Performance Indicator
- **NPS:** Net Promoter Score

### References
- Product vision document
- Competitive analysis report
- User research findings

---

*This PRD was generated by PRD.ai — AI-Powered Product Documentation*
*Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*
`;
}
