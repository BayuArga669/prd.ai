---
goal: Redesign landing page with premium neo-brutalist UI and execute with RTK (Rust Token Killer) CLI proxy
version: 1.1
date_created: 2026-05-26
status: 'Planned'
tags: [design, landing-page, rtk-cli]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan details the redesign of the PRD.ai landing page (main page) to make it visually premium, highly interactive, and responsive. It uses standard React hooks (`useState`) to manage client-side interactive states (AI generator playground, pricing switcher, and FAQ accordion) and enhances the overall neo-brutalist design with high-quality components, smooth gradients, and micro-animations. All terminal executions will be run using the `rtk` CLI proxy to reduce token consumption.

## 1. Requirements & Constraints

- **REQ-001**: Implement interactive AI generator simulator on landing page using React state.
- **REQ-002**: Implement annual/monthly pricing switcher using React state.
- **REQ-003**: Implement interactive FAQ accordion using React state.
- **REQ-004**: Enhance visual design using a cohesive premium Neo-Brutalist design language with glassmorphic cards and glowing borders.
- **REQ-005**: Fully responsive layout from mobile (320px) to large desktop (1440px+).
- **CON-001**: Must compile and build successfully under Next.js 16/React 19 without errors.
- **CON-002**: Must use Tailwind CSS v4 styling matching existing theme properties.
- **CON-003**: Avoid unescaped quotation characters to pass ESLint rules.
- **CON-004**: Prepend `rtk` prefix to all development CLI commands (e.g. `rtk lint`, `rtk npm run build`) for optimized output.

## 2. Implementation Steps

### Phase 1: Preparation & CSS Utilities

- GOAL-001: Configure global styles and clean up files.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Remove unused RTK package/imports and revert layout.tsx. | ✅ | 2026-05-26 |
| TASK-002 | Add `@keyframes` and custom utility styles for text shimmer and gradient glow in `src/app/globals.css`. | ✅ | 2026-05-26 |

### Phase 2: UI Redesign & Interactivity Implementation

- GOAL-002: Redesign the main page with a premium Neo-Brutalist aesthetic and wire it using React state.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-003 | Redesign Navbar and Footer with premium animated hover states. | | |
| TASK-004 | Implement interactive Simulator section (typewriter effects, simulated steps) using React hooks. | | |
| TASK-005 | Implement Bento Grid feature overview with premium responsive cards. | | |
| TASK-006 | Implement Pricing card grid with Toggle button. | | |
| TASK-007 | Implement FAQ Accordion with smooth transitions. | | |
| TASK-008 | Fix any unused imports or unescaped quotes to ensure zero lint errors in `src/app/page.tsx`. | | |

### Phase 3: Verification & Polish

- GOAL-003: Verify that the builds are working and the layout is fully responsive and interactive, executing commands via `rtk`.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Verify lint checks using `rtk lint`. | | |
| TASK-010 | Verify production build compiles using `rtk npm run build` (or `rtk next build`). | | |
| TASK-011 | Perform manual validation of responsiveness and interactions on localhost. | | |

## 3. Alternatives

- **ALT-001**: Use Redux Toolkit (RTK) for web state management. *Why not chosen:* Web UI states on the landing page are local and simple; using client-side Redux Toolkit adds unnecessary boilerplate and bundle size for a static landing page.

## 4. Dependencies

- None (runs on standard Next.js / Tailwind CSS v4 dependencies).

## 5. Files

- **FILE-001**: `src/app/page.tsx` [MODIFY]
- **FILE-002**: `src/app/globals.css` [MODIFY]

## 6. Testing

- **TEST-001**: Verify that selecting a prompt in the simulator triggers appropriate animations and updates the output.
- **TEST-002**: Verify that toggle billing switches plan details (prices, labels).
- **TEST-003**: Verify that clicking a FAQ accordion panel opens it and closes other panels.
- **TEST-004**: ESLint check without warnings or errors.

## 7. Risks & Assumptions

- **ASSUMPTION-001**: Browser font availability for Material Icons. If fonts fail to load, standard text representation should fail gracefully.

## 8. Related Specifications / Further Reading

- [RTK (Rust Token Killer) Github repository](https://github.com/rtk-ai/rtk)
