import { cn } from "@/lib/utils";

const TONES = {
  draft: "bg-secondary text-secondary-foreground",
  approved: "bg-accent text-accent-foreground",
  sample: "border border-dashed border-input text-muted-foreground",
} as const;

/** Small status label. Colour is never the only signal: the word is always there. */
export function Tag({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium", TONES[tone])}>{children}</span>;
}
