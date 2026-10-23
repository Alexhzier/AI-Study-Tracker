"use client";

import { useActionState } from "react";
import { startDemo } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function DemoButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [state, action, pending] = useActionState(startDemo, undefined);
  return (
    <form action={action}>
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? "Setting up your demo…" : "Try the live demo"}
      </Button>
      {state?.error && <p role="alert" className="mt-2 text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
