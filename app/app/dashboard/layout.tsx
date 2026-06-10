import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/dal";
import { getRoleHome } from "@/lib/dashboard/role-home";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

/**
 * Dashboard segment layout (TASK-063, product usability shell): every /dashboard page gets
 * the same top navigation — users can always get back to 首页 / 商家管理 / 交接中心 /
 * AI 工作台. Auth: requireUser() (cached per request; proxy already guards /dashboard).
 * UI shell only — no permission / business logic.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <DashboardNav
        email={user.email}
        role={user.role}
        workspaceName={getRoleHome(user.role).workspaceName}
      />
      {children}
    </div>
  );
}
