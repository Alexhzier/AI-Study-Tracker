export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted" />)}
      </div>
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  );
}
