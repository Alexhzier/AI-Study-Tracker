# Study Tracker

Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · Recharts · date-fns

## Setup

1. **Install**
   ```bash
   npm install
   npx shadcn@latest add button card input label dialog select sheet tabs textarea sonner
   ```
   (shadcn components are added as needed in later stages; `components.json` is already configured.)

2. **Create a Supabase project**, then copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
   The service-role key is never used or needed.

3. **Run the migration**
   - Supabase CLI: `supabase link --project-ref <ref> && supabase db push`
   - or paste `supabase/migrations/20260101000000_init.sql` into the SQL editor.

4. **Auth settings** (Authentication → Providers → Email): for quick local testing, turn off
   "Confirm email"; otherwise new users must confirm via email before signing in.

5. **Start**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and register.

## AI Study Planner
1. Apply `supabase/migrations/20260102000000_ai_planner.sql` (SQL Editor -> paste -> Run).
2. `npm install ai@^6 @ai-sdk/openai@^3 @ai-sdk/google@^3`
3. Choose a provider in `.env.local` (`AI_PROVIDER=google` is free; see `.env.example`) and to your host's environment variables.
4. In the app: Planner -> Planner settings (availability, goal, priorities, exams), then Generate.

Statistics are computed in code before the model is called; model output is validated against real
subjects, plannable dates, daily availability and the weekly goal. Usage is metered per user in
Postgres (`ai_usage`) with a daily limit and a cooldown. Set a monthly spend limit in your OpenAI
dashboard as the global backstop.

## Timezone
`NEXT_PUBLIC_APP_TIMEZONE` (default `Asia/Manila`). `study_sessions.session_date` stores the
local calendar date; all today / week / month ranges are computed via `src/lib/time.ts`.

## Roadmap
- [x] Stage 1: structure, auth, protected routes, migrations, theme, shell
- [x] Stage 2: subjects, sessions CRUD, dashboard, calendar
- [x] Stage 3: timer, analytics
- [x] Stage 4: AI study planner
- [x] Stage 5: study goals (apply `20260103000000_goals.sql`)
- [x] Stage 6: timer across devices (apply `20260104000000_timer_sync.sql`)
