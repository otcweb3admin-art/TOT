import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { LivePlanningForm } from "./live-planning-form";

export const dynamic = "force-dynamic";

export default async function LivePlanningPage({
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
  const defaults = lp
    ? {
        status: lp.status,
        feasibilitySummary: lp.feasibilitySummary ?? "",
        platformSummary: lp.platformSummary ?? "",
        liveGoalSummary: lp.liveGoalSummary ?? "",
        liveFormatSummary: lp.liveFormatSummary ?? "",
        liveTopicSummary: lp.liveTopicSummary ?? "",
        liveFrequencySummary: lp.liveFrequencySummary ?? "",
        hostPeopleRequirementSummary: lp.hostPeopleRequirementSummary ?? "",
        readinessSummary: lp.readinessSummary ?? "",
        liveRiskSummary: lp.liveRiskSummary ?? "",
        notes: lp.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {lp ? "编辑 TB-005 直播规划" : "创建 TB-005 直播规划"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小直播规划方案（本阶段非完整 TB-005 / 非直播系统 / 非排期 / 非平台 API）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream input — read-only TB-004 content operation context for planning. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · TB-004 内容运营）
        </h2>
        {co ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("状态", co.status)}
            {ctx("内容定位", co.contentPositioningSummary)}
            {ctx("栏目方向", co.contentPillarSummary)}
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
            ）。仍可创建直播规划方案，但不会引用内容运营。
          </p>
        )}
      </section>

      <LivePlanningForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
