Project Blueprint: SEAS (Smart Examination & Assessment System)1. Project Overview & LogicSEAS is a resilient, offline-capable platform designed for modern academic and professional evaluations. The system supports diverse question types (MCQ to Essay/Image) and features a hybrid grading engine (Auto + Manual).How it Works:Entrance: Candidates provide a Student ID and Assessment ID. Validation is handled via Supabase; the assessment structure is then hydrated into IndexedDB.Assessment Session (Offline-First): * Candidates work offline. All responses are auto-saved to IndexedDB.Integrity: Copy-paste and cut operations are blocked via event listeners.Media: Questions can include diagrams. Candidates can upload images for "handwritten" work questions.Marking Key: Examiners/Admins define the key. Image-based answers are always manual marking.Audit & Management: Two user types—Admin (System Managers) and Examiner. Staff can register via the `/register` portal which assigns the `examiner` role by default. Every management action is recorded in an Audit Log.2. Technical StackFramework: Next.js (App Router)Architecture: MVVM (Model-View-ViewModel)Database: Supabase (Postgres + Auth + Storage + Triggers)PWA: next-pwa (Service Workers)Persistence: Raw IndexedDB (No external libraries)State Management: React Context + useReducerDesign: Material Design 3 (Teal Gradients)Icons: Lucide React3. Design System (Teal Theme)Primary Gradient: from-teal-600 to-teal-700Secondary Gradient: from-slate-800 to-slate-900Accent Gradient: from-cyan-400 to-teal-500UI Specs: rounded-2xl corners, shadow-lg elevation, Material FABs.4. Database Schema (Supabase SQL)-- 1. Roles & Profiles (Admin vs Examiner)
create type user_role as enum ('admin', 'examiner');
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role default 'examiner',
  full_name text
);

-- 2. Assessments Table
create table assessments (
  id uuid primary key default uuid_generate_v4(),
  assessment_code text unique not null,
  title text not null,
  description text,
  duration_minutes int not null,
  late_policy text check (late_policy in ('reject', 'penalize', 'none')) default 'none',
  penalty_value float default 0,
  is_published boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- 3. Questions Table
create table questions (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid references assessments(id) on delete cascade,
  content text not null,
  image_url text, -- For diagrams/formulas
  question_type text check (question_type in ('mcq', 'short_answer', 'paragraph', 'essay', 'image_upload')),
  marks_possible float not null default 1.0,
  order_index int
);

-- 4. Options (For MCQ)
create table options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade,
  content text not null
);

-- 5. Marking Key
create table marking_keys (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade unique,
  correct_option_id uuid references options(id),
  correct_text_match text,
  is_auto_mark boolean default false,
  grading_notes text
);

-- 6. Submissions
create table submissions (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid references assessments(id),
  student_id text not null,
  client_start_time timestamp with time zone,
  client_end_time timestamp with time zone,
  server_received_at timestamp with time zone default now(),
  auto_score float default 0,
  manual_score float default 0,
  total_score float default 0,
  penalty_applied float default 0,
  grading_status text check (grading_status in ('pending', 'partially_graded', 'completed')) default 'pending',
  unique(assessment_id, student_id)
);

-- 7. Responses (Relational normalization)
create table responses (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references submissions(id) on delete cascade,
  question_id uuid references questions(id),
  selected_option_id uuid references options(id),
  text_value text, 
  image_response_url text, -- For handwritten work
  marks_awarded float default 0,
  is_graded boolean default false
);

-- 8. Audit Logs
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  action text not null, 
  entity_type text not null, 
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default now()
);
5. Grading Logic (Postgres Trigger)create or replace function process_assessment_submission()
returns trigger as $$
declare
    v_rec record;
    v_auto_total float := 0;
    v_needs_manual boolean := false;
begin
    -- 1. Duration & Penalty Check
    -- (Logic for penalty_applied goes here)

    -- 2. Auto-Marking Logic
    for v_rec in 
        select 
            r.id as response_id,
            q.marks_possible, 
            k.correct_option_id, 
            k.correct_text_match, 
            k.is_auto_mark, 
            q.question_type,
            r.selected_option_id,
            r.text_value
        from responses r
        join questions q on r.question_id = q.id
        left join marking_keys k on k.question_id = q.id
        where r.submission_id = NEW.id
    loop
        if v_rec.question_type in ('paragraph', 'essay', 'image_upload') or v_rec.is_auto_mark = false then
            v_needs_manual := true;
        elsif v_rec.is_auto_mark = true then
            if v_rec.question_type = 'mcq' then
                if v_rec.selected_option_id = v_rec.correct_option_id then
                    update responses set marks_awarded = v_rec.marks_possible, is_graded = true where id = v_rec.response_id;
                    v_auto_total := v_auto_total + v_rec.marks_possible;
                else
                    update responses set marks_awarded = 0, is_graded = true where id = v_rec.response_id;
                end if;
            elsif v_rec.question_type = 'short_answer' then
                if lower(trim(v_rec.text_value)) = lower(trim(v_rec.correct_text_match)) then
                    update responses set marks_awarded = v_rec.marks_possible, is_graded = true where id = v_rec.response_id;
                    v_auto_total := v_auto_total + v_rec.marks_possible;
                else
                    update responses set marks_awarded = 0, is_graded = true where id = v_rec.response_id;
                end if;
            end if;
        end if;
    end loop;

    NEW.auto_score := v_auto_total;
    NEW.total_score := v_auto_total - NEW.penalty_applied;
    NEW.grading_status := case when v_needs_manual then 'partially_graded' else 'completed' end;
    
    return NEW;
end;
$$ language plpgsql;

create trigger tr_process_submission
after insert on submissions
for each row execute function process_assessment_submission();
6. PWA Security & IntegrityCopy-Paste Block: Native JavaScript listeners (oncopy, onpaste, oncut) attached to the Assessment View.Proctoring Logs: The useAssessmentViewModel tracks visibilitychange to count tab-switching instances.7. MVVM Structure & IDB StrategyServices (Model): StorageService for IDB and Supabase S3-compatible storage.Hooks (ViewModel): useAssessmentSession for candidate logic; useManagement for Admin/Examiner dashboard.Components (View): Shared Material UI components utilizing Teal gradients.IDB Store: student_responses allows for image blobs to be stored until an active connection allows sync.