import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { MaterialForm } from "./material-form";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({
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

  const setup = merchant.accountSetup;
  const mc = merchant.materialCollection;
  const defaults = mc
    ? {
        status: mc.status,
        materialCategorySummary: mc.materialCategorySummary ?? "",
        materialGapSummary: mc.materialGapSummary ?? "",
        shootingSceneSummary: mc.shootingSceneSummary ?? "",
        peopleMaterialSummary: mc.peopleMaterialSummary ?? "",
        productServiceMaterialSummary: mc.productServiceMaterialSummary ?? "",
        trustMaterialSummary: mc.trustMaterialSummary ?? "",
        brandStoryMaterialSummary: mc.brandStoryMaterialSummary ?? "",
        collectionPrioritySummary: mc.collectionPrioritySummary ?? "",
        collectionRiskSummary: mc.collectionRiskSummary ?? "",
        notes: mc.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {mc ? "编辑 TB-003 素材采集" : "创建 TB-003 素材采集"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小素材采集方案（本阶段非完整 TB-003 / 非文件上传 / 非素材库）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream input — read-only TB-002 account setup context for the human planning. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · TB-002 账号搭建）
        </h2>
        {setup ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("状态", setup.status)}
            {ctx("平台计划", setup.platformPlanSummary)}
            {ctx("账号定位", setup.accountPositioningSummary)}
            {ctx("视觉方向", setup.visualDirectionSummary)}
            {ctx("人设方向", setup.personaDirectionSummary)}
          </dl>
        ) : (
          <p className="text-zinc-500">
            暂无 TB-002 账号搭建方案（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/account-setup`}
              className="underline underline-offset-2"
            >
              创建账号搭建方案
            </Link>
            ）。仍可创建素材采集方案，但不会引用账号搭建。
          </p>
        )}
      </section>

      <MaterialForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
