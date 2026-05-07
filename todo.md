# Project Tasks

## Refactoring Components
- [x] Create `components/Card.tsx` from `components/ui/index.tsx`
- [x] Create `components/StatsCard.tsx` from `components/ui/index.tsx`
- [x] Create `components/Input.tsx` from `components/ui/index.tsx`
- [x] Create `components/FormGroup.tsx` from `components/ui/index.tsx`
- [x] Create `components/Button.tsx` from `components/ui/index.tsx`
- [x] Create `components/FAB.tsx` from `components/ui/index.tsx`
- [x] Create `components/LoadingOverlay.tsx` from `components/ui/index.tsx`
- [x] Update imports in all files using `components/ui`
- [x] Remove `components/ui` directory

## Agent Instruction Updates
- [x] Update `AGENTS.md` to prioritize reusable components
- [x] Add mandate to split page logic into components
- [x] Create `todo.md` for task tracking.

## Features & Enhancements
- [x] **Proctoring Exclusion**: Automatically disable copy/paste/cut blocking and tab-switch tracking on management routes (`/admin`, `/examiner`).
- [x] **JSON Import Refactoring**: Replaced JSON file upload with a text area form and AI prompt helper on the assessment edit page.
- [x] **Supabase SSR Integration**: Added server-side Supabase client, `proxy.ts` (Next.js 16) for session refreshing, and migrated auth to Server Actions.
