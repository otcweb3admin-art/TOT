import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { DataReviewForm } from "./data-review-form";

export const dynamic = "force-dynamic";

export default async function DataReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params;
  const merchant = await getMerchantById(id, user);
  if (!merchant) notFound();

  const ctx = (label: string, value: ReactNode) => (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );

  const base = merchant.baseline;
  const co = merchant.contentOperation;
  const lp = merchant.livePlanning;
  const lc = merchant.leadConversion;
  const dr = merchant.dataReview;
  const defaults = dr
    ? {
        status: dr.status,
        reviewPeriodLabel: dr.reviewPeriodLabel ?? "",
        goalCompletionSummary: dr.goalCompletionSummary ?? "",
        contentEffectSummary: dr.contentEffectSummary ?? "",
        liveEffectSummary: dr.liveEffectSummary ?? "",
        leadConversionEffectSummary: dr.leadConversionEffectSummary ?? "",
        realBusinessDataSummary: dr.realBusinessDataSummary ?? "",
        problemDiagnosisSummary: dr.problemDiagnosisSummary ?? "",
        optimizationSuggestionSummary: dr.optimizationSuggestionSummary ?? "",
        strategyJudgmentSummary: dr.strategyJudgmentSummary ?? "",
        attributionObservationSummary: dr.attributionObservationSummary ?? "",
        reviewRiskSummary: dr.reviewRiskSummary ?? "",
        notes: dr.notes ?? "",
      }
    : null;

  const upstream = "rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700";
  const grid = "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {dr ? "编辑 TB-007 数据复盘" : "创建 TB-007 数据复盘"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小数据复盘摘要（本阶段非完整 TB-007 / 非 MVS / 非自动归因 / 非报表）
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
          <p className="text-zinc-500">
            暂无基准数据（建议先
            <Link href={`/dashboard/merchants/${merchant.id}/baseline`} className="underline underline-offset-2">创建基准</Link>
            ）。
          </p>
        )}
      </section>

      {/* Upstream #2 — read-only TB-004 content operation context. */}
      <section className={upstream}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">上游输入（只读 · TB-004 内容运营）</h2>
        {co ? (
          <dl className={grid}>
            {ctx("状态", co.status)}
            {ctx("内容定位", co.contentPositioningSummary)}
            {ctx("发布频率", co.publishingFrequencySummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">暂无 TB-004 内容运营方案。</p>
        )}
      </section>

      {/* Upstream #3 — read-only TB-005 live planning context. */}
      <section className={upstream}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">上游输入（只读 · TB-005 直播规划）</h2>
        {lp ? (
          <dl className={grid}>
            {ctx("状态", lp.status)}
            {ctx("直播平台", lp.platformSummary)}
            {ctx("直播目标", lp.liveGoalSummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">暂无 TB-005 直播规划方案。</p>
        )}
      </section>

      {/* Upstream #4 — read-only TB-006 lead conversion context. */}
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

      <DataReviewForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
