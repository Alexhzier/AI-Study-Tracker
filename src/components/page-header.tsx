export function PageHeader({
  title, description, eyebrow, action,
}: { title: string; description?: string; eyebrow?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 lg:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-title font-semibold">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
