import Link from "next/link";
import type { Role } from "@prisma/client";
import { logout } from "@/lib/auth/actions";
import { roleLabel } from "@/lib/merchants/role-access";

const NAV_ITEMS = [
  { href: "/dashboard", label: "首页" },
  { href: "/dashboard/merchants", label: "商家管理" },
  { href: "/dashboard/merchants/intake", label: "接入向导" },
  { href: "/dashboard/handoffs", label: "交接中心" },
  { href: "/dashboard/ai-workbench", label: "AI 工作台" },
  { href: "/dashboard/launch-readiness", label: "上线检查" },
];

/**
 * Unified top navigation for all /dashboard pages (TASK-063, product usability shell).
 * Server component, rendered by the dashboard layout — every page gets the same way back,
 * no island pages. UI only; no permission logic here.
 */
export function DashboardNav({
  email,
  role,
}: {
  email: string;
  role: Role;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/dashboard" className="text-base font-semibold">
          TOT
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
          <span className="hidden sm:inline">{email}</span>
          <span className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
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
