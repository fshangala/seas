# SEAS (Smart Examination & Assessment System)

SEAS is a resilient, offline-capable platform designed for modern academic and professional evaluations. It supports diverse question types and features a hybrid grading engine.

## 🚀 Key Features

- **Offline-First Resilience**: All candidate responses are auto-saved to IndexedDB in real-time, allowing for uninterrupted assessments even during network outages.
- **Integrity Engine**: Built-in protection against copy-paste/cut operations and tab-switching detection to ensure exam security.
- **Hybrid Grading**: Automatic marking for MCQ and short-answer questions via Postgres triggers, with manual grading support for essays and image uploads.
- **Material Design 3**: A polished, Teal-themed interface with smooth transitions and Material components.
- **PWA Support**: Installable on desktop and mobile with service worker support for offline access.

## 🛠 Technical Stack

- **Framework**: Next.js (App Router)
- **Architecture**: MVVM (Model-View-ViewModel)
- **Database**: Supabase (Postgres + Auth + Storage)
- **Persistence**: Raw IndexedDB for local caching and offline sync.
- **State Management**: React Context + useReducer
- **Design**: Tailwind CSS 4 + Lucide Icons

## 📖 Database Schema

The system uses a relational PostgreSQL schema in Supabase:
- `profiles`: User roles (Admin/Examiner) and names.
- `assessments`: Main assessment definitions.
- `questions`: Question content and metadata.
- `options`: Multiple-choice options.
- `marking_keys`: Correct answers and auto-marking settings.
- `submissions`: Candidate attempt records.
- `responses`: Individual question responses.
- `audit_logs`: Tracking of administrative actions.

## 🚦 Getting Started

### 1. Environment Setup
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Development
```bash
npm install
npm run dev
```

### 3. Build & PWA
```bash
npm run build
npm run start
```

## 🔐 Integrity & Security
The system uses the `AssessmentContext` to attach native event listeners for `copy`, `paste`, `cut`, and `visibilitychange`. All violations are logged locally in IndexedDB and synced to the `audit_logs` table.
