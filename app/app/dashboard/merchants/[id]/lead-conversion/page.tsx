import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { LeadConversionForm } from "./lead-conversion-form";

export const dynamic = "force-dynamic";

export default async function LeadConversionPage({
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

  const co = merchant.contentOperation;
  const lp = merchant.livePlanning;
  const lc = merchant.leadConversion;
  const defaults = lc
    ? {
        status: lc.status,
        trafficPathSummary: lc.trafficPathSummary ?? "",
        conversionPathSummary: lc.conversionPathSummary ?? "",
        privateDomainSummary: lc.privateDomainSummary ?? "",
        campaignIdeaSummary: lc.campaignIdeaSummary ?? "",
        googleMapsActionSummary: lc.googleMapsActionSummary ?? "",
        paidTrafficTestSummary: lc.paidTrafficTestSummary ?? "",
        p001ReadinessSummary: lc.p001ReadinessSummary ?? "",
        thirtyDayActionSummary: lc.thirtyDayActionSummary ?? "",
        conversionRiskSummary: lc.conversionRiskSummary ?? "",
        attributionMethodSummary: lc.attributionMethodSummary ?? "",
        notes: lc.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {lc ? "编辑 TB-006 引流转化" : "创建 TB-006 引流转化"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小引流转化方案（本阶段非完整 TB-006 / 非投放 / 非 ROI 计算 / 非 MVS）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream input #1 — read-only TB-004 content operation context. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · TB-004 内容运营）
        </h2>
        {co ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("状态", co.status)}
            {ctx("内容定位", co.contentPositioningSummary)}
            {ctx("发布频率", co.publishingFrequencySummary)}
            {ctx("前 30 天计划", co.first30DayPlanSummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">
            暂无 TB-004 内容运营方案（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/content-operation`}
              className="underline underline-offset-2"
            >
              创建内容运营方案
            </Link>
            ）。仍可创建引流转化方案，但不会引用内容运营。
          </p>
        )}
      </section>

      {/* Upstream input #2 — read-only TB-005 live planning context. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · TB-005 直播规划）
        </h2>
        {lp ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("状态", lp.status)}
            {ctx("直播平台", lp.platformSummary)}
            {ctx("直播目标", lp.liveGoalSummary)}
            {ctx("直播频率", lp.liveFrequencySummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">
            暂无 TB-005 直播规划方案（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/live-planning`}
              className="underline underline-offset-2"
            >
              创建直播规划方案
            </Link>
            ）。仍可创建引流转化方案，但不会引用直播规划。
          </p>
        )}
      </section>

      <LeadConversionForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
