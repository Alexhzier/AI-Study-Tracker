import { cn } from "@/lib/utils";

const TONES = {
  draft: "bg-secondary text-secondary-foreground border border-border/60",
  approved: "bg-accent/80 text-accent-foreground border border-primary/20",
  sample: "border border-dashed border-input/60 text-muted-foreground bg-muted/30",
} as const;

/** Small status label. Colour is never the only signal: the word is always there. */
export function Tag({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-tight", TONES[tone])}>
      {children}
    </span>
  );
}
