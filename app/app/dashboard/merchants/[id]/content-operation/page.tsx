import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { ContentOperationForm } from "./content-operation-form";

export const dynamic = "force-dynamic";

export default async function ContentOperationPage({
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

  const mc = merchant.materialCollection;
  const co = merchant.contentOperation;
  const defaults = co
    ? {
        status: co.status,
        contentPositioningSummary: co.contentPositioningSummary ?? "",
        contentPillarSummary: co.contentPillarSummary ?? "",
        contentRatioSummary: co.contentRatioSummary ?? "",
        publishingFrequencySummary: co.publishingFrequencySummary ?? "",
        toneStyleSummary: co.toneStyleSummary ?? "",
        contentBoundarySummary: co.contentBoundarySummary ?? "",
        first30DayPlanSummary: co.first30DayPlanSummary ?? "",
        contentRiskSummary: co.contentRiskSummary ?? "",
        notes: co.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {co ? "编辑 TB-004 内容运营" : "创建 TB-004 内容运营"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小内容运营方案（本阶段非完整 TB-004 / 非内容发布 / 非 AI 文案）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream input — read-only TB-003 material collection context for planning. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · TB-003 素材采集）
        </h2>
        {mc ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("状态", mc.status)}
            {ctx("素材分类", mc.materialCategorySummary)}
            {ctx("素材缺口", mc.materialGapSummary)}
            {ctx("拍摄场景", mc.shootingSceneSummary)}
            {ctx("采集优先级", mc.collectionPrioritySummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">
            暂无 TB-003 素材采集方案（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/materials`}
              className="underline underline-offset-2"
            >
              创建素材采集方案
            </Link>
            ）。仍可创建内容运营方案，但不会引用素材采集。
          </p>
        )}
      </section>

      <ContentOperationForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
