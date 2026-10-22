"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/actions/auth";

type Props = {
  mode: "login" | "register";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  notice?: string;
};

const field =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export function AuthForm({ mode, action, notice }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isLogin ? "Sign in to Study Tracker" : "Create your account"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isLogin ? "Pick up where you left off." : "Start logging study time in under a minute."}
      </p>

      {notice && (
        <p role="status" className="mt-5 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          {notice}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={field} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password" name="password" type="password" required minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"} className={field}
          />
          {!isLogin && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit" disabled={pending}
          className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-foreground underline underline-offset-4">
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
