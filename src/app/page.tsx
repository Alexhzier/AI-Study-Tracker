import { redirect } from "next/navigation";

// Middleware sends signed-in users to /dashboard and everyone else to /login.
export default function Home() {
  redirect("/dashboard");
}
