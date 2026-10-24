import { PageContainer } from "@/components/page-container";

export default function Loading() {
  return (
    <PageContainer size="wide">
      <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
        <div className="h-7 w-40 rounded-md bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-56 rounded-lg bg-muted" />
          <div className="h-56 rounded-lg bg-muted" />
        </div>
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
      </div>
    </PageContainer>
  );
}
