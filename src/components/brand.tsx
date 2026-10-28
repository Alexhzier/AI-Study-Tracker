import Image from "next/image";
import Link from "next/link";

/** Study Tracker official brand mark and title. */
export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/60"
    >
      <span
        aria-hidden
        className="relative grid size-7 place-items-center overflow-hidden rounded-lg bg-[#0f171b] shadow-xs ring-1 ring-emerald-500/25 transition-transform group-hover:scale-105"
      >
        <Image
          src="/logo-icon.png"
          alt="Study Tracker Logo"
          width={28}
          height={28}
          className="size-full object-contain"
          priority
        />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Study Tracker
      </span>
    </Link>
  );
}
