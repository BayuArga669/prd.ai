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
  return `You are an elite-level Product Manager, Software Architect, and Technical Writer. Your job is to generate extremely detailed, implementation-ready Product Requirements Documents (PRDs) that can be directly handed to an AI coding assistant (like Cursor, Claude Code, Copilot) to build the entire product.

The PRD must be comprehensive enough that an AI can read it and start coding immediately without asking clarifying questions.

Generate the PRD in clean Markdown format with ALL of the following sections:

# 1. Executive Summary
- Product vision in 2-3 paragraphs
- Core value proposition
- Key differentiators from competitors
- Target launch timeline

# 2. Problem Statement
- Detailed problem description with real-world scenarios
- Current user pain points (at least 5)
- Market gap analysis
- Impact of not solving this problem

# 3. Goals & Success Metrics
- Primary and secondary goals
- Detailed KPIs table with: Metric | Target | Measurement Method | Timeframe
- North Star metric
- OKRs (Objectives and Key Results)

# 4. Target Audience & User Personas
- At least 3 detailed user personas with: Name, Age, Role, Pain Points, Goals, Tech Savviness, Usage Frequency
- User segmentation matrix
- Primary vs secondary users

# 5. User Stories & Use Cases
- At least 10 user stories in "As a [role], I want [feature] so that [benefit]" format
- Group by epic/feature area
- Include acceptance criteria for each story
- Priority levels (P0/P1/P2/P3)

# 6. Functional Requirements
- Detailed feature specifications grouped by module
- For each feature: Description, User Flow, Input/Output, Edge Cases, Acceptance Criteria
- Feature dependency map
- MVP vs Phase 2 vs Phase 3 features

# 7. Information Architecture & Sitemap
- Complete page/screen hierarchy as a tree structure
- Navigation flow between pages
- URL structure (for web apps)

# 8. Wireframe Descriptions
- For each key screen: detailed layout description
- Component placement and hierarchy
- Responsive behavior (mobile/tablet/desktop)
- Interactive elements and their states

# 9. Database Schema Design
- Complete entity-relationship diagram description
- All tables/collections with columns, types, constraints
- Relationships (1:1, 1:N, N:N) with foreign keys
- Indexes for performance
- Use Markdown tables for schema definitions
- Example:
  | Column | Type | Constraints | Description |
  |--------|------|-------------|-------------|

# 10. API Specification
- RESTful API endpoints grouped by resource
- For each endpoint: Method, Path, Request Body, Response Body, Status Codes, Auth Required
- Use code blocks for request/response examples
- Authentication flow (JWT/OAuth/etc)
- Rate limiting rules
- WebSocket events (if applicable)

# 11. Technology Stack (Detailed)
- For each layer: specific technology, version, and WHY it was chosen
- Frontend: framework, UI library, state management, form handling, routing
- Backend: runtime, framework, ORM, validation
- Database: primary DB, caching layer, search engine
- Infrastructure: hosting, CI/CD, monitoring, logging
- Third-party services: auth, payments, email, analytics, storage
- Development tools: linter, formatter, testing framework

# 12. Project File Structure
- Complete directory tree with descriptions
- Example:
  \`\`\`
  src/
  ├── app/              # Next.js App Router pages
  │   ├── (auth)/       # Auth-related pages
  │   ├── (dashboard)/  # Dashboard pages
  │   └── api/          # API routes
  ├── components/       # Reusable UI components
  │   ├── ui/           # Base UI primitives
  │   └── features/     # Feature-specific components
  ├── lib/              # Utility functions
  ├── hooks/            # Custom React hooks
  ├── types/            # TypeScript type definitions
  └── styles/           # Global styles
  \`\`\`

# 13. Component Architecture
- Component tree for key pages
- Props interface for each major component
- State management approach (local state, context, store)
- Data flow diagrams

# 14. Authentication & Authorization
- Complete auth flow (signup, login, logout, password reset, email verification)
- Role-based access control (RBAC) matrix
- Session management strategy
- Security headers and CSRF protection

# 15. Non-Functional Requirements
- Performance budgets (LCP, FID, CLS targets)
- Scalability requirements with specific numbers
- Security requirements (OWASP Top 10 compliance details)
- Accessibility (WCAG 2.1 AA specifics)
- Browser/device support matrix
- SEO requirements
- Internationalization (i18n) needs

# 16. Error Handling & Edge Cases
- Error taxonomy (validation, auth, network, server)
- User-facing error messages
- Retry strategies
- Offline behavior
- Empty states for all views
- Loading states specification

# 17. Testing Strategy
- Unit test coverage targets and key test cases
- Integration test scenarios
- E2E test flows
- Performance test benchmarks
- Testing tools and frameworks

# 18. Deployment & DevOps
- Environment setup (dev, staging, production)
- CI/CD pipeline steps
- Environment variables list with descriptions
- Database migration strategy
- Rollback procedures
- Monitoring and alerting setup

# 19. Timeline & Milestones
- Detailed sprint-level breakdown
- Phase 1 (MVP): specific features and estimated time
- Phase 2: features and timeline
- Phase 3: features and timeline
- Dependencies between phases

# 20. Risks & Mitigations
- Technical risks with probability and impact matrix
- Business risks
- Mitigation strategies for each
- Contingency plans

# 21. Appendix
- Glossary of terms
- References and inspiration links
- Competitive analysis table
- Design system tokens (colors, typography, spacing)

CRITICAL RULES:
- Be EXTREMELY specific and actionable — every section should contain enough detail for an AI to start coding
- Use real, realistic data in examples (no "lorem ipsum" or "example.com")
- Include actual code snippets for data models, API types, and component interfaces using TypeScript
- Use Markdown tables extensively for structured data
- Use code blocks with proper language tags
- Every feature must have clear acceptance criteria
- Database schemas must include all fields with proper types
- API specs must include request/response body examples as JSON
- Total document should be 3000-6000 words
- Write in English for maximum AI coding compatibility
- Structure the document so each section is self-contained and can be referenced independently`;
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
        max_tokens: 8192,
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
      max_tokens: 8192,
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

  const techStackInfo = inputs.techPreference === 'manual' && inputs.techStack && inputs.techStack.length > 0
    ? inputs.techStack.join(', ')
    : 'Next.js, TypeScript, Node.js, PostgreSQL, Tailwind CSS';

  let aiCtx = '';
  if (inputs.aiAnswers && Object.keys(inputs.aiAnswers).length > 0) {
    const lines = Object.entries(inputs.aiAnswers)
      .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim().length > 0))
      .map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`);
    if (lines.length > 0) aiCtx = `\n### User-Provided Context\n${lines.join('\n')}\n`;
  }

  return `# ${inputs.productName} — Implementation-Ready PRD

## 1. Executive Summary

**${inputs.productName}** — ${inputs.productDescription || 'A modern product designed to solve key user challenges.'}

**Primary Goal:** ${inputs.primaryGoal || 'Deliver exceptional user value through innovative features.'}
**Target Platforms:** ${platforms}
**Target Users:** ${inputs.targetAudience || 'Professionals and teams'}
**Target Launch:** 12 weeks from kickoff

> This PRD is designed to be **directly usable by AI coding assistants** (Cursor, Claude, Copilot). Every section contains implementation-level detail.

---

## 2. Problem Statement

- Existing solutions are fragmented, expensive, or overly complex
- Users waste 2-3 hours/week on manual, repetitive workflows
- No single tool addresses the full scope of the problem
- Poor UX in current alternatives leads to low adoption
- Data lives in silos with no unified view

---

## 3. Goals & Success Metrics

| Metric | Target | Method | Timeframe |
|--------|--------|--------|-----------|
| MAU | 5,000 | Analytics | 6 months |
| D30 Retention | >40% | Cohort analysis | Ongoing |
| Task Completion | >85% | In-app tracking | Ongoing |
| NPS | >50 | Survey | Quarterly |
| P95 Page Load | <2s | Lighthouse | Ongoing |
| P95 API Latency | <500ms | APM | Ongoing |

---

## 4. User Personas

| Attribute | Primary User | Team Lead | Admin |
|-----------|-------------|-----------|-------|
| Age | 25-35 | 30-40 | 35-50 |
| Tech Savvy | High | Medium-High | High |
| Frequency | Daily | Daily | Weekly |
| Key Goal | Get work done fast | Track team progress | Manage users & security |

---

## 5. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a user, I want to sign up with email so I can create an account | P0 |
| US-02 | As a user, I want to log in securely | P0 |
| US-03 | As a user, I want to create/edit/delete items | P0 |
| US-04 | As a user, I want to search and filter my items | P0 |
| US-05 | As a user, I want to organize items into categories | P1 |
| US-06 | As a user, I want to export as PDF | P1 |
| US-07 | As a user, I want to share items with teammates | P1 |
| US-08 | As a lead, I want a dashboard showing team activity | P2 |
| US-09 | As a user, I want dark mode | P2 |
| US-10 | As an admin, I want to manage user roles | P2 |

---

## 6. Functional Requirements

### Core Features
${features}

### MVP vs Later
| Feature | MVP | Phase 2 | Phase 3 |
|---------|:---:|:---:|:---:|
| Auth | ✅ | | |
| CRUD | ✅ | | |
| Search | ✅ | | |
| Dashboard | ✅ | | |
| Export PDF | | ✅ | |
| Collaboration | | ✅ | |
| Analytics | | | ✅ |

---

## 7. Sitemap

\`\`\`
/                    # Landing
/login               # Login
/register            # Register
/dashboard           # Dashboard
/items               # Items list
/items/new           # Create item
/items/:id           # Item detail
/settings            # Settings
/settings/profile    # Profile
\`\`\`

---

## 9. Database Schema

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| avatar_url | VARCHAR(500) | NULLABLE |
| role | ENUM('user','admin') | DEFAULT 'user' |
| created_at | TIMESTAMP | DEFAULT NOW() |

### items
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT |
| title | VARCHAR(255) | NOT NULL |
| content | TEXT | NULLABLE |
| status | ENUM('draft','active','archived') | DEFAULT 'draft' |
| user_id | BIGINT | FK → users.id |
| metadata | JSON | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | ON UPDATE NOW() |

---

## 10. API Specification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login → JWT |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/items | Yes | List items |
| POST | /api/items | Yes | Create item |
| GET | /api/items/:id | Yes | Get item |
| PUT | /api/items/:id | Yes | Update item |
| DELETE | /api/items/:id | Yes | Delete item |

\`\`\`json
// POST /api/items — Request
{ "title": "New Item", "content": "Details...", "status": "draft" }

// Response 201
{ "id": 42, "title": "New Item", "status": "draft", "created_at": "2024-01-15T10:30:00Z" }
\`\`\`

---

## 11. Technology Stack

**Chosen:** ${techStackInfo}

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js (App Router) | SSR, file routing, RSC |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first, fast |
| Database | PostgreSQL | ACID, JSON, scalable |
| ORM | Prisma | Type-safe, migrations |
| Auth | JWT + bcrypt | Stateless, secure |
| Deploy | Vercel | Zero-config, edge CDN |

---

## 12. File Structure

\`\`\`
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (dashboard)/dashboard/page.tsx
│   ├── (dashboard)/items/page.tsx
│   ├── (dashboard)/items/[id]/page.tsx
│   ├── (dashboard)/settings/page.tsx
│   ├── api/auth/[...route]/route.ts
│   ├── api/items/route.ts
│   ├── api/items/[id]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/ui/       # Button, Input, Card, Modal
├── components/features/ # ItemCard, Dashboard, Sidebar
├── lib/                 # db.ts, auth.ts, utils.ts
├── hooks/               # useAuth, useItems
├── types/               # index.ts
└── styles/globals.css
\`\`\`

---

## 13. Component Interfaces

\`\`\`typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

interface ItemCardProps {
  item: { id: number; title: string; status: string; created_at: string };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}
\`\`\`

---

## 14. Auth Flow

1. Register → bcrypt hash (12 rounds) → store in DB → return JWT
2. Login → verify password → issue JWT (24h, httpOnly cookie)
3. Middleware checks JWT on protected routes
4. Refresh token if <6h remaining

---

## 15. Non-Functional Requirements

- LCP <2.5s, FID <100ms, CLS <0.1
- 10,000 concurrent users
- OWASP Top 10, HTTPS, CSRF, rate limiting
- WCAG 2.1 AA, keyboard nav, screen readers
- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

---

## 16. Error Handling

| Scenario | Behavior |
|----------|----------|
| Offline | Cached data + banner |
| 401 | Redirect to /login |
| 404 | Not Found page |
| 500 | Error toast + retry |
| Empty state | Illustration + CTA |

---

## 17. Testing

| Type | Target | Tools |
|------|--------|-------|
| Unit | >80% | Jest + RTL |
| E2E | Critical paths | Playwright |
| Performance | Core Web Vitals | Lighthouse CI |

---

## 18. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | DB connection string | Yes |
| JWT_SECRET | Signing secret (32+ chars) | Yes |
| NEXT_PUBLIC_APP_URL | Public URL | Yes |

---

## 19. Timeline

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| Foundation | 1-2 | Setup, auth, DB, basic UI |
| Core MVP | 3-6 | CRUD, dashboard, search |
| Polish | 7-8 | Error handling, perf, responsive |
| Beta | 9-10 | User testing, bug fixes |
| Launch | 11-12 | Production deploy, monitoring |

---

## 20. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict MVP, phased releases |
| Performance | Medium | Budgets, lazy loading, caching |
| Security | Critical | Audits, dependency scanning |
| Low adoption | High | Beta testing, feedback loops |

---

## 21. Appendix
${aiCtx}
### Design Tokens
\`\`\`css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #22c55e;
  --error: #ef4444;
  --bg: #ffffff;
  --text: #0f172a;
  --font: 'Inter', system-ui, sans-serif;
}
\`\`\`

---

*Generated by PRD.ai — Implementation-ready for AI coding assistants*
*${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*
`;
}
