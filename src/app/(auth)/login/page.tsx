import type { Metadata } from "next";
import { login } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ check_email?: string }> }) {
  const { check_email } = await searchParams;
  return (
    <AuthForm
      mode="login"
      action={login}
      notice={check_email ? "Check your inbox to confirm your email, then sign in." : undefined}
    />
  );
}
