---
goal: Redesign the Dashboard UI to match the premium Neo-Brutalist design language of the landing page
version: 1.0
date_created: 2026-05-26
status: 'Planned'
tags: [design, dashboard, ui]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan details the visual redesign and polish of the internal dashboard pages and components of PRD.ai. It upgrades the Sidebar, TopBar, and main Dashboard page with cohesive premium Neo-Brutalist elements, including cards that pop, glowing borders, custom layout animations, and the newly generated brand logo, matching the visual excellence of the newly redesigned landing page.

## 1. Requirements & Constraints

- **REQ-001**: Integrate the new brand logo image (`/logo.png`) in the Dashboard Sidebar.
- **REQ-002**: Redesign Dashboard main page cards (welcome banner, stats, document grid) to match the premium neo-brutalist / glassmorphic theme.
- **REQ-003**: Enhance document grid cards with interactive hover effects and visual status indicators (e.g. progress bars, badges).
- **REQ-004**: Keep the dashboard fully responsive across all breakpoints (mobile to desktop).
- **CON-001**: Must compile and build successfully under Next.js 16/React 19 without errors.
- **CON-002**: Must use Tailwind CSS v4 styling matching existing theme properties.
- **CON-003**: Avoid unescaped quotation characters to pass ESLint rules.

## 2. Implementation Steps

### Phase 1: Shared Components Upgrades

- GOAL-001: Redesign the Sidebar and TopBar with modern assets and clean hover states.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Modify `src/components/Sidebar.tsx` to render the brand logo using `next/image` and enhance link hover effects. | | |
| TASK-002 | Modify `src/components/TopBar.tsx` to polish notifications, search icons, and profile image borders. | | |
| TASK-003 | Update `src/components/MobileNav.tsx` active icons and border indicators. | | |

### Phase 2: Main Dashboard Page Redesign

- GOAL-002: Overhaul the dashboard main page content, template list, and document grid.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | Update `src/app/(app)/dashboard/page.tsx`'s Welcome block with a clean animated background. | | |
| TASK-005 | Upgrade the main "Generate PRD" banner with neon gradient backgrounds and neo-brutalist pop buttons. | | |
| TASK-006 | Redesign the "Recent Documents" grid cards to use `.glass-neo-card` styling with hover elevation. | | |
| TASK-007 | Add visual metadata (progress bars, badge borders) for each document type card. | | |
| TASK-008 | Ensure all quote characters in TSX are fully escaped to pass ESLint checks. | | |

### Phase 3: Verification & Execution

- GOAL-003: Verify that the dashboard builds successfully using the `rtk` proxy.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Verify lint checks using `rtk lint`. | | |
| TASK-010 | Verify production build using `rtk npm run build`. | | |

## 3. Alternatives

- None. Redesigning to match the landing page theme is the only path to visual consistency.

## 4. Dependencies

- None.

## 5. Files

- **FILE-001**: `src/components/Sidebar.tsx` [MODIFY]
- **FILE-002**: `src/components/TopBar.tsx` [MODIFY]
- **FILE-003**: `src/components/MobileNav.tsx` [MODIFY]
- **FILE-004**: `src/app/(app)/dashboard/page.tsx` [MODIFY]

## 6. Testing

- **TEST-001**: Verify that the Sidebar and TopBar logo/profile assets render correctly.
- **TEST-002**: Verify hover transitions on sidebar menu links and document grid cards.
- **TEST-003**: ESLint check without warnings or errors.

## 7. Risks & Assumptions

- **ASSUMPTION-001**: Layout structure is preserved. Redesigning elements should not alter flex and grid containers in a way that breaks existing route layouts.

## 8. Related Specifications / Further Reading

- None.
