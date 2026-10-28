import Link from "next/link";

/** A progress arc: the mark says "study progress" with refined modern presence. */
export function Brand() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/60">
      <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-xs ring-1 ring-primary/20 transition-transform group-hover:scale-105">
        <svg viewBox="0 0 16 16" className="size-4" fill="none">
          <path d="M8 2.5a5.5 5.5 0 1 1-5.5 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">Study Tracker</span>
    </Link>
  );
}
