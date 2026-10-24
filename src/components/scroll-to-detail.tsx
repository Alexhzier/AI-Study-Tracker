"use client";

import { useEffect, useRef } from "react";

/**
 * The selected-day panel sits beside the calendar on wide screens and below it on small ones.
 * When the selection changes on a small screen, bring the panel into view. Never on first load,
 * and never on wide screens where it's already visible.
 */
export function ScrollToDetail({
  trigger, label, className, children,
}: { trigger: string; label: string; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const previous = useRef(trigger);

  useEffect(() => {
    if (previous.current === trigger) return;
    previous.current = trigger;
    if (!window.matchMedia("(max-width: 1279px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [trigger]);

  return (
    <aside ref={ref} aria-label={label} className={`scroll-mb-24 ${className ?? ""}`}>
      {children}
    </aside>
  );
}
