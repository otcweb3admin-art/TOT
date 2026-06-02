import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "./login-form";

// Always render at request time (reads session); never prerender at build.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already-logged-in users skip the login page.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">TOT 登录</h1>
        <p className="mb-6 text-sm text-zinc-500">P1 Auth Foundation</p>
        <LoginForm />
      </div>
    </main>
  );
}
