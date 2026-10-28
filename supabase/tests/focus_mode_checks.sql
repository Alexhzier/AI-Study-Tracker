-- Focus Mode Verification & Assertion Suite
-- Safe for execution in Supabase SQL editor:
-- Runs in a transaction and ALWAYS rolls back at the end. Zero persistent changes.

begin;

-- 1. Simulate authenticated user context
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

do $$
declare
  v_uid uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  v_subj_id uuid;
  v_res jsonb;
  v_timer public.active_timers;
  v_session public.study_sessions;
  v_token timestamptz;
  v_caught boolean := false;
begin
  -- Setup: create test subject
  insert into public.subjects (id, user_id, name, color)
  values (gen_random_uuid(), v_uid, 'Focus Test Subject', '#2f6f6a')
  returning id into v_subj_id;

  -- Test 1: Capability check
  v_res := public.focus_capabilities();
  assert (v_res->>'supported')::boolean = true, 'Test 1 Failed: focus_capabilities should return supported=true';

  -- Test 2: Start Focus Mode timer (25 min focus, 5 min break, 15 min long break every 4 cycles)
  v_res := public.timer_focus_start(
    p_subject_id := v_subj_id,
    p_duration_ms := 1500000, -- 25 min
    p_short_break_ms := 300000, -- 5 min
    p_long_break_ms := 900000, -- 15 min
    p_long_break_every := 4,
    p_objective := 'Master Quantum Mechanics'
  );

  select * into v_timer from public.active_timers where user_id = v_uid;
  assert v_timer.mode = 'pomodoro', 'Test 2 Failed: mode should be pomodoro';
  assert v_timer.phase = 'focus', 'Test 2 Failed: phase should be focus';
  assert v_timer.status = 'running', 'Test 2 Failed: status should be running';
  assert v_timer.objective = 'Master Quantum Mechanics', 'Test 2 Failed: objective mismatch';

  -- Test 3: Duplicate start prevention
  v_caught := false;
  begin
    perform public.timer_focus_start(v_subj_id, 1500000);
  exception when others then
    if sqlerrm like '%timer_exists%' then v_caught := true; end if;
  end;
  assert v_caught = true, 'Test 3 Failed: duplicate timer start should raise timer_exists';

  -- Test 4: Server-enforced focus cap
  -- Simulate tab sleeping/laptop closed for 3 hours (10,800,000 ms)
  update public.active_timers
     set segment_started_at = clock_timestamp() - interval '3 hours'
   where user_id = v_uid;

  -- Call timer_pause()
  perform public.timer_pause();
  select * into v_timer from public.active_timers where user_id = v_uid;
  assert v_timer.status = 'paused', 'Test 4 Failed: timer should be paused';
  -- Credited time MUST be capped at 25 minutes (1500000 ms), NOT 3 hours!
  assert v_timer.accumulated_ms = 1500000, format('Test 4 Failed: accumulated_ms (%s) was not capped at 1500000', v_timer.accumulated_ms);

  -- Test 5: Concurrency token check on phase transition
  v_token := v_timer.phase_started_at;
  -- Tab B sends stale request with an expired/wrong token
  v_res := public.timer_focus_next_phase(p_expected_phase_started_at := v_token - interval '10 seconds');
  select * into v_timer from public.active_timers where user_id = v_uid;
  assert v_timer.phase = 'focus', 'Test 5 Failed: stale token should not transition phase';
  assert v_timer.cycles_completed = 0, 'Test 5 Failed: stale token should not award cycles';

  -- Tab A sends matching token
  v_res := public.timer_focus_next_phase(p_expected_phase_started_at := v_token);
  select * into v_timer from public.active_timers where user_id = v_uid;
  assert v_timer.phase = 'short_break', 'Test 5 Failed: matching token should transition to short_break';
  assert v_timer.status = 'paused', 'Test 5 Failed: break must start in paused status';
  assert v_timer.cycles_completed = 1, 'Test 5 Failed: completed focus phase should award 1 cycle';

  -- Test 6: Skip break transitions back to focus
  v_token := v_timer.phase_started_at;
  v_res := public.timer_focus_skip_break(p_expected_phase_started_at := v_token, p_auto_start_focus := false);
  select * into v_timer from public.active_timers where user_id = v_uid;
  assert v_timer.phase = 'focus', 'Test 6 Failed: skip break should transition to focus';
  assert v_timer.status = 'paused', 'Test 6 Failed: skipped break should stay paused until user resumes';

  -- Test 7: Stop and Save session with objective and pomodoro_cycles
  perform public.timer_stop();
  v_res := public.timer_save(p_notes := 'Great deep focus session', p_timezone := 'Asia/Manila');

  -- Verify active timer was deleted atomically
  assert not exists (select 1 from public.active_timers where user_id = v_uid), 'Test 7 Failed: timer should be deleted after save';

  -- Verify session was created with objective and cycles
  select * into v_session from public.study_sessions where user_id = v_uid and notes = 'Great deep focus session';
  assert v_session.duration_minutes = 25, format('Test 7 Failed: duration_minutes (%s) should be 25', v_session.duration_minutes);
  assert v_session.objective = 'Master Quantum Mechanics', 'Test 7 Failed: objective was not saved in study_sessions';
  assert v_session.pomodoro_cycles = 1, 'Test 7 Failed: pomodoro_cycles was not saved in study_sessions';

  -- Test 8: Idempotency (saving again must fail with no_timer)
  v_caught := false;
  begin
    perform public.timer_save('Duplicate save', 'Asia/Manila');
  exception when others then
    if sqlerrm like '%no_timer%' then v_caught := true; end if;
  end;
  assert v_caught = true, 'Test 8 Failed: duplicate save should raise no_timer';

  raise notice 'ALL FOCUS MODE ASSERTIONS PASSED SUCCESSFULLY!';
end $$;

rollback;
