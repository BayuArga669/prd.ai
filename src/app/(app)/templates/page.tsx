'use client';

import TopBar from '@/components/TopBar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  shadow: string;
  content: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'saas-launch',
    title: 'SaaS Product Launch',
    description: 'Complete PRD for launching a new SaaS product with pricing, onboarding, and growth features.',
    icon: 'rocket_launch',
    category: 'SaaS Features',
    color: 'primary',
    shadow: '#e040a0',
    content: `# [Product Name] — SaaS Launch PRD

## Executive Summary
[Product Name] is a SaaS solution designed to [describe value proposition]. This document outlines the requirements for the initial launch including core features, pricing model, and go-to-market strategy.

## Problem Statement
- Current solutions are [describe gaps]
- Target users struggle with [specific pain points]
- Market opportunity: [TAM/SAM estimates]

## Goals & Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| Monthly Active Users | 500 | 3 months |
| MRR | $10,000 | 6 months |
| Churn Rate | < 5% | Ongoing |
| NPS Score | > 50 | 6 months |

## Target Audience
### Primary Persona
- **Role:** [Job title]
- **Company Size:** [Range]
- **Pain Points:** [List]
- **Budget:** [Range]

## User Stories
1. As a new user, I want to sign up and see value within 5 minutes so that I commit to using the product.
2. As a team admin, I want to invite team members so that we can collaborate.
3. As a paying user, I want to manage my subscription so that I have control over billing.
4. As a power user, I want API access so that I can integrate with my existing tools.
5. As a trial user, I want to see a comparison of plans so that I can make an informed purchase decision.

## Functional Requirements
### Core Features (MVP)
- User authentication (email + social login)
- Dashboard with key metrics
- [Primary feature 1]
- [Primary feature 2]
- Settings & profile management

### Pricing & Billing
- Free tier with limited features
- Pro plan at $X/month
- Enterprise plan with custom pricing
- Stripe integration for payments

### Onboarding
- Welcome wizard (3 steps)
- Interactive product tour
- Sample data for first-time users

## Non-Functional Requirements
- Page load time < 2 seconds
- 99.9% uptime SLA
- SOC 2 Type II compliance
- GDPR compliant data handling
- Mobile responsive design

## Technical Approach
- Frontend: React/Next.js
- Backend: Node.js with REST API
- Database: PostgreSQL
- Hosting: AWS/Vercel
- Monitoring: Datadog/Sentry

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low initial adoption | High | Pre-launch waitlist, beta program |
| Competitor response | Medium | Focus on unique differentiator |
| Technical scalability | Medium | Cloud-native architecture |

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| MVP | 8 weeks | Core features, auth, billing |
| Beta | 4 weeks | User testing, feedback |
| Launch | 2 weeks | Marketing, PR, onboarding |
| Growth | Ongoing | Features based on feedback |
`,
  },
  {
    id: 'mobile-app',
    title: 'Mobile App Feature',
    description: 'Feature specification for iOS and Android apps including UX flows and acceptance criteria.',
    icon: 'smartphone',
    category: 'Mobile Apps',
    color: 'secondary',
    shadow: '#7c52aa',
    content: `# [Feature Name] — Mobile App PRD

## Executive Summary
This PRD outlines the requirements for [feature name] on our iOS and Android mobile applications. The feature aims to [describe primary value].

## Problem Statement
Mobile users currently face [describe friction]. Analytics show that [X%] of users drop off at [specific point], indicating a need for [this feature].

## Goals & Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| Feature Adoption | 60% of DAU | 30 days |
| Task Completion Rate | > 90% | Ongoing |
| App Store Rating | > 4.5 | 90 days |
| Session Duration | +20% | 60 days |

## Target Audience
- Primary: Mobile-first users aged 18-35
- Secondary: Tablet users requiring offline access
- Platforms: iOS 16+, Android 12+

## User Stories
1. As a mobile user, I want to [action] so that [benefit].
2. As an offline user, I want my changes synced when connectivity returns.
3. As an accessibility user, I want screen reader support for all new UI elements.
4. As a returning user, I want to pick up where I left off.
5. As a power user, I want gesture shortcuts for quick actions.

## UX Flow
1. User opens feature from [entry point]
2. System shows [initial screen]
3. User performs [primary action]
4. System provides [feedback/result]
5. User can [follow-up actions]

## Functional Requirements
### Core Functionality
- [Primary function description]
- [Secondary function description]
- Offline support with sync
- Push notification triggers

### Platform-Specific
**iOS:**
- Haptic feedback on key actions
- Widget support
- Siri shortcuts integration

**Android:**
- Material You theming
- Home screen widget
- Back gesture handling

## Non-Functional Requirements
- Cold start: < 1 second
- Animation: 60fps minimum
- Battery: < 2% per hour active use
- Storage: < 50MB additional
- Accessibility: WCAG 2.1 AA

## Technical Approach
- Framework: React Native / Flutter
- State Management: [Choice]
- API: REST with offline-first cache
- Local Storage: SQLite / Realm

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| OS fragmentation | High | Min version policy |
| Performance on low-end devices | Medium | Performance budget |
| App Store rejection | High | Pre-submission review |

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Design | 2 weeks | Figma mockups, prototypes |
| Development | 4 weeks | Feature implementation |
| QA | 2 weeks | Testing across devices |
| Release | 1 week | Staged rollout |
`,
  },
  {
    id: 'api-integration',
    title: 'API Integration',
    description: 'Third-party API integration specification with endpoints, auth, and error handling.',
    icon: 'api',
    category: 'Internal Tools',
    color: 'tertiary',
    shadow: '#0096cc',
    content: `# [API Name] Integration — PRD

## Executive Summary
This document specifies the integration requirements for [API Name], enabling [describe capability] within our platform.

## Problem Statement
Our system currently lacks [capability]. By integrating [API Name], we can [describe benefit] and reduce manual work by [X%].

## Goals & Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| API Uptime | 99.9% | Ongoing |
| Response Time | < 200ms p95 | Ongoing |
| Error Rate | < 0.1% | Ongoing |
| Data Freshness | < 5 min | Ongoing |

## API Overview
- **Provider:** [Company name]
- **Documentation:** [URL]
- **Authentication:** OAuth2 / API Key
- **Rate Limits:** [X] requests per minute
- **Pricing:** [Tier details]

## Endpoints to Integrate
### 1. [Endpoint Name]
- **Method:** GET/POST
- **URL:** /api/v1/[resource]
- **Purpose:** [Description]
- **Request:** [Parameters]
- **Response:** [Schema]

### 2. [Endpoint Name]
- **Method:** GET/POST
- **URL:** /api/v1/[resource]
- **Purpose:** [Description]

## Data Mapping
| Our Field | API Field | Transform |
|-----------|-----------|-----------|
| user_id | external_id | Direct |
| status | state | Enum mapping |
| amount | value | Cents to dollars |

## Error Handling
| Error Code | Meaning | Action |
|-----------|---------|--------|
| 401 | Auth expired | Refresh token |
| 429 | Rate limited | Exponential backoff |
| 500 | Server error | Retry 3x, then alert |

## Security Requirements
- API keys stored in environment variables
- All traffic over HTTPS
- PII data encrypted at rest
- Audit logging for all API calls
- Token rotation every 90 days

## Technical Approach
- Wrapper service layer for API abstraction
- Circuit breaker pattern for resilience
- Response caching with TTL
- Webhook receiver for real-time updates
- Queue for async processing

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Spike | 1 week | Proof of concept |
| Implementation | 3 weeks | Full integration |
| Testing | 1 week | Integration tests |
| Monitoring | Ongoing | Dashboards, alerts |
`,
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce Feature',
    description: 'Product catalog, checkout flow, and payment processing requirements.',
    icon: 'shopping_cart',
    category: 'E-commerce',
    color: 'primary',
    shadow: '#e040a0',
    content: `# [Feature Name] — E-Commerce PRD

## Executive Summary
This PRD defines the requirements for [feature] in our e-commerce platform, aimed at improving conversion rates and customer satisfaction.

## Problem Statement
Current checkout flow has a [X%] cart abandonment rate. Key friction points include [list problems]. This feature addresses these by [solution approach].

## Goals & Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| Conversion Rate | +15% | 90 days |
| Cart Abandonment | -20% | 60 days |
| AOV | +10% | 90 days |
| Customer Satisfaction | > 4.5/5 | Ongoing |

## User Stories
1. As a shopper, I want to save items for later so I can purchase when ready.
2. As a returning customer, I want one-click checkout using saved payment methods.
3. As a deal seeker, I want to apply multiple discount codes.
4. As a gift buyer, I want to add gift wrapping and messages.
5. As a mobile shopper, I want a streamlined mobile checkout experience.

## Functional Requirements
### Product Catalog
- Advanced search with filters
- Product recommendations engine
- Real-time inventory display
- Product comparison tool

### Checkout Flow
- Guest checkout option
- Address autocomplete
- Multiple payment methods (Card, PayPal, Apple Pay)
- Order summary with live updates
- Tax calculation by region

### Post-Purchase
- Order confirmation email
- Order tracking with notifications
- Easy returns process
- Review/rating prompt

## Non-Functional Requirements
- Page load: < 1.5 seconds
- Checkout: PCI DSS compliant
- 99.99% uptime during peak hours
- Support 10,000 concurrent users
- Mobile-first responsive design

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Design | 2 weeks | UX flows, wireframes |
| Backend | 4 weeks | APIs, payment integration |
| Frontend | 3 weeks | UI implementation |
| QA | 2 weeks | Load testing, security audit |
| Launch | 1 week | Phased rollout |
`,
  },
  {
    id: 'internal-tool',
    title: 'Internal Tool',
    description: 'Admin dashboard or internal tool specification with RBAC and workflows.',
    icon: 'admin_panel_settings',
    category: 'Internal Tools',
    color: 'secondary',
    shadow: '#7c52aa',
    content: `# [Tool Name] — Internal Tool PRD

## Executive Summary
[Tool Name] is an internal tool designed to streamline [process] for the [team name] team, reducing manual effort by an estimated [X] hours per week.

## Problem Statement
The team currently relies on [spreadsheets/manual processes/legacy system] to manage [workflow]. This leads to [errors, delays, lack of visibility].

## Goals & Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| Time Saved | 10 hrs/week | 30 days |
| Error Rate | -80% | 60 days |
| User Adoption | 100% of team | 14 days |
| Process Completion | 2x faster | 30 days |

## User Roles & Permissions
| Role | Permissions |
|------|------------|
| Admin | Full access, user management |
| Manager | Read/write, approve workflows |
| Operator | Read/write own records |
| Viewer | Read-only access |

## User Stories
1. As an admin, I want to manage user roles so that access is properly controlled.
2. As a manager, I want to approve requests in bulk so that I save time.
3. As an operator, I want a dashboard showing my tasks so that I know what to work on.
4. As a viewer, I want to export reports so that I can share with stakeholders.

## Functional Requirements
### Dashboard
- Key metrics overview
- Recent activity feed
- Quick actions toolbar
- Customizable widgets

### Workflow Engine
- Configurable approval chains
- Email/Slack notifications
- Status tracking
- Audit trail

### Reporting
- Pre-built report templates
- Custom report builder
- Scheduled report delivery
- CSV/PDF export

## Technical Approach
- Framework: Next.js with server components
- Database: PostgreSQL
- Auth: SSO integration (SAML/OIDC)
- Deployment: Internal cloud infrastructure

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Requirements | 1 week | Stakeholder interviews |
| Design | 2 weeks | Wireframes, approval |
| Development | 6 weeks | Core features |
| UAT | 2 weeks | User acceptance testing |
| Rollout | 1 week | Training, deployment |
`,
  },
  {
    id: 'data-pipeline',
    title: 'Data Pipeline',
    description: 'ETL pipeline and data processing workflow specification.',
    icon: 'account_tree',
    category: 'SaaS Features',
    color: 'tertiary',
    shadow: '#0096cc',
    content: `# [Pipeline Name] — Data Pipeline PRD

## Executive Summary
This PRD defines the requirements for a data pipeline that [describe purpose]. The pipeline will process [volume] of data from [sources] to [destinations] with [frequency].

## Problem Statement
Currently, data from [sources] is processed [manually/with legacy system], resulting in [delays, errors, inconsistencies]. A modern pipeline will enable [real-time analytics, ML features, compliance].

## Goals & Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| Processing Latency | < 5 min | Ongoing |
| Data Accuracy | 99.99% | Ongoing |
| Uptime | 99.9% | Ongoing |
| Cost per GB | < $0.10 | Ongoing |

## Data Sources
| Source | Type | Volume | Frequency |
|--------|------|--------|-----------|
| [Database] | MySQL | 10GB/day | Real-time |
| [API] | REST | 1M events/day | Streaming |
| [Files] | S3/CSV | 5GB/day | Hourly |

## Pipeline Architecture
1. **Ingestion:** [Kafka/Kinesis] for real-time, [Airflow] for batch
2. **Transform:** [Spark/dbt] for data transformation
3. **Load:** [Data warehouse/Data lake]
4. **Serve:** [API/Dashboard/ML Models]

## Data Quality Requirements
- Schema validation at ingestion
- Deduplication logic
- Null/missing value handling
- Data type enforcement
- Anomaly detection alerts

## Monitoring & Alerting
- Pipeline health dashboard
- Failed job alerts (Slack/PagerDuty)
- Data quality score tracking
- SLA compliance reporting
- Cost monitoring per pipeline

## Technical Approach
- Orchestration: Apache Airflow / Prefect
- Processing: Apache Spark / dbt
- Storage: S3 + Snowflake/BigQuery
- Monitoring: Datadog + custom dashboards
- Infrastructure: Terraform IaC

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Design | 2 weeks | Architecture review |
| POC | 2 weeks | Single source pipeline |
| Development | 6 weeks | Full pipeline |
| Testing | 2 weeks | Data validation |
| Production | 1 week | Deployment, monitoring |
`,
  },
];

