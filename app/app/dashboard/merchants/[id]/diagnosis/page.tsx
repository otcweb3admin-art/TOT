import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { IntakeGuidanceBox } from "@/components/merchants/intake-guidance-box";
import { getMerchantById } from "@/lib/merchants/data";
import { DiagnosisForm } from "./diagnosis-form";

export const dynamic = "force-dynamic";

export default async function DiagnosisPage({
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

  const diag = merchant.diagnosis;
  const defaults = diag
    ? {
        status: diag.status,
        diagnosisSummary: diag.diagnosisSummary ?? "",
        growthProblemSummary: diag.growthProblemSummary ?? "",
        opportunitySummary: diag.opportunitySummary ?? "",
        riskSummary: diag.riskSummary ?? "",
        recommendedNextStep: diag.recommendedNextStep ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {diag ? "编辑 TB-001 诊断" : "创建 TB-001 诊断"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · TB-001 商家诊断（人工填写，缺证据写「待验证」）· 保存后将返回商家详情页
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream inputs — read-only context the human reads while diagnosing. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · 供诊断参考）
        </h2>

        <div className="mb-1 font-medium">商家画像</div>
        {merchant.profile ? (
          <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("行业细分", merchant.profile.industryDetail)}
            {ctx("目标客群", merchant.profile.targetCustomerSummary)}
            {ctx("核心卖点", merchant.profile.coreOfferSummary)}
            {ctx("增长目标", merchant.profile.growthGoalSummary)}
            {ctx("执行限制", merchant.profile.executionLimitSummary)}
          </dl>
        ) : (
          <p className="mb-4 text-zinc-500">
            暂无画像（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/profile`}
              className="underline underline-offset-2"
            >
              创建画像
            </Link>
            ）。
          </p>
        )}

        <div className="mb-1 font-medium">增长前基准</div>
        {merchant.baseline ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("统计周期", merchant.baseline.periodLabel)}
            {ctx("月营业额", merchant.baseline.monthlyRevenue?.toString())}
            {ctx("月客户数", merchant.baseline.monthlyCustomerCount?.toString())}
            {ctx("月成交数", merchant.baseline.monthlyConversionCount?.toString())}
            {ctx("数据可信度", merchant.baseline.dataConfidence)}
          </dl>
        ) : (
          <p className="text-zinc-500">
            暂无基准（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/baseline`}
              className="underline underline-offset-2"
            >
              创建基准
            </Link>
            ）。
          </p>
        )}
      </section>

      <IntakeGuidanceBox
        tone="evidence"
        title="诊断纪律"
        items={[
          "诊断不是『建议合集』，而是根因判断。",
          "诊断要基于 Profile / Baseline / Operating Capacity 与访谈事实。",
          "缺证据时只能写『待验证』，不要写确定结论。",
        ]}
      />
      <DiagnosisForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
