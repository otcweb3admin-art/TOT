import Link from "next/link";
import type { Role } from "@prisma/client";
import { StatusBadge } from "@/components/merchants/status-badge";
import { formatDateTime } from "@/components/merchants/format";
import type { WorkspaceNode } from "@/lib/merchants/workspace";
import {
  getNodeRoleUI,
  nextActionLabel,
} from "@/lib/merchants/workspace-role-ui";
import {
  getRoleNodeAccess,
  nodeKeyForWorkspace,
} from "@/lib/merchants/role-access";

/**
 * One row in the merchant workspace node-overview list. Phase A (TASK-055) added the unified
 * role/handoff DISPLAY; Phase B (TASK-056) adds the current user's NODE access view (can edit
 * / read-only + reason) and a read-only action label when not editable. Display only — the
 * real write protection lives in the Server Actions (assertMerchantNodeWriteAccess).
 */
export function WorkspaceNodeRow({
  node,
  role,
}: {
  node: WorkspaceNode;
  role: Role;
}) {
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

  const ui = getNodeRoleUI(node.key);
  const nodeKey = nodeKeyForWorkspace(node.key);
  const access = nodeKey ? getRoleNodeAccess(role, nodeKey) : null;
  const canEdit = access ? access.canEdit : true;

  return (
    <li className="flex items-start justify-between gap-4 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {ui && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {ui.nodeCode}
            </span>
          )}
          <span className="font-medium">{node.label}</span>
          <StatusBadge status={node.status} />
          {access && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                access.canEdit
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {access.canEdit ? "可编辑" : "只读（建议）"}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{node.hint}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{meta}</p>

        {ui && (
          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <dt className="text-zinc-400">建议负责</dt>
            <dd>{ui.ownerRoleLabel}</dd>
            {access && (
              <>
                <dt className="text-zinc-400">你的权限</dt>
                <dd>{access.reason}</dd>
              </>
            )}
            <dt className="text-zinc-400">上游输入</dt>
            <dd>{ui.upstreamLabel}</dd>
            <dt className="text-zinc-400">证据提示</dt>
            <dd>{ui.evidenceHint}</dd>
            <dt className="text-zinc-400">下一步</dt>
            <dd>{nextActionLabel(node.status)}</dd>
            <dt className="text-zinc-400">交接</dt>
            <dd>{ui.handoffHint}</dd>
            <dt className="text-zinc-400">人工确认</dt>
            <dd>{ui.humanReviewHint}</dd>
          </dl>
        )}
      </div>
      <Link
        href={node.href}
        className="shrink-0 rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
      >
        {canEdit ? node.actionLabel : "查看详情"}
      </Link>
    </li>
  );
}
