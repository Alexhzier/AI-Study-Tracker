import { cn } from "@/lib/utils";

/** The one surface recipe: a bordered card. No shadows, one radius. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-lg border bg-card", className)} {...props} />;
}

export function PanelHeader({
  title, id, action, className,
}: { title: string; id?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-12 items-center justify-between gap-3 border-b px-4 py-2", className)}>
      <h2 id={id} className="text-sm font-semibold">{title}</h2>
      {action}
    </div>
  );
}
