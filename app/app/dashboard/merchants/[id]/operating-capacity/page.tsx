import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import {
  OperatingCapacityForm,
  type OperatingCapacityDefaults,
} from "./operating-capacity-form";

export const dynamic = "force-dynamic";

/**
 * Operating Capacity intake (P2-016 / TASK-045): collect a merchant's Fulfillment +
 * Organization承接能力 as SUMMARY facts — the two OHC "weak-signal" organs. Reuses
 * getMerchantById(id, user) so the merchant-level permission filter applies (404 if no
 * access). Read-only intake — no scoring, no AI, no decision.
 */
export default async function EditOperatingCapacityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params;
  const merchant = await getMerchantById(id, user);
  if (!merchant) notFound();

  const oc = merchant.operatingCapacity;
  const defaults: OperatingCapacityDefaults | null = oc
    ? {
        status: oc.status,
        responseProcessSummary: oc.responseProcessSummary ?? "",
        responseTimeSummary: oc.responseTimeSummary ?? "",
        bookingProcessSummary: oc.bookingProcessSummary ?? "",
        serviceCapacitySummary: oc.serviceCapacitySummary ?? "",
        peakHourHandlingSummary: oc.peakHourHandlingSummary ?? "",
        fulfillmentRiskSummary: oc.fulfillmentRiskSummary ?? "",
        customerExperienceRiskSummary: oc.customerExperienceRiskSummary ?? "",
        ownerDependencySummary: oc.ownerDependencySummary ?? "",
        staffRoleSummary: oc.staffRoleSummary ?? "",
        delegationReadinessSummary: oc.delegationReadinessSummary ?? "",
        standardProcessSummary: oc.standardProcessSummary ?? "",
        trainingReadinessSummary: oc.trainingReadinessSummary ?? "",
        organizationRiskSummary: oc.organizationRiskSummary ?? "",
        operatingConstraintSummary: oc.operatingConstraintSummary ?? "",
        notes: oc.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {oc ? "编辑经营承接能力" : "创建经营承接能力"}
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 履约与组织承接能力采集
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}/workspace`}
          className="shrink-0 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 工作台
        </Link>
      </header>

      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
        本页用于采集商家履约与组织承接能力，不代表系统自动决策。所有字段可选，仅作经营事实记录（非评分、非 AI、非完整履约/组织系统）。
      </p>

      <OperatingCapacityForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
