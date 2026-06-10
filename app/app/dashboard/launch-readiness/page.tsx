import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listMerchants } from "@/lib/merchants/data";
import { findDemoMerchant } from "@/lib/dashboard/home";
import { PageHeader } from "@/components/ui/page-header";
import { btnSecondary } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Launch readiness checklist (TASK-066): a read-only pre-pilot check page — part live
 * state (DEMO present / merchant count, via existing permission-filtered queries), part
 * manual checklist. It evaluates nothing automatically beyond display and decides nothing:
 * starting the real pilot stays a human decision.
 */
export default async function LaunchReadinessPage() {
  const user = await requireUser();
  const [demo, merchants] = await Promise.all([
    findDemoMerchant(user),
    listMerchants(user),
  ]);
  const realCount = merchants.filter((m) => !m.name.startsWith("DEMO_")).length;

  const liveChecks = [
    {
      ok: !!demo,
      label: "DEMO 演示商家已存在",
      detail: demo
        ? `${demo.name} — 可用于培训演示`
        : "未找到 DEMO——请在项目目录运行 npm run seed:demo",
    },
    {
      ok: merchants.length > 0,
      label: `当前可见商家 ${merchants.length} 个（其中真实商家 ${realCount} 个）`,
      detail:
        realCount === 0
          ? "尚无真实商家——符合试点前准备态；接入真实商家需负责人授权"
          : "已有真实商家记录，请确认均为授权接入",
    },
  ];

  const manualChecks = [
    { label: "smoke 回归已通过", detail: "在项目目录运行 npm run smoke:p2，应全部 PASS" },
    { label: "Field Pack 现场采集包已打印 / 可用", detail: "docs/project/pilot-intake-field-pack-v1.md" },
    { label: "Outreach Kit 商务沟通包已阅读", detail: "docs/project/first-pilot-merchant-outreach-kit-v1.md" },
    { label: "候选商家跟进表已建立", detail: "docs/project/first-pilot-merchant-prospect-tracker-v1.md" },
    { label: "账号与角色清楚（谁是 collector / operator / executor / admin）", detail: "docs/project/internal-role-account-setup-guide-v1.md" },
    { label: "全员知道：不承诺增长结果", detail: "试点是共同验证，不是结果承诺" },
    { label: "全员知道：AI 只是草稿，人工审核后才保存", detail: "AI 不自动决策、不直接写入业务节点" },
    { label: "全员知道：先 Field Pack 采集，再录入系统；不知道写「待补充」，不编数据", detail: "见商家接入向导" },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title="上线前检查"
        status="真实试点前准备态"
        description="接入首家真实商家前逐项核对。本页只做提醒，不做自动放行——是否启动试点由负责人决定。"
        actions={
          <Link href="/dashboard" className={btnSecondary}>
            ← 首页
          </Link>
        }
      />

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">系统状态（实时）</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {liveChecks.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-sm">
              <span className={c.ok ? "text-emerald-600" : "text-amber-600"}>
                {c.ok ? "✓" : "！"}
              </span>
              <span>
                <span className="font-medium">{c.label}</span>
                <span className="block text-xs text-zinc-500">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">人工核对清单（逐项确认）</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {manualChecks.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-sm">
              <span className="text-zinc-400">☐</span>
              <span>
                <span className="font-medium">{c.label}</span>
                <span className="block text-xs text-zinc-500">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <p className="font-medium">启动条件提醒（Conditional Go）</p>
        <p className="mt-1">
          负责人明确授权 · 只接 1 家 · 先线下采集再录入 · 基线与归因先行 · 承接达标前不引流 ·
          不投流不放量不承诺增长。满足后即可按「商家接入向导」开始首家真实商家录入。
        </p>
      </section>
    </main>
  );
}
