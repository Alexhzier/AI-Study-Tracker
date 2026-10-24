export type HistoryLevel = "none" | "limited" | "sufficient";

export type PlanItem = {
  subject_id: string;
  topic: string | null;
  date: string; // yyyy-MM-dd
  duration_minutes: number;
  explanation: string;
  source: "ai" | "edited" | "manual";
};

/** Raw item as returned by the model (before validation). */
export type AiItem = Omit<PlanItem, "source">;

export type PlanDraft = {
  weekStart: string;
  summary: string;
  notes: string | null;
  items: PlanItem[];
  warnings: string[];
  historyLevel: HistoryLevel;
  model: string;
  /** yyyy-MM-dd -> minutes the user said they have available (minus anything already logged today). */
  capacity: Record<string, number>;
};

export type GenerateResult = { error?: string; draft?: PlanDraft };

export type ApprovedPlan = { id: string; summary: string | null; model: string | null; items: PlanItem[] };

export type PlannedItem = {
  id: string;
  subject_id: string;
  topic: string | null;
  planned_date: string;
  duration_minutes: number;
  explanation: string;
};

export type Exam = {
  id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  notes: string | null;
};
