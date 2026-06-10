import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import { findDemoMerchant } from "@/lib/dashboard/home";
import { listMerchants } from "@/lib/merchants/data";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";
import { PageHeader } from "@/components/ui/page-header";

// Always render at request time (reads session); never prerender at build.
export const dynamic = "force-dynamic";

/**
 * Dashboard Home (TASK-063 shell + TASK-066 launch polish): welcome line, identity,
 * system status, a rule-based "today's suggested action", grouped quick entries, and the
 * onboarding paths. UI/entry layer only — no business logic change; suggestions are
 * operational hints, never decisions.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const [demo, merchants] = await Promise.all([
    findDemoMerchant(user),
    listMerchants(user),
  ]);
  const demoWorkspaceHref = demo ? `/dashboard/merchants/${demo.id}/workspace` : null;
  const realCount = merchants.filter((m) => !m.name.startsWith("DEMO_")).length;

  // Rule-based suggestion (display hint only, not a decision).
  const todaySuggestion =
    merchants.length === 0
      ? "还没有任何商家：先运行 npm run seed:demo 生成 DEMO 练习，或打开「商家接入向导」了解录入步骤。"
      : realCount === 0
        ? "当前只有 DEMO：可用 DEMO 练习全流程（工作台 / 五器官 / AI 草稿 / 交接）；真实商家请先线下接触（候选跟进表 + Field Pack），获负责人授权后再录入。"
        : "已有真实商家：建议打开其工作台检查缺口（五器官 / 待补充），继续补录或创建交接；放量、投流仍需负责人确认。";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title={`欢迎回来，${user.email}`}
        status="真实试点前准备态"
        description="TOT 商家增长交付系统 — 从这里开始今天的工作。"
      />

      {/* 我是谁 / 系统状态 */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">当前账号</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-zinc-500">用户</dt>
            <dd className="break-all">{user.email}</dd>
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
            接入真实商家前先用 Field Pack 线下采集，并经负责人授权。当前不投流、不放量、
            不承诺增长结果。详见
            <Link href="/dashboard/launch-readiness" className="underline underline-offset-2">
              上线前检查
            </Link>
            。
          </p>
        </section>
      </div>

      {/* 今日建议动作（规则提示，非决策） */}
      <section className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-medium text-zinc-500">今日建议动作</h2>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{todaySuggestion}</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          以上为规则提示，不代表系统决策；是否合作 / 放量由负责人确认。
        </p>
      </section>

      {/* 快捷入口（分组） */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">商家接入与管理</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            href="/dashboard/merchants/intake"
            title="商家接入向导"
            description="开始接入 / 继续录入商家——按 6 步顺序录入资料"
            hint="第一次录入从这里开始"
          />
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
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">AI 辅助与交接协同</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            href="/dashboard/ai-workbench"
            title="AI 工作台"
            description="选商家 → 生成 Prompt → 人工审核后保存到节点（不自动保存）"
          />
          <QuickActionCard
            href="/dashboard/handoffs"
            title="交接中心"
            description="查看商家节点交接记录（接收 / 取消在各商家工作台）"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">DEMO 学习与上线准备</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            href="/dashboard/launch-readiness"
            title="上线前检查"
            description="接入首家真实商家前的逐项核对清单"
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
