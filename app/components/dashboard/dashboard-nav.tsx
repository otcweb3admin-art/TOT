import Link from "next/link";
import type { Role } from "@prisma/client";
import { logout } from "@/lib/auth/actions";
import { roleLabel } from "@/lib/merchants/role-access";

const NAV_ITEMS = [
  { href: "/dashboard", label: "首页" },
  { href: "/dashboard/tasks", label: "任务中心" },
  { href: "/dashboard/merchants", label: "商家管理" },
  { href: "/dashboard/merchants/intake", label: "接入向导" },
  { href: "/dashboard/handoffs", label: "交接中心" },
  { href: "/dashboard/ai-workbench", label: "AI 工作台" },
  { href: "/dashboard/launch-readiness", label: "上线检查" },
];

// TASK-070: per-role nav visibility — DISPLAY filtering only (server-side permission
// enforcement is unchanged; direct URLs still go through the existing guards).
// merchant / ai_worker see only the workspace home (merchant reaches 我的事项 from the
// workspace card); executor gets home + 任务中心 (TASK-071); collector adds the
// intake-related entries; operator / admin see everything.
const NAV_HREFS_BY_ROLE: Record<Role, string[]> = {
  merchant: ["/dashboard"],
  ai_worker: ["/dashboard"],
  executor: ["/dashboard", "/dashboard/tasks"],
  collector: [
    "/dashboard",
    "/dashboard/tasks",
    "/dashboard/merchants",
    "/dashboard/merchants/intake",
  ],
  operator: NAV_ITEMS.map((i) => i.href),
  admin: NAV_ITEMS.map((i) => i.href),
};

/**
 * Unified top navigation for all /dashboard pages (TASK-063, product usability shell).
 * Server component, rendered by the dashboard layout — every page gets the same way back,
 * no island pages. UI only; no permission logic here.
 */
export function DashboardNav({
  email,
  role,
  workspaceName,
}: {
  email: string;
  role: Role;
  workspaceName: string;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/dashboard" className="text-base font-semibold">
          TOT
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {NAV_ITEMS.filter((item) => NAV_HREFS_BY_ROLE[role].includes(item.href)).map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span className="hidden sm:inline">{email}</span>
          <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {workspaceName}
          </span>
          <span className="hidden rounded bg-zinc-100 px-2 py-0.5 sm:inline dark:bg-zinc-800">
            {roleLabel(role)}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded border border-zinc-300 px-2.5 py-1 dark:border-zinc-700"
            >
              登出
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
