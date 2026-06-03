import Link from "next/link";
import { StatusBadge } from "@/components/merchants/status-badge";
import { formatDateTime } from "@/components/merchants/format";
import type { WorkspaceNode } from "@/lib/merchants/workspace";

/**
 * One row in the merchant workspace node-overview list: node name + status pill, a short
 * purpose hint, updated time / upstream-presence, and a quick create/edit entry (existing
 * node URL). Presentation-only (TASK-041) — no business logic.
 */
export function WorkspaceNodeRow({ node }: { node: WorkspaceNode }) {
  const meta = [
    node.updatedAt ? `更新于 ${formatDateTime(node.updatedAt)}` : "尚未创建",
    node.upstreamReferenced === null
      ? null
      : node.upstreamReferenced
        ? "已引用上游"
        : "未引用上游",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center justify-between gap-4 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{node.label}</span>
          <StatusBadge status={node.status} />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{node.hint}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{meta}</p>
      </div>
      <Link
        href={node.href}
        className="shrink-0 rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
      >
        {node.actionLabel}
      </Link>
    </li>
  );
}
