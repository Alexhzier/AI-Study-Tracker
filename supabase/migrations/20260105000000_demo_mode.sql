-- Demo mode: private guest sandboxes, guest AI limits, automatic cleanup, keep-alive ping.
-- Requires "Allow anonymous sign-ins" to be ON in Supabase (Authentication -> Sign In / Providers).

-- --------------------------------------------- AI quota: add a global guest cap
-- (the old 4-argument version is replaced; the app now passes a 5th argument)
drop function if exists public.ai_reserve_usage(text, text, integer, integer);

create or replace function public.ai_reserve_usage(
  p_kind text, p_model text, p_daily_limit integer, p_cooldown_seconds integer,
  p_guest_global_limit integer default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  guest boolean;
  used integer;
  global_used integer;
  last_at timestamptz;
  new_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  guest := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);

  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_kind, 0));

  select count(*) filter (where status <> 'failed'), max(created_at)
    into used, last_at
    from public.ai_usage
   where user_id = uid and kind = p_kind and created_at > now() - interval '24 hours';

  if used >= p_daily_limit then raise exception 'daily_limit'; end if;
  if last_at is not null and last_at > now() - make_interval(secs => p_cooldown_seconds) then
    raise exception 'cooldown';
  end if;

  -- All demo guests share one daily allowance so a crowd can't exhaust the AI quota.
  if guest and p_guest_global_limit is not null then
    perform pg_advisory_xact_lock(hashtextextended('guest-global:' || p_kind, 0));
    select count(*) into global_used
      from public.ai_usage u join auth.users a on a.id = u.user_id
     where a.is_anonymous and u.kind = p_kind and u.status <> 'failed'
       and u.created_at > now() - interval '24 hours';
    if global_used >= p_guest_global_limit then raise exception 'global_limit'; end if;
  end if;

  insert into public.ai_usage (user_id, kind, model, status)
  values (uid, p_kind, p_model, 'pending') returning id into new_id;
  return new_id;
end $$;

revoke all on function public.ai_reserve_usage(text, text, integer, integer, integer) from public, anon;
grant execute on function public.ai_reserve_usage(text, text, integer, integer, integer) to authenticated;

-- ---------------------------------------------------------- seed sample data
-- Only anonymous (guest) users may call this, and only while they have no subjects yet.
create or replace function public.seed_demo_data(p_timezone text) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone p_timezone)::date;
  next_week date := date_trunc('week', ((now() at time zone p_timezone)::date)::timestamp)::date + 7;
  names  text[] := array['Calculus II', 'Organic Chemistry', 'World History', 'Spanish'];
  colors text[] := array['#3b6ea5', '#b5546b', '#c27a2c', '#6b8e3d'];
  notes  text[] := array['Practice problems', 'Reviewed chapter summary', 'Flashcards', 'Past paper questions', 'Cleaned up lecture notes'];
  s uuid[] := '{}';
  sid uuid;
  pid uuid;
  d integer; i integer; h integer; subj integer; dur integer;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'demo_only'; end if;
  if exists (select 1 from public.subjects where user_id = uid) then return; end if;

  for i in 1..4 loop
    insert into public.subjects (user_id, name, color) values (uid, names[i], colors[i]) returning id into sid;
    s := s || sid;
  end loop;

  -- About five weeks of believable history: a few rest days, one or two sessions on study days.
  for d in 1..35 loop
    h := abs(hashtext('day' || d));
    if h % 7 in (0, 3) then continue; end if;
    for i in 1..(1 + (h / 7) % 2) loop
      subj := 1 + abs(hashtext('s' || d || ':' || i)) % 4;
      dur  := 25 + (abs(hashtext('d' || d || ':' || i)) % 6) * 10;
      insert into public.study_sessions (user_id, subject_id, session_date, duration_minutes, notes)
      values (uid, s[subj], today - d, dur,
              case when abs(hashtext('n' || d || ':' || i)) % 3 = 0
                   then notes[1 + abs(hashtext('m' || d || ':' || i)) % 5] end);
    end loop;
  end loop;
  insert into public.study_sessions (user_id, subject_id, session_date, duration_minutes, notes)
  values (uid, s[1], today, 40, 'Practice problems');

  -- Goals, availability, priorities, one exam.
  insert into public.planner_settings (user_id, weekly_goal_minutes, daily_goal_minutes) values (uid, 600, 90);
  insert into public.planner_availability (user_id, weekday, available_minutes)
    select uid, g, case when g <= 5 then 120 else 150 end from generate_series(1, 6) g;
  insert into public.planner_subject_settings (user_id, subject_id, priority, weekly_target_minutes) values
    (uid, s[1], 5, 240), (uid, s[2], 4, 180), (uid, s[3], 2, null), (uid, s[4], 3, 120);
  insert into public.exams (user_id, subject_id, title, exam_date) values
    (uid, s[1], 'Midterm', today + 12), (uid, s[2], 'Quiz', today + 20);

  -- A sample approved plan for next week so the planner and calendar have something to show.
  insert into public.study_plans (user_id, week_start, status, summary, model)
  values (uid, next_week, 'approved', 'Sample plan: focus on Calculus II ahead of the midterm.', 'demo')
  returning id into pid;
  insert into public.study_plan_items (plan_id, user_id, subject_id, topic, planned_date, duration_minutes, explanation, source) values
    (pid, uid, s[1], null,            next_week,     60, 'Priority 5 with a midterm coming up.', 'manual'),
    (pid, uid, s[2], null,            next_week + 2, 45, 'Priority 4 and a quiz on the horizon.', 'manual'),
    (pid, uid, s[1], 'Practice problems', next_week + 3, 60, 'Weekly target for Calculus II is 4 hours.', 'manual'),
    (pid, uid, s[4], null,            next_week + 4, 30, 'Weekly target for Spanish is 2 hours.', 'manual');
end $$;

revoke all on function public.seed_demo_data(text) from public, anon;
grant execute on function public.seed_demo_data(text) to authenticated;

-- --------------------------------------------------------- guest cleanup
-- Deletes guest accounts older than the given age along with everything they own.
-- Sessions are removed first because they reference subjects with ON DELETE RESTRICT.
create or replace function public.cleanup_demo_users(p_older_than interval default interval '2 days')
returns integer
language plpgsql security definer set search_path = public, auth as $$
declare n integer;
begin
  delete from public.study_sessions
   where user_id in (select id from auth.users where is_anonymous and created_at < now() - p_older_than);
  with gone as (
    delete from auth.users where is_anonymous and created_at < now() - p_older_than returning 1
  )
  select count(*) into n from gone;
  return n;
end $$;
revoke all on function public.cleanup_demo_users(interval) from public, anon, authenticated;

-- Daily schedule (needs the pg_cron extension; if this block can't enable it, see the notice).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('cleanup-demo-users', '17 3 * * *', 'select public.cleanup_demo_users()');
exception when others then
  raise notice 'pg_cron was not scheduled (%). Enable it under Database -> Extensions, then run: select cron.schedule(''cleanup-demo-users'', ''17 3 * * *'', ''select public.cleanup_demo_users()'');', sqlerrm;
end $$;

-- ------------------------------------------------------------ keep-alive
create or replace function public.ping() returns timestamptz
language sql stable as $$ select now() $$;
grant execute on function public.ping() to anon, authenticated;
