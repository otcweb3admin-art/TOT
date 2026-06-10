import { requireUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import { findDemoMerchant } from "@/lib/dashboard/home";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";

// Always render at request time (reads session); never prerender at build.
export const dynamic = "force-dynamic";

/**
 * Dashboard Home (TASK-063, product usability shell): after login the user immediately
 * sees WHO they are, WHAT role they have, WHAT state the system is in, and WHERE to start
 * (quick actions + onboarding paths). UI/entry layer only — no business logic change.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const demo = await findDemoMerchant(user);
  const demoWorkspaceHref = demo ? `/dashboard/merchants/${demo.id}/workspace` : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">首页</h1>
        <p className="text-sm text-zinc-500">登录成功 — 从这里开始操作。</p>
      </header>

      {/* 我是谁 / 系统状态 */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">当前账号</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-zinc-500">用户</dt>
            <dd>{user.email}</dd>
            <dt className="text-zinc-500">角色</dt>
            <dd>{roleLabel(user.role)}</dd>
            <dt className="text-zinc-500">状态</dt>
            <dd>{user.status}</dd>
          </dl>
          <p className="mt-2 text-[11px] text-zinc-400">
            角色决定你能编辑哪些节点（工作台节点上会显示「可编辑 / 只读」）。
          </p>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            系统当前状态
          </h2>
          <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200">
            真实试点前准备态（Pre-Pilot Ready / Conditional Go）
          </p>
          <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
            系统能力已封板就绪，目前只有 DEMO 演示数据，尚无真实商家。真实商家接入需负责人授权，
            先线下采集（Field Pack）再录入。当前不投流、不放量、不承诺增长结果。
          </p>
        </section>
      </div>

      {/* 快捷入口 */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">快捷入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            href="/dashboard/merchants/new"
            title="新建商家"
            description="录入一个商家主体（真实商家需负责人授权后再建）"
          />
          <QuickActionCard
            href="/dashboard/merchants"
            title="商家列表"
            description="查看全部可见商家，进入详情或工作台"
          />
          {demoWorkspaceHref ? (
            <QuickActionCard
              href={demoWorkspaceHref}
              title="打开 DEMO 商家"
              description={`${demo!.name} · 演示 / 培训用，非真实商家`}
            />
          ) : (
            <QuickActionCard
              href="/dashboard/merchants"
              title="DEMO 暂未创建"
              description="请在项目目录运行 npm run seed:demo 生成演示商家"
            />
          )}
          <QuickActionCard
            href="/dashboard/handoffs"
            title="交接中心"
            description="查看商家节点交接记录（接收 / 取消在各商家工作台）"
          />
          <QuickActionCard
            href="/dashboard/ai-workbench"
            title="AI 工作台"
            description="V0 占位 · AI 仅生成草稿辅助，人工确认后才录入"
          />
          <QuickActionCard
            href="#getting-started"
            title="新手指南"
            description="不知道从哪开始？看下面的操作路径"
          />
        </div>
      </section>

      {/* 新手操作路径 */}
      <OnboardingGuide demoWorkspaceHref={demoWorkspaceHref} />
    </main>
  );
}