const CATEGORIES = ['All', 'SaaS Features', 'Mobile Apps', 'E-commerce', 'Internal Tools'];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [creating, setCreating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  async function handleUseTemplate(template: Template) {
    setCreating(template.id);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.title + ' PRD',
          content: template.content,
          templateType: template.category,
          status: 'Draft',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create document');
      }

      const data = await res.json();
      setToast(`"${template.title}" created! Opening editor...`);
      setTimeout(() => {
        router.push(`/editor/${data.document.id}`);
      }, 800);
    } catch (err) {
      console.error('Failed to create from template:', err);
      setToast('Failed to create document. Please try again.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopBar />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-toast-slide-in">
          <div className="bg-on-surface text-surface px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {toast}
          </div>
        </div>
      )}

      <div className="px-6 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
        {/* Header */}
        <section className="mt-6 md:mt-2 mb-8">
          <h2 className="text-4xl md:text-5xl font-headline font-black text-on-background mb-2 tracking-tight">
            <span className="text-shimmer">Templates</span> 📋
          </h2>
          <p className="text-lg text-on-surface-variant font-bold">
            Start with a proven template and customize it to your needs.
          </p>
        </section>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm border-2 transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary border-primary shadow-[3px_3px_0_#2e1a28] -translate-y-0.5'
                  : 'bg-white text-on-surface-variant border-on-surface/20 hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="glass-neo-card p-6 rounded-2xl flex flex-col justify-between bg-white group relative"
              style={{ ['--hover-shadow' as string]: template.shadow }}
            >
              <div>
                <div className="flex justify-between items-start mb-5">
                  <div
                    className={`w-12 h-12 bg-${template.color}/10 text-${template.color} border-2 border-${template.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}
                    style={{ boxShadow: `2px 2px 0 ${template.shadow}` }}
                  >
                    <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {template.icon}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full">
                    {template.category}
                  </span>
                </div>
                <h4 className="text-xl font-black text-on-background mb-2">{template.title}</h4>
                <p className="text-sm text-on-surface-variant font-bold mb-6 leading-relaxed">
                  {template.description}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUseTemplate(template)}
                  disabled={creating === template.id}
                  className="flex-1 bg-primary text-on-primary font-black rounded-xl py-3 px-4 shadow-[3px_3px_0_#2e1a28] hover:shadow-[5px_5px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#2e1a28] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating === template.id ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                      Use Template
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at bottom */}
        <div className="mt-12 text-center">
          <div className="glass-neo-card p-8 rounded-2xl bg-gradient-to-r from-primary-container/50 to-secondary-container/50 inline-block">
            <h4 className="text-xl font-headline font-black text-on-background mb-2">Need something custom?</h4>
            <p className="text-on-surface-variant font-bold mb-4">Use our AI wizard to generate a PRD from scratch.</p>
            <button
              onClick={() => router.push('/wizard')}
              className="pop-btn text-white font-black rounded-xl py-3 px-6 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Generate with AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
