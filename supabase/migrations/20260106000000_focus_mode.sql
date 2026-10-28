-- Focus Mode schema additions and RPCs
-- Purely additive and backward-compatible with 20260104000000_timer_sync.sql

-- 1. Extend study_sessions with optional objective and pomodoro cycles
alter table public.study_sessions
  add column if not exists objective text check (objective is null or char_length(btrim(objective)) <= 200),
  add column if not exists pomodoro_cycles integer default 0 check (pomodoro_cycles >= 0);

-- 2. Extend active_timers with Pomodoro state, durations, and concurrency tracking
alter table public.active_timers
  add column if not exists mode text not null default 'stopwatch' check (mode in ('stopwatch', 'pomodoro')),
  add column if not exists phase text not null default 'focus' check (phase in ('focus', 'short_break', 'long_break')),
  add column if not exists phase_started_at timestamptz default clock_timestamp(),
  add column if not exists focus_duration_ms bigint,
  add column if not exists phase_duration_ms bigint,
  add column if not exists phase_accumulated_ms bigint not null default 0,
  add column if not exists cycles_completed integer not null default 0 check (cycles_completed >= 0),
  add column if not exists short_break_ms bigint default 300000,
  add column if not exists long_break_ms bigint default 900000,
  add column if not exists long_break_every integer default 4 check (long_break_every = 0 or long_break_every between 2 and 12),
  add column if not exists objective text check (objective is null or char_length(btrim(objective)) <= 200);

-- 3. Capability check RPC for client feature detection
create or replace function public.focus_capabilities() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('supported', true, 'version', 1);
$$;
revoke all on function public.focus_capabilities() from public, anon;
grant execute on function public.focus_capabilities() to authenticated, anon;

-- 4. Update timer_pause to respect focus phase cap
create or replace function public.timer_pause() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t public.active_timers;
  elapsed bigint;
  credited bigint;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into t from public.active_timers where user_id = uid for update;
  if not found or t.status <> 'running' then raise exception 'invalid_state'; end if;

  elapsed := greatest(0, floor(extract(epoch from (clock_timestamp() - t.segment_started_at)) * 1000))::bigint;
  if t.mode = 'pomodoro' and t.phase = 'focus' and t.phase_duration_ms is not null then
    credited := least(elapsed, greatest(0, t.phase_duration_ms - t.phase_accumulated_ms));
  else
    credited := elapsed;
  end if;

  update public.active_timers
     set accumulated_ms = accumulated_ms + credited,
         phase_accumulated_ms = phase_accumulated_ms + credited,
         segment_started_at = null,
         status = 'paused',
         updated_at = now()
   where user_id = uid;

  return public.timer_snapshot(uid);
end $$;

-- 5. Update timer_resume to protect Pomodoro phase transitions
create or replace function public.timer_resume() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t public.active_timers;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into t from public.active_timers where user_id = uid for update;
  if not found or t.status <> 'paused' then raise exception 'invalid_state'; end if;

  -- In Pomodoro mode, break phases cannot simply be 'resumed' as running study time.
  -- They must transition via timer_focus_next_phase or timer_focus_skip_break.
  if t.mode = 'pomodoro' and t.phase in ('short_break', 'long_break') then
    raise exception 'invalid_state';
  end if;

  -- If focus phase already reached its cap, do not resume as running focus.
  if t.mode = 'pomodoro' and t.phase = 'focus' and t.phase_duration_ms is not null and t.phase_accumulated_ms >= t.phase_duration_ms then
    raise exception 'phase_completed';
  end if;

  update public.active_timers
     set segment_started_at = clock_timestamp(),
         status = 'running',
         updated_at = now()
   where user_id = uid;

  return public.timer_snapshot(uid);
end $$;

