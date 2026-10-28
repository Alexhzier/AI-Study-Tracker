import { cn } from "@/lib/utils";

/** Each page picks a width that fits its content instead of one global cap. */
const SIZES = {
  wide: "max-w-[1320px]", // dashboard, calendar, analytics
  default: "max-w-[1120px]", // planner
  content: "max-w-[880px]", // lists: sessions, subjects
  narrow: "max-w-[720px]", // forms and settings
} as const;

export function PageContainer({ size = "default", children }: { size?: keyof typeof SIZES; children: React.ReactNode }) {
  return <div className={cn("section-stagger mx-auto w-full", SIZES[size])}>{children}</div>;
}
