-- Timer across devices: one active timer per user, stored in Postgres.
-- All transitions run in the database using the SERVER clock, so devices with wrong clocks
-- can't distort time, and two devices can't corrupt each other's state.

create table public.active_timers (
  user_id            uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  subject_id         uuid not null,
  status             text not null check (status in ('running', 'paused', 'stopped')),
  started_at         timestamptz not null,          -- when the timer first started
  segment_started_at timestamptz,                   -- start of the current running stretch
  accumulated_ms     bigint not null default 0,     -- active time from finished stretches
  ended_at           timestamptz,                   -- set when stopped
  updated_at         timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade,
  constraint active_timers_running_has_segment check ((status = 'running') = (segment_started_at is not null)),
  constraint active_timers_stopped_has_end      check ((status = 'stopped') = (ended_at is not null)),
  constraint active_timers_accumulated_nonneg   check (accumulated_ms >= 0)
);

alter table public.active_timers enable row level security;
create policy "active_timers: select own" on public.active_timers
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.active_timers from anon;
revoke insert, update, delete on public.active_timers from authenticated;

-- ---------------------------------------------------------------- helpers
create or replace function public.timer_snapshot(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'timer', (select to_jsonb(t) - 'user_id' - 'updated_at' from public.active_timers t where t.user_id = p_uid),
    'server_now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );
$$;
revoke all on function public.timer_snapshot(uuid) from public, anon, authenticated;

create or replace function public.timer_state() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return public.timer_snapshot(auth.uid());
end $$;

-- ------------------------------------------------------------ transitions
create or replace function public.timer_start(p_subject_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); archived boolean;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select is_archived into archived from public.subjects where id = p_subject_id and user_id = uid;
  if not found or archived then raise exception 'subject_unavailable'; end if;
  begin
    insert into public.active_timers (user_id, subject_id, status, started_at, segment_started_at, accumulated_ms)
    values (uid, p_subject_id, 'running', clock_timestamp(), clock_timestamp(), 0);
  exception when unique_violation then
    raise exception 'timer_exists';
  end;
  return public.timer_snapshot(uid);
end $$;

create or replace function public.timer_pause() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update public.active_timers
     set accumulated_ms = accumulated_ms + greatest(0, floor(extract(epoch from (clock_timestamp() - segment_started_at)) * 1000))::bigint,
         segment_started_at = null, status = 'paused', updated_at = now()
   where user_id = uid and status = 'running';
  if not found then raise exception 'invalid_state'; end if;
  return public.timer_snapshot(uid);
end $$;

create or replace function public.timer_resume() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update public.active_timers
     set segment_started_at = clock_timestamp(), status = 'running', updated_at = now()
   where user_id = uid and status = 'paused';
  if not found then raise exception 'invalid_state'; end if;
  return public.timer_snapshot(uid);
end $$;

create or replace function public.timer_stop() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update public.active_timers
     set accumulated_ms = accumulated_ms + case
           when status = 'running' then greatest(0, floor(extract(epoch from (clock_timestamp() - segment_started_at)) * 1000))::bigint
           else 0 end,
         segment_started_at = null, status = 'stopped', ended_at = clock_timestamp(), updated_at = now()
   where user_id = uid and status in ('running', 'paused');
  if not found then raise exception 'invalid_state'; end if;
  return public.timer_snapshot(uid);
end $$;

create or replace function public.timer_discard() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  delete from public.active_timers where user_id = uid;
  return public.timer_snapshot(uid);
end $$;

-- Turns a stopped timer into a study session and removes the timer, atomically.
create or replace function public.timer_save(p_notes text, p_timezone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t public.active_timers; mins integer; archived boolean;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into t from public.active_timers where user_id = uid for update;
  if not found then raise exception 'no_timer'; end if;
  if t.status <> 'stopped' then raise exception 'not_stopped'; end if;

  mins := round(t.accumulated_ms / 60000.0)::integer;
  if mins < 1 then raise exception 'too_short'; end if;
  if mins > 1440 then raise exception 'too_long'; end if;

  select is_archived into archived from public.subjects where id = t.subject_id and user_id = uid;
  if not found or archived then raise exception 'subject_unavailable'; end if;

  insert into public.study_sessions (user_id, subject_id, session_date, started_at, ended_at, duration_minutes, notes)
  values (uid, t.subject_id, (t.started_at at time zone p_timezone)::date, t.started_at, t.ended_at, mins,
          nullif(left(btrim(coalesce(p_notes, '')), 2000), ''));

  delete from public.active_timers where user_id = uid;
  return public.timer_snapshot(uid);
end $$;

revoke all on function public.timer_state(), public.timer_start(uuid), public.timer_pause(), public.timer_resume(),
  public.timer_stop(), public.timer_discard(), public.timer_save(text, text) from public, anon;
grant execute on function public.timer_state(), public.timer_start(uuid), public.timer_pause(), public.timer_resume(),
  public.timer_stop(), public.timer_discard(), public.timer_save(text, text) to authenticated;

-- Live updates to other open devices (the app also polls as a fallback).
do $$
begin
  alter publication supabase_realtime add table public.active_timers;
exception when duplicate_object then null; when undefined_object then null;
end $$;
