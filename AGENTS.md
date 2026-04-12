# SEAS Agent Instructions

This document provides foundational mandates for AI agents working on the SEAS project.

## 🏗 Architecture Mandates (MVVM)
- **Model**: Use `lib/services/` for Supabase API calls and `lib/idb.ts` for IndexedDB operations.
- **ViewModel**: Use `lib/viewmodels/AssessmentContext.tsx` to manage UI state and handle proctoring logic.
- **View**: Components in `components/` should remain thin and rely on context for state.

## 🛠 Tech Stack Conventions
- **Tailwind 4**: Use the new `@theme` and `@layer` syntax in `app/globals.css`.
- **IndexedDB**: Use the raw `IDBService` in `lib/idb.ts`. Avoid adding third-party storage libraries unless explicitly requested.
- **Supabase**: Always use the typed client from `lib/supabase.ts` and ensure database types in `lib/types/database.types.ts` are kept up to date.

## 🔐 Security & Integrity Rules
- **Proctoring**: NEVER remove or disable the `visibilitychange`, `copy`, `paste`, or `cut` listeners in `AssessmentContext` without explicit user instruction.
- **Data Sync**: Ensure all local responses are marked with `synced: false` until successfully persisted to Supabase.
- **Sensitive Data**: Do not log `student_id` or `assessment_code` to external services. Use the built-in `audit_logs` for tracking.

## 🎨 Design System (Teal Theme)
- **Primary**: Teal gradients (`from-teal-600 to-teal-700`).
- **Secondary**: Slate gradients (`from-slate-800 to-slate-900`).
- **Accent**: Cyan/Teal (`from-cyan-400 to-teal-500`).
- **Corners**: Always use `rounded-2xl` for cards and buttons to match Material Design 3 specs.

## 🔄 Deployment & PWA
- **manifest.json**: Ensure `public/manifest.json` is updated if new assets or theme colors are added.
- **Service Workers**: Keep `next-pwa` configuration in `next.config.ts` intact for offline reliability.
