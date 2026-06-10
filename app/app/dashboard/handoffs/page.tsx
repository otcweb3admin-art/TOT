import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listRecentHandoffs } from "@/lib/dashboard/home";
import { StatusBadge } from "@/components/merchants/status-badge";
import { formatDateTime } from "@/components/merchants/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { btnPrimary, btnSecondary } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Handoff Center V0 (TASK-063): a read-only overview of recent stage handoffs across all
 * merchants the current user may see (reuses the merchant-level visibility filter).
 * Receive / cancel actions live in each merchant's workspace — this page links there.
 * NO approval / reject / lock here (Phase D not implemented).
 */
export default async function HandoffCenterPage() {
  const user = await requireUser();
  const handoffs = await listRecentHandoffs(user);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title="交接中心"
        description="查看商家节点交接记录。接收 / 取消操作在对应商家的工作台进行；交接不代表自动审批，是否进入下一环节仍需人工确认。"
        actions={
          <Link href="/dashboard" className={btnSecondary}>
            ← 首页
          </Link>
        }
      />

      {handoffs.length === 0 ? (
        <EmptyState
          title="当前暂无交接记录"
          hints={["交接通常在商家工作台底部的「环节交接记录」区块创建。"]}
          actions={
            <>
              <Link href="/dashboard/merchants" className={btnPrimary}>
                打开商家列表
              </Link>
              <Link href="/dashboard" className={btnSecondary}>
                返回首页
              </Link>
            </>
          }
        />
      ) : (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-medium text-zinc-500">
            最近交接（最多 20 条）
          </h2>
          <ul className="flex flex-col">
            {handoffs.map((h) => (
              <li
                key={h.id}
                className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/merchants/${h.merchant.id}/workspace`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {h.merchant.name}
                  </Link>
                  <span className="text-sm text-zinc-500">
                    {h.fromNode} → {h.toNode}
                  </span>
                  <StatusBadge status={h.status} />
                  <span className="text-[11px] text-zinc-400">
                    接收角色 {h.receivedByRole}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {h.summary ?? "（无摘要）"}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  提交 {h.submittedBy?.email ?? "—"} · {formatDateTime(h.createdAt)}
                  {h.receivedAt
                    ? ` · 接收 ${h.receivedBy?.email ?? ""} ${formatDateTime(h.receivedAt)}`
                    : ""}
                  　·
                  <Link
                    href={`/dashboard/merchants/${h.merchant.id}/workspace`}
                    className="underline underline-offset-2"
                  >
                    去工作台处理
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
