import type { Metadata } from "next";
import { login } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { DemoButton } from "@/components/demo-button";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ check_email?: string }> }) {
  const { check_email } = await searchParams;
  return (
    <div className="w-full max-w-sm">
      <AuthForm
        mode="login"
        action={login}
        notice={check_email ? "Check your inbox to confirm your email, then sign in." : undefined}
      />
      <div className="mt-8 border-t pt-6">
        <p className="mb-3 text-sm text-muted-foreground">Just looking around? No account needed.</p>
        <DemoButton variant="outline" />
      </div>
    </div>
  );
}
