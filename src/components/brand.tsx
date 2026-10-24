import Link from "next/link";

/** A progress arc: the mark says "study progress" without decoration. */
export function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
      <span aria-hidden className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
          <path d="M8 2.5a5.5 5.5 0 1 1-5.5 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Study Tracker</span>
    </Link>
  );
}
