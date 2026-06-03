import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

// Always render at request time (reads session); never prerender at build.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Server-side guard (defense in depth alongside the proxy): redirects to /login if unauthenticated.
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">TOT 后台</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            登出
          </button>
        </form>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500">当前用户</dt>
          <dd>{user.email}</dd>
          <dt className="text-zinc-500">角色 (role)</dt>
          <dd>{user.role}</dd>
          <dt className="text-zinc-500">状态 (status)</dt>
          <dd>{user.status}</dd>
          <dt className="text-zinc-500">阶段</dt>
          <dd>P1 Auth Foundation</dd>
        </dl>
      </section>

      <nav className="flex flex-col gap-3 text-sm">
        <p className="text-zinc-500">
          业务模块 · 当前阶段：<span className="font-medium text-zinc-700 dark:text-zinc-300">P2 Merchant Intake Foundation</span>
        </p>
        <Link
          href="/dashboard/merchants"
          className="inline-flex w-fit items-center rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          商家列表 / Merchants →
        </Link>
        <ul className="list-disc pl-5 text-zinc-500">
          <li>流程 / 审批（待建）</li>
          <li>数据 / 复盘（待建）</li>
        </ul>
      </nav>
    </main>
  );
}
