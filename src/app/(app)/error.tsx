"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {error.message || "We couldn't load this page."} Check your connection and try again.
      </p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