-- 6. Update timer_stop to respect focus phase cap
create or replace function public.timer_stop() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t public.active_timers;
  elapsed bigint := 0;
  credited bigint := 0;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into t from public.active_timers where user_id = uid for update;
  if not found or t.status not in ('running', 'paused') then raise exception 'invalid_state'; end if;

  if t.status = 'running' then
    elapsed := greatest(0, floor(extract(epoch from (clock_timestamp() - t.segment_started_at)) * 1000))::bigint;
    if t.mode = 'pomodoro' and t.phase = 'focus' and t.phase_duration_ms is not null then
      credited := least(elapsed, greatest(0, t.phase_duration_ms - t.phase_accumulated_ms));
    else
      credited := elapsed;
    end if;
  end if;

  update public.active_timers
     set accumulated_ms = accumulated_ms + credited,
         phase_accumulated_ms = phase_accumulated_ms + credited,
         segment_started_at = null,
         status = 'stopped',
         ended_at = clock_timestamp(),
         updated_at = now()
   where user_id = uid;

  return public.timer_snapshot(uid);
end $$;

-- 7. Update timer_save to copy objective and pomodoro cycles atomically
create or replace function public.timer_save(p_notes text, p_timezone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t public.active_timers;
  mins integer;
  archived boolean;
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

  insert into public.study_sessions (
    user_id, subject_id, session_date, started_at, ended_at, duration_minutes, notes,
    objective, pomodoro_cycles
  )
  values (
    uid, t.subject_id, (t.started_at at time zone p_timezone)::date, t.started_at, t.ended_at, mins,
    nullif(left(btrim(coalesce(p_notes, '')), 2000), ''),
    t.objective,
    coalesce(t.cycles_completed, 0)
  );

  delete from public.active_timers where user_id = uid;
  return public.timer_snapshot(uid);
end $$;

-- 8. Pomodoro RPC: timer_focus_start
create or replace function public.timer_focus_start(
  p_subject_id uuid,
  p_duration_ms bigint,
  p_short_break_ms bigint default 300000,
  p_long_break_ms bigint default 900000,
  p_long_break_every integer default 4,
  p_objective text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  archived boolean;
  clean_obj text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select is_archived into archived from public.subjects where id = p_subject_id and user_id = uid;
  if not found or archived then raise exception 'subject_unavailable'; end if;

  if p_duration_ms is null or p_duration_ms < 60000 or p_duration_ms > 10800000 then -- 1 min to 180 min
    raise exception 'invalid_duration';
  end if;
  if p_short_break_ms is null or p_short_break_ms < 60000 or p_short_break_ms > 3600000 then -- 1 min to 60 min
    raise exception 'invalid_short_break';
  end if;
  if p_long_break_ms is null or p_long_break_ms < 60000 or p_long_break_ms > 3600000 then
    raise exception 'invalid_long_break';
  end if;
  if p_long_break_every is null or (p_long_break_every <> 0 and (p_long_break_every < 2 or p_long_break_every > 12)) then
    raise exception 'invalid_long_break_interval';
  end if;

  clean_obj := nullif(left(btrim(coalesce(p_objective, '')), 200), '');

  begin
    insert into public.active_timers (
      user_id, subject_id, status, started_at, segment_started_at, accumulated_ms,
      mode, phase, phase_started_at, focus_duration_ms, phase_duration_ms, phase_accumulated_ms,
      cycles_completed, short_break_ms, long_break_ms, long_break_every, objective
    )
    values (
      uid, p_subject_id, 'running', clock_timestamp(), clock_timestamp(), 0,
      'pomodoro', 'focus', clock_timestamp(), p_duration_ms, p_duration_ms, 0,
      0, p_short_break_ms, p_long_break_ms, p_long_break_every, clean_obj
    );
  exception when unique_violation then
    raise exception 'timer_exists';
  end;

  return public.timer_snapshot(uid);
end $$;

-- 9. Pomodoro RPC: timer_focus_next_phase
create or replace function public.timer_focus_next_phase(
  p_expected_phase_started_at timestamptz,
  p_auto_start_focus boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t public.active_timers;
  elapsed bigint := 0;
  credited bigint := 0;
  next_phase text;
  next_duration bigint;
  new_cycles integer;
  is_long_break boolean;
  next_status text;
  next_segment timestamptz;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into t from public.active_timers where user_id = uid for update;
  if not found or t.mode <> 'pomodoro' or t.status = 'stopped' then
    raise exception 'invalid_state';
  end if;

  -- Concurrency fencing: if phase_started_at doesn't match, another tab already transitioned
  if t.phase_started_at is distinct from p_expected_phase_started_at then
    return public.timer_snapshot(uid);
  end if;

  if t.phase = 'focus' then
    if t.status = 'running' then
      elapsed := greatest(0, floor(extract(epoch from (clock_timestamp() - t.segment_started_at)) * 1000))::bigint;
      credited := least(elapsed, greatest(0, t.phase_duration_ms - t.phase_accumulated_ms));
    end if;

    new_cycles := t.cycles_completed;
    if (t.phase_accumulated_ms + credited) >= t.phase_duration_ms then
      new_cycles := new_cycles + 1;
    end if;

    is_long_break := (t.long_break_every > 0) and (new_cycles % t.long_break_every = 0);
    if is_long_break then
      next_phase := 'long_break';
      next_duration := t.long_break_ms;
    else
      next_phase := 'short_break';
      next_duration := t.short_break_ms;
    end if;

    update public.active_timers
       set accumulated_ms = accumulated_ms + credited,
           phase_accumulated_ms = 0,
           segment_started_at = null,
           status = 'paused',
           phase = next_phase,
           phase_duration_ms = next_duration,
           phase_started_at = clock_timestamp(),
           cycles_completed = new_cycles,
           updated_at = now()
     where user_id = uid;

  elsif t.phase in ('short_break', 'long_break') then
    next_phase := 'focus';
    next_duration := coalesce(t.focus_duration_ms, 1500000);
    if p_auto_start_focus then
      next_status := 'running';
      next_segment := clock_timestamp();
    else
      next_status := 'paused';
      next_segment := null;
    end if;

    update public.active_timers
       set phase_accumulated_ms = 0,
           segment_started_at = next_segment,
           status = next_status,
           phase = next_phase,
           phase_duration_ms = next_duration,
           phase_started_at = clock_timestamp(),
           updated_at = now()
     where user_id = uid;
  end if;

  return public.timer_snapshot(uid);
end $$;

-- 10. Pomodoro RPC: timer_focus_skip_break
create or replace function public.timer_focus_skip_break(
  p_expected_phase_started_at timestamptz,
  p_auto_start_focus boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t public.active_timers;
  next_status text;
  next_segment timestamptz;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into t from public.active_timers where user_id = uid for update;
  if not found or t.mode <> 'pomodoro' or t.status = 'stopped' or t.phase not in ('short_break', 'long_break') then
    raise exception 'invalid_state';
  end if;

  if t.phase_started_at is distinct from p_expected_phase_started_at then
    return public.timer_snapshot(uid);
  end if;

  if p_auto_start_focus then
    next_status := 'running';
    next_segment := clock_timestamp();
  else
    next_status := 'paused';
    next_segment := null;
  end if;

  update public.active_timers
     set phase_accumulated_ms = 0,
         segment_started_at = next_segment,
         status = next_status,
         phase = 'focus',
         phase_duration_ms = coalesce(t.focus_duration_ms, 1500000),
         phase_started_at = clock_timestamp(),
         updated_at = now()
   where user_id = uid;

  return public.timer_snapshot(uid);
end $$;

-- 11. Pomodoro RPC: timer_focus_update_objective
create or replace function public.timer_focus_update_objective(
  p_objective text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  clean_obj text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  clean_obj := nullif(left(btrim(coalesce(p_objective, '')), 200), '');

  update public.active_timers
     set objective = clean_obj,
         updated_at = now()
   where user_id = uid;

  if not found then raise exception 'no_timer'; end if;

  return public.timer_snapshot(uid);
end $$;

-- 12. Permissions: revoke from public/anon, grant to authenticated
revoke all on function public.timer_focus_start(uuid, bigint, bigint, bigint, integer, text),
  public.timer_focus_next_phase(timestamptz, boolean),
  public.timer_focus_skip_break(timestamptz, boolean),
  public.timer_focus_update_objective(text) from public, anon;

grant execute on function public.timer_focus_start(uuid, bigint, bigint, bigint, integer, text),
  public.timer_focus_next_phase(timestamptz, boolean),
  public.timer_focus_skip_break(timestamptz, boolean),
  public.timer_focus_update_objective(text) to authenticated;
