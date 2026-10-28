export type Subject = {
  id: string;
  name: string;
  color: string;
  is_archived: boolean;
  created_at: string;
};

export type Session = {
  id: string;
  subject_id: string;
  session_date: string; // yyyy-MM-dd in the app timezone
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number;
  notes: string | null;
  objective?: string | null;
  pomodoro_cycles?: number;
  created_at: string;
};

export type SessionLite = Pick<Session, "subject_id" | "session_date" | "duration_minutes">;

export type ActionResult = { error?: string };
