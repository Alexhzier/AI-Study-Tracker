-- AI Study Planner: settings, exams, approved plans, usage metering.
-- Existing tables (subjects, study_sessions) are not modified.

-- ------------------------------------------------------- planner settings
create table public.planner_settings (
  user_id             uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weekly_goal_minutes integer,
  updated_at          timestamptz not null default now(),
  constraint planner_settings_goal_range
    check (weekly_goal_minutes is null or (weekly_goal_minutes > 0 and weekly_goal_minutes <= 10080))
);

-- Available study time per ISO weekday (1 = Monday ... 7 = Sunday). No row = not available.
create table public.planner_availability (
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weekday           smallint not null check (weekday between 1 and 7),
  available_minutes integer  not null check (available_minutes > 0 and available_minutes <= 1440),
  primary key (user_id, weekday)
);

create table public.planner_subject_settings (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  priority   smallint not null default 3 check (priority between 1 and 5),
  primary key (user_id, subject_id),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ exams
create table public.exams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  title      text not null default 'Exam',
  exam_date  date not null,
  notes      text,
  created_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade,
  constraint exams_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint exams_notes_len check (notes is null or char_length(notes) <= 500)
);
create index exams_user_date_idx on public.exams (user_id, exam_date);

-- ------------------------------------------------------------------ plans
create table public.study_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start  date not null,
  status      text not null default 'approved' check (status in ('approved', 'archived')),
  summary     text,
  model       text,
  approved_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  constraint study_plans_week_is_monday check (extract(isodow from week_start) = 1),
  constraint study_plans_id_user_unique unique (id, user_id)
);
-- At most one approved plan per user per week; approving again archives the previous one.
create unique index study_plans_one_approved_per_week
  on public.study_plans (user_id, week_start) where status = 'approved';

create table public.study_plan_items (
  id               uuid primary key default gen_random_uuid(),
  plan_id          uuid not null,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id       uuid not null,
  topic            text,
  planned_date     date not null,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  explanation      text not null default '',
  source           text not null default 'ai' check (source in ('ai', 'edited', 'manual')),
  created_at       timestamptz not null default now(),
  foreign key (plan_id, user_id)    references public.study_plans (id, user_id) on delete cascade,
  foreign key (subject_id, user_id) references public.subjects (id, user_id)    on delete cascade,
  constraint plan_items_topic_len  check (topic is null or char_length(topic) <= 120),
  constraint plan_items_explain_len check (char_length(explanation) <= 500)
);
create index study_plan_items_user_date_idx on public.study_plan_items (user_id, planned_date);
create index study_plan_items_plan_idx      on public.study_plan_items (plan_id);

-- ------------------------------------------------------------- AI metering
create table public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind          text not null,
  model         text,
  status        text not null default 'pending' check (status in ('pending', 'ok', 'failed')),
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  created_at    timestamptz not null default now()
);
create index ai_usage_user_kind_time_idx on public.ai_usage (user_id, kind, created_at desc);

-- ------------------------------------------------------ Row Level Security
do $$
declare t text;
begin
  foreach t in array array[
    'planner_settings', 'planner_availability', 'planner_subject_settings',
    'exams', 'study_plans', 'study_plan_items'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: select own" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t, t);
    execute format('create policy "%s: insert own" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t, t);
    execute format('create policy "%s: update own" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t, t);
    execute format('create policy "%s: delete own" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- ai_usage is read-only for users. Writes happen only through the functions below,
-- so a user cannot reset their own quota by editing or deleting rows.
alter table public.ai_usage enable row level security;
create policy "ai_usage: select own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.ai_usage from anon;
revoke insert, update, delete on public.ai_usage from authenticated;

create or replace function public.ai_reserve_usage(
  p_kind text, p_model text, p_daily_limit integer, p_cooldown_seconds integer
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  used integer;
  last_at timestamptz;
  new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  -- Serialize concurrent requests from the same user so the limit can't be raced.
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_kind, 0));

  select count(*) filter (where status <> 'failed'), max(created_at)
    into used, last_at
    from public.ai_usage
   where user_id = uid and kind = p_kind and created_at > now() - interval '24 hours';

  if used >= p_daily_limit then raise exception 'daily_limit'; end if;
  if last_at is not null and last_at > now() - make_interval(secs => p_cooldown_seconds) then
    raise exception 'cooldown';
  end if;

  insert into public.ai_usage (user_id, kind, model, status)
  values (uid, p_kind, p_model, 'pending') returning id into new_id;
  return new_id;
end $$;

create or replace function public.ai_finish_usage(
  p_id uuid, p_status text, p_input_tokens integer, p_output_tokens integer
) returns void
language sql security definer set search_path = public as $$
  update public.ai_usage
     set status = case when p_status = 'ok' then 'ok' else 'failed' end,
         input_tokens  = greatest(coalesce(p_input_tokens, 0), 0),
         output_tokens = greatest(coalesce(p_output_tokens, 0), 0)
   where id = p_id and user_id = auth.uid();
$$;

revoke all on function public.ai_reserve_usage(text, text, integer, integer) from public, anon;
revoke all on function public.ai_finish_usage(uuid, text, integer, integer)  from public, anon;
grant execute on function public.ai_reserve_usage(text, text, integer, integer) to authenticated;
grant execute on function public.ai_finish_usage(uuid, text, integer, integer)  to authenticated;

-- ----------------------------------------------------------- approve a plan
-- Atomic: archives the week's previous plan, then inserts the new plan and its items.
-- SECURITY INVOKER, so Row Level Security still applies to every statement.
create or replace function public.approve_study_plan(
  p_week_start date, p_summary text, p_model text, p_items jsonb
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  pid uuid;
  n integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be an array';
  end if;
  n := jsonb_array_length(p_items);
  if n < 1 or n > 60 then raise exception 'a plan needs between 1 and 60 items'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) i
     where (i->>'planned_date')::date < p_week_start
        or (i->>'planned_date')::date > p_week_start + 6
  ) then
    raise exception 'item date outside the plan week';
  end if;

  update public.study_plans
     set status = 'archived'
   where user_id = auth.uid() and week_start = p_week_start and status = 'approved';

  insert into public.study_plans (week_start, summary, model, status)
  values (p_week_start, left(p_summary, 600), left(p_model, 100), 'approved')
  returning id into pid;

  insert into public.study_plan_items (plan_id, subject_id, topic, planned_date, duration_minutes, explanation, source)
  select pid,
         (i->>'subject_id')::uuid,
         nullif(left(i->>'topic', 120), ''),
         (i->>'planned_date')::date,
         (i->>'duration_minutes')::integer,
         left(coalesce(i->>'explanation', ''), 500),
         coalesce(i->>'source', 'manual')
    from jsonb_array_elements(p_items) i;

  return pid;
end $$;

revoke all on function public.approve_study_plan(date, text, text, jsonb) from public, anon;
grant execute on function public.approve_study_plan(date, text, text, jsonb) to authenticated;
