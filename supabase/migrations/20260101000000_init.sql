-- Study Tracker: initial schema
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- subjects
create table public.subjects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name        text not null,
  color       text not null default '#2f6f6a',
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint subjects_name_not_blank check (char_length(btrim(name)) between 1 and 80),
  constraint subjects_color_hex      check (color ~* '^#[0-9a-f]{6}$'),
  -- lets study_sessions prove the subject belongs to the same user
  constraint subjects_id_user_unique unique (id, user_id)
);

-- One active subject name per user (case-insensitive). Archived names may be reused.
create unique index subjects_user_name_active_uq
  on public.subjects (user_id, lower(btrim(name)))
  where not is_archived;

create index subjects_user_idx on public.subjects (user_id, is_archived);

-- ---------------------------------------------------------- study_sessions
create table public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade default auth.uid(),
  subject_id       uuid not null,
  -- Local calendar date in the app timezone (Asia/Manila by default).
  session_date     date not null,
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_minutes integer not null,
  notes            text,
  created_at       timestamptz not null default now(),

  -- Composite FK: a session can only reference a subject owned by the same user.
  -- RESTRICT: subjects are archived, never hard-deleted, so history is preserved.
  constraint study_sessions_subject_fk
    foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete restrict,

  constraint study_sessions_duration_positive check (duration_minutes > 0 and duration_minutes <= 1440),
  constraint study_sessions_times_paired      check ((started_at is null) = (ended_at is null)),
  constraint study_sessions_times_ordered     check (started_at is null or ended_at > started_at),
  constraint study_sessions_notes_len         check (notes is null or char_length(notes) <= 2000)
);

create index study_sessions_user_date_idx    on public.study_sessions (user_id, session_date desc);
create index study_sessions_user_subject_idx on public.study_sessions (user_id, subject_id, session_date desc);

-- ------------------------------------------------------ Row Level Security
alter table public.subjects       enable row level security;
alter table public.study_sessions enable row level security;

create policy "subjects: select own" on public.subjects
  for select to authenticated using (user_id = (select auth.uid()));
create policy "subjects: insert own" on public.subjects
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "subjects: update own" on public.subjects
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "subjects: delete own" on public.subjects
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "sessions: select own" on public.study_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "sessions: insert own" on public.study_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "sessions: update own" on public.study_sessions
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "sessions: delete own" on public.study_sessions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Anonymous (signed-out) clients get nothing.
revoke all on public.subjects, public.study_sessions from anon;
