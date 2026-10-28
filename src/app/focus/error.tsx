"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FocusError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md w-full space-y-4 rounded-2xl border border-destructive/20 bg-card p-6 shadow-xl">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Unable to Load Focus Room
        </h2>
        <p className="text-xs text-muted-foreground break-words font-mono bg-muted/40 p-2.5 rounded-lg text-left">
          {error.message || "An unexpected client error occurred."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => reset()} className="cursor-pointer">
            <RefreshCw className="size-3.5 mr-1.5" /> Try Again
          </Button>
          <Button asChild size="sm" className="cursor-pointer">
            <Link href="/dashboard">
              <ArrowLeft className="size-3.5 mr-1.5" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
