import type { Metadata } from "next";
import { register } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthForm mode="register" action={register} />;
}
