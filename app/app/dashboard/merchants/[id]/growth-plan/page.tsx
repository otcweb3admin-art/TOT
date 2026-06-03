import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { GrowthPlanForm } from "./growth-plan-form";

export const dynamic = "force-dynamic";

export default async function GrowthPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params;
  const merchant = await getMerchantById(id);
  if (!merchant) notFound();

  const ctx = (label: string, value: ReactNode) => (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );

  const base = merchant.baseline;
  const diag = merchant.diagnosis;
  const lc = merchant.leadConversion;
  const dr = merchant.dataReview;
  const gp = merchant.ninetyDayGrowthPlan;
  const defaults = gp
    ? {
        status: gp.status,
        planPeriodLabel: gp.planPeriodLabel ?? "",
        stageGoalSummary: gp.stageGoalSummary ?? "",
        roadmapSummary: gp.roadmapSummary ?? "",
        platformPrioritySummary: gp.platformPrioritySummary ?? "",
        contentRouteSummary: gp.contentRouteSummary ?? "",
        leadConversionRouteSummary: gp.leadConversionRouteSummary ?? "",
        kpiSummary: gp.kpiSummary ?? "",
        riskSummary: gp.riskSummary ?? "",
        cycleJudgmentSummary: gp.cycleJudgmentSummary ?? "",
        nextStageDirectionSummary: gp.nextStageDirectionSummary ?? "",
        notes: gp.notes ?? "",
      }
    : null;

  const upstream = "rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700";
  const grid = "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {gp ? "编辑 TB-008 90天增长计划" : "创建 TB-008 90天增长计划"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小 90 天增长计划摘要（本阶段非完整 TB-008 / 非执行系统 / 非自动 KPI / 非 AI）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream #1 — read-only baseline metric context. */}
      <section className={upstream}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">上游输入（只读 · 增长前基准）</h2>
        {base ? (
          <dl className={grid}>
            {ctx("统计周期", base.periodLabel)}
            {ctx("月营业额", base.monthlyRevenue?.toString())}
            {ctx("月客户数", base.monthlyCustomerCount?.toString())}
            {ctx("数据可信度", base.dataConfidence)}
          </dl>
        ) : (
          <p className="text-zinc-500">暂无基准数据。</p>
        )}
      </section>

      {/* Upstream #2 — read-only TB-001 diagnosis context. */}
      <section className={upstream}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">上游输入（只读 · TB-001 诊断）</h2>
        {diag ? (
          <dl className={grid}>
            {ctx("状态", diag.status)}
            {ctx("诊断摘要", diag.diagnosisSummary)}
            {ctx("增长问题", diag.growthProblemSummary)}
            {ctx("建议下一步", diag.recommendedNextStep)}
          </dl>
        ) : (
          <p className="text-zinc-500">暂无 TB-001 诊断。</p>
        )}
      </section>

      {/* Upstream #3 — read-only TB-006 lead conversion context. */}
      <section className={upstream}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">上游输入（只读 · TB-006 引流转化）</h2>
        {lc ? (
          <dl className={grid}>
            {ctx("状态", lc.status)}
            {ctx("引流路径", lc.trafficPathSummary)}
            {ctx("转化路径", lc.conversionPathSummary)}
            {ctx("归因方式", lc.attributionMethodSummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">暂无 TB-006 引流转化方案。</p>
        )}
      </section>

      {/* Upstream #4 — read-only TB-007 data review context. */}
      <section className={upstream}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">上游输入（只读 · TB-007 数据复盘）</h2>
        {dr ? (
          <dl className={grid}>
            {ctx("状态", dr.status)}
            {ctx("复盘周期", dr.reviewPeriodLabel)}
            {ctx("目标完成度", dr.goalCompletionSummary)}
            {ctx("策略判断", dr.strategyJudgmentSummary)}
            {ctx("优化建议", dr.optimizationSuggestionSummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">暂无 TB-007 数据复盘。</p>
        )}
      </section>

      <GrowthPlanForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
