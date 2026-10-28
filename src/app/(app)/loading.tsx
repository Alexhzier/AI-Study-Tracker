import { PageContainer } from "@/components/page-container";

export default function Loading() {
  return (
    <PageContainer size="wide">
      <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
        <div className="space-y-2">
          <div className="h-3.5 w-28 rounded-md bg-muted/70" />
          <div className="h-7 w-44 rounded-lg bg-muted/80" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-56 rounded-xl border border-border/50 bg-card/70" />
          <div className="h-56 rounded-xl border border-border/50 bg-card/70" />
        </div>
        <div className="h-20 rounded-xl border border-border/50 bg-card/70" />
        <div className="h-64 rounded-xl border border-border/50 bg-card/70" />
      </div>
    </PageContainer>
  );
}
