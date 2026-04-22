# SEAS (Smart Examination & Assessment System)

SEAS is a resilient, offline-capable platform designed for modern academic and professional evaluations. It supports diverse question types and features a hybrid grading engine.

## 🚀 Key Features

- **Offline-First Resilience**: All candidate responses are auto-saved to IndexedDB in real-time, allowing for uninterrupted assessments even during network outages.
- **Integrity Engine**: Built-in protection against copy-paste/cut operations and tab-switching detection to ensure exam security.
- **Assessment Management**: Comprehensive examiner tools for creating, editing, and publishing assessments. Includes metadata editing, question management, and duplication logic for versioning published assessments.
- **Marking & Grading Dashboard**: Dedicated interface for examiners to manage marking keys (correct answers and rubrics) and manually grade candidate submissions with a toggleable reference key.
- **Hybrid Grading**: Automatic marking for MCQ and short-answer questions via Postgres triggers, with manual grading support for essays and image uploads.
- **Material Design 3**: A polished, Teal-themed interface with smooth transitions and Material components.
- **Product Landing Page**: A comprehensive root route (`/`) showcasing product features, candidate entrance, and developer contact details.
- **PWA Installation**: Seamless "Install App" prompt integrated into the UI for a native-like experience on all devices.

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

### 2. First Admin Registration
Once the environment is configured, visit `/admin/dashboard`. If the system detects no administrator profiles, it will present a **System Initialization** form. Use this to create the primary admin account and initialize the management console.

### 3. Development
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

## 📊 Assessment Question JSON Schema

Examiners can bulk-upload questions using a JSON file. The expected format is an array of question objects, optionally including marking keys for auto-grading.

```json
[
  {
    "content": "What is the capital of France?",
    "question_type": "mcq",
    "marks_possible": 1,
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "marking_key": {
      "is_auto_mark": true,
      "correct_option_index": 0,
      "grading_notes": "Paris is the capital."
    }
  },
  {
    "content": "What is 2 + 2?",
    "question_type": "short_answer",
    "marks_possible": 1,
    "marking_key": {
      "is_auto_mark": true,
      "correct_text_match": "4",
      "grading_notes": "Numeric '4' only."
    }
  },
  {
    "content": "Upload a sketch of the human heart.",
    "question_type": "image_upload",
    "marks_possible": 10
  }
]
```

### Field Definitions:
- `content` (string, **required**): The question text.
- `question_type` (string, **required**): Must be one of `mcq`, `short_answer`, or `image_upload`.
- `marks_possible` (number, **required**): The maximum score for this question.
- `options` (array of strings, **optional**): Required ONLY for `mcq` type. Each string represents a choice.
- `marking_key` (object, **optional**): Configuration for grading.
  - `is_auto_mark` (boolean): Enable automatic grading for this question.
  - `correct_option_index` (number): The index (0-based) of the correct answer in the `options` array (MCQ only).
  - `correct_text_match` (string): The exact string to match for auto-grading (Short Answer only).
  - `grading_notes` (string): Internal rubric or notes for manual grading.
