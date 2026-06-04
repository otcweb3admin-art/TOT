import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { IntakeGuidanceBox } from "@/components/merchants/intake-guidance-box";
import { getMerchantById } from "@/lib/merchants/data";
import { buildMerchantWorkspace } from "@/lib/merchants/workspace";
import { buildOperatingHealthSnapshot } from "@/lib/merchants/operating-health";
import { StatusBadge } from "@/components/merchants/status-badge";
import { AssetSummaryGrid } from "@/components/merchants/asset-summary-grid";
import { formatDateTime } from "@/components/merchants/format";
import { WorkspaceNodeRow } from "@/components/merchants/workspace-node-row";
import { OperatingHealthSummary } from "@/components/merchants/operating-health-summary";

export const dynamic = "force-dynamic";

/**
 * Merchant Workspace / Node Overview (TASK-041): a read-only operations navigation view of
 * one merchant's full asset chain (Profile → Baseline → TB-001~TB-008) — status, quick
 * entry, first-missing node, and a RULE-based next-step hint. Reuses getMerchantById(id,
 * user) so the TASK-040 merchant-level permission filter applies (unauthorized -> 404).
 */
export default async function MerchantWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params; // Next 16: params is async
  const merchant = await getMerchantById(id, user); // permission-filtered
  if (!merchant) notFound();

  const ws = buildMerchantWorkspace(merchant);
  const ohs = buildOperatingHealthSnapshot(merchant);
  const base = `/dashboard/merchants/${merchant.id}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{merchant.name}</h1>
          <p className="text-sm text-zinc-500">商家工作台 · 节点总览</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={base}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            详情
          </Link>
          <Link
            href="/dashboard/merchants"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            列表
          </Link>
        </div>
      </header>

      <IntakeGuidanceBox
        title="工作台使用说明（试点护栏）"
        items={[
          "工作台用于查看链路状态与经营健康缺口；『下一步』是规则提示，不是系统决策。",
          "真实商家试点请按《Pilot Intake Playbook V1》执行（docs/project/pilot-merchant-intake-playbook-v1.md）。",
          "当前为 Conditional Go（见 Pilot Readiness Gate V1）：未授权放量 / 投流 / MVS，由人决策。",
        ]}
      />

      {/* 基础信息 */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">基础信息</h2>
        <AssetSummaryGrid
          rows={[
            { label: "状态", value: <StatusBadge status={merchant.status} /> },
            { label: "行业", value: merchant.industry },
            {
              label: "城市 / 国家",
              value: [merchant.city, merchant.country].filter(Boolean).join(" / "),
            },
            { label: "负责人", value: merchant.owner?.email },
            { label: "创建人", value: merchant.createdBy?.email },
            { label: "创建时间", value: formatDateTime(merchant.createdAt) },
          ]}
        />
      </section>

      {/* 下一步规则提示（非 AI、非业务决策） */}
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            下一步建议（规则提示）
          </h2>
          <span className="text-xs text-amber-700 dark:text-amber-400">
            {ws.completedCount}/{ws.totalCount} 节点已创建
          </span>
        </div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          {ws.nextStep.title}
        </p>
        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
          {ws.nextStep.detail}
        </p>
      </section>

      {/* 经营健康摘要（五器官，只读规则映射） */}
      <OperatingHealthSummary
        snapshot={ohs}
        capacityHref={`${base}/operating-capacity`}
        capacityExists={!!merchant.operatingCapacity}
      />

      {/* 节点链路总览 */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-1 text-sm font-medium text-zinc-500">
          资产链路（Profile → Baseline → TB-001~TB-008）
        </h2>
        <p className="mb-2 text-xs text-zinc-400">
          状态：missing 未创建 · draft 草稿 · completed 已完成 · archived 已归档。点击右侧按钮进入对应节点。
        </p>
        <ul className="flex flex-col">
          {ws.nodes.map((node) => (
            <WorkspaceNodeRow key={node.key} node={node} />
          ))}
        </ul>
      </section>
    </main>
  );
}
