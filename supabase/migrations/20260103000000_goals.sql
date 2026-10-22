-- Study goals: a daily goal and per-subject weekly targets.
-- The weekly goal already lives in planner_settings.weekly_goal_minutes (single source of truth).
-- Existing rows and policies are untouched; RLS on both tables already applies to the new columns.

alter table public.planner_settings
  add column if not exists daily_goal_minutes integer;
alter table public.planner_settings
  drop constraint if exists planner_settings_daily_goal_range;
alter table public.planner_settings
  add constraint planner_settings_daily_goal_range
  check (daily_goal_minutes is null or (daily_goal_minutes > 0 and daily_goal_minutes <= 1440));

alter table public.planner_subject_settings
  add column if not exists weekly_target_minutes integer;
alter table public.planner_subject_settings
  drop constraint if exists planner_subject_target_range;
alter table public.planner_subject_settings
  add constraint planner_subject_target_range
  check (weekly_target_minutes is null or (weekly_target_minutes > 0 and weekly_target_minutes <= 10080));
