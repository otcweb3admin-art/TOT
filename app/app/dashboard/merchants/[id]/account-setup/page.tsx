import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { AccountSetupForm } from "./account-setup-form";

export const dynamic = "force-dynamic";

export default async function AccountSetupPage({
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

  const diag = merchant.diagnosis;
  const s = merchant.accountSetup;
  const defaults = s
    ? {
        status: s.status,
        platformPlanSummary: s.platformPlanSummary ?? "",
        accountPositioningSummary: s.accountPositioningSummary ?? "",
        namingDirection: s.namingDirection ?? "",
        bioDirection: s.bioDirection ?? "",
        visualDirectionSummary: s.visualDirectionSummary ?? "",
        personaDirectionSummary: s.personaDirectionSummary ?? "",
        googleMapsDirectionSummary: s.googleMapsDirectionSummary ?? "",
        contactChannelSummary: s.contactChannelSummary ?? "",
        setupRiskSummary: s.setupRiskSummary ?? "",
        notes: s.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {s ? "编辑 TB-002 账号搭建" : "创建 TB-002 账号搭建"}（最小）
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 人工填写最小账号搭建方案（本阶段非完整 TB-002 / 非真实建号 / 非 API 对接）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      {/* Upstream input — read-only TB-001 diagnosis context for the human planning. */}
      <section className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          上游输入（只读 · TB-001 诊断）
        </h2>
        {diag ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {ctx("状态", diag.status)}
            {ctx("诊断摘要", diag.diagnosisSummary)}
            {ctx("增长问题", diag.growthProblemSummary)}
            {ctx("机会点", diag.opportunitySummary)}
            {ctx("建议下一步", diag.recommendedNextStep)}
          </dl>
        ) : (
          <p className="text-zinc-500">
            暂无 TB-001 诊断（建议先
            <Link
              href={`/dashboard/merchants/${merchant.id}/diagnosis`}
              className="underline underline-offset-2"
            >
              创建诊断
            </Link>
            ）。仍可创建账号搭建方案，但不会引用诊断。
          </p>
        )}
      </section>

      <AccountSetupForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
