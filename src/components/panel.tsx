import { cn } from "@/lib/utils";

/** Surface recipe: clean card with crisp borders and ambient micro-elevation. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-border/80 bg-card shadow-xs transition-shadow", className)} {...props} />;
}

export function PanelHeader({
  title, id, action, className,
}: { title: string; id?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-12 items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5 sm:px-5", className)}>
      <h2 id={id} className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      {action}
    </div>
  );
}
