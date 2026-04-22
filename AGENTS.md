<!-- BEGIN:nextjs-agent-rules -->
# Next.js Coding Rules
This version of Next.js may have breaking changes or conventions that differ from your training data. 
Before writing code, read the relevant guide in `node_modules/next/dist/docs/`.
Heed all deprecation notices and favor modern patterns (App Router, Server Components).
<!-- END:nextjs-agent-rules -->

# SEAS Agent Instructions

This document provides foundational mandates for AI agents working on the SEAS project.

## 🏗 Architecture Mandates (MVVM)
- **Model**: Use `lib/services/` for Supabase API calls and `lib/idb.ts` for IndexedDB operations.
- **ViewModel**: Use `lib/viewmodels/AssessmentContext.tsx` to manage UI state and handle proctoring logic.
- **View**: Components in `components/` should remain thin and rely on context for state. Prioritize reusable components for UI patterns (e.g., stats cards, form inputs, layouts) to maintain consistency and reduce duplication.
- **Candidates**: All candidate associations MUST use UUID-based `candidate_id` from the `candidates` table. Legacy `student_id` is for identification only.

## 🛠 Tech Stack Conventions
- **Tailwind 4**: Use the new `@theme` and `@layer` syntax in `app/globals.css`.
- **IndexedDB**: Use the raw `IDBService` in `lib/idb.ts`. Avoid adding third-party storage libraries unless explicitly requested.
- **Supabase**: Always use the typed client from `lib/supabase.ts` and ensure database types in `lib/types/database.types.ts` are kept up to date.

## 🔐 Security & Integrity Rules
- **Proctoring**: NEVER remove or disable the `visibilitychange`, `copy`, `paste`, or `cut` listeners in `AssessmentContext` without explicit user instruction.
- **Data Sync**: Ensure all local responses are marked with `synced: false` until successfully persisted to Supabase.
- **Sensitive Data**: Do not log `student_id` or `assessment_code` to external services. Use the built-in `audit_logs` for tracking.
- **Immutability**: Published assessments MUST remain read-only. Any modifications (metadata or questions) must be performed on a duplicate draft.

## 🎨 Design System (Teal Theme)
- **Primary**: Teal gradients (`from-teal-600 to-teal-700`).
- **Secondary**: Slate gradients (`from-slate-800 to-slate-900`).
- **Accent**: Cyan/Teal (`from-cyan-400 to-teal-500`).
- **Corners**: Always use `rounded-2xl` for cards and buttons to match Material Design 3 specs.
- **Interactivity**: All links (`<a>`, `<Link>`) and buttons (`<button>`, `Button` component) MUST include the `cursor-pointer` class.

## 🔄 Deployment & PWA
- **manifest.json**: Ensure `public/manifest.json` is updated if new assets or theme colors are added.
- **Service Workers**: Keep `next-pwa` configuration in `next.config.ts` intact for offline reliability.

## ✅ Development Progress & TODO

### Core Infrastructure
- [x] Next.js 14 App Router setup with Tailwind 4.
- [x] Supabase Client & Database Types integration.
- [x] Raw IndexedDB Service (`lib/idb.ts`) for offline persistence.
- [x] MVVM State Management with `AssessmentContext`.
- [x] Material Design 3 "Teal Theme" implementation.
- [x] Proctoring Integrity Engine (Copy/Paste block & Tab-switch tracking).
- [x] **Management Dashboard**: Staff login, registration, and RBAC implementation.
- [x] **First Admin Setup**: Automatic detection of missing admin profiles on `/admin/dashboard` to facilitate initial system initialization.
- [x] **Assessment Management**: Draft creation, metadata editing, question management, duplication logic, and read-only publication.
- [x] **JSON Bulk Operations**: Upload questions via JSON and clear all questions functionality.
- [x] **Marking Key Management**: Define correct answers, auto-marking rules, and grading notes for published assessments.
- [x] **Manual Grading Interface**: UI for examiners to review and grade essays and image uploads with toggleable marking keys.
- [x] **Candidate Profiles**: Persistent registration for candidates via the `candidates` table.
- [x] **UUID-based Routing**: Migrated all candidate-facing routes from Student ID to UUID.
- [x] **Assessment Association**: Persistent tracking of candidate visits via `candidate_assessments` table.
- [x] **Start Assessment Workflow**: Preview screen with details and explicit session start.
- [x] **Results Detail Page**: Performance summary and grading status for completed assessments.
- [x] **Mobile Responsiveness**: Adaptive UI for candidates taking assessments on mobile devices.
- [x] **Product Landing Page**: Professional root route with hero, features, and developer contact.
- [x] **PWA Installation**: Integrated "Install App" button with `beforeinstallprompt` handling.
- [x] **Asset Branding**: Global implementation of `logo.png` for all app icons and favicons.

### Pending Features (Next Steps)
- [x] **Image Upload Logic**: Handle handwritten work as Blobs in IDB and sync to Supabase Storage.
- [x] **Audit Log Syncing**: Push local proctoring logs to Supabase `audit_logs` table.
- [x] **Auto-Marking Engine**: Apply the Postgres trigger for MCQ and Short Answer validation.
- [ ] **Offline Reliability**: Verify PWA service worker caching for full offline landing-to-submission flow.
