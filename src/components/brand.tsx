import Image from "next/image";
import Link from "next/link";

/** Study Tracker official brand mark and title. */
export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-secondary/60"
    >
      <span
        aria-hidden
        className="relative grid size-10 place-items-center overflow-hidden rounded-xl bg-[#0d1417] shadow-md ring-1 ring-emerald-500/30 transition-transform group-hover:scale-105"
      >
        <Image
          src="/logo-icon.png"
          alt="Study Tracker Logo"
          width={40}
          height={40}
          className="size-full object-contain p-0.5"
          priority
        />
      </span>
      <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
        Study Tracker
      </span>
    </Link>
  );
}
