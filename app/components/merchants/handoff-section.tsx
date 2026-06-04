import Link from "next/link";
import type { Role } from "@prisma/client";
import { StatusBadge } from "@/components/merchants/status-badge";
import { formatDateTime } from "@/components/merchants/format";
import { HandoffButton } from "@/components/merchants/handoff-button";
import {
  markMerchantStageHandoffReceived,
  cancelMerchantStageHandoff,
} from "@/lib/merchants/handoff-actions";
import {
  canReceiveHandoff,
  canCancelHandoff,
} from "@/lib/merchants/role-access";

export type HandoffRow = {
  id: string;
  fromNode: string;
  toNode: string;
  status: string;
  receivedByRole: Role;
  summary: string | null;
  gapSummary: string | null;
  riskSummary: string | null;
  evidenceSummary: string | null;
  createdAt: Date;
  receivedAt: Date | null;
  submittedByProfileId: string;
  submittedBy: { email: string } | null;
  receivedBy: { email: string } | null;
};

/**
 * Workspace "stage handoff records" block (Phase C / TASK-057). READ-ONLY display of
 * recorded node-to-node handoffs + manual receive/cancel buttons (record-only; NO
 * auto-approval / auto-transition / node-status change). Receive shows only for the target
 * role or admin; cancel only for the submitter or admin, and only while status=submitted.
 */
export function HandoffSection({
  merchantId,
  handoffs,
  currentProfileId,
  currentRole,
}: {
  merchantId: string;
  handoffs: HandoffRow[];
  currentProfileId: string;
  currentRole: Role;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-500">环节交接记录</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            交接记录不代表自动审批。是否进入下一环节仍需人工确认；不会自动改变节点状态。
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchantId}/handoffs/new`}
          className="shrink-0 rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
        >
          + 新增交接记录
        </Link>
      </div>

      {handoffs.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">暂无交接记录。</p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {handoffs.map((h) => {
            const canReceive =
              h.status === "submitted" && canReceiveHandoff(currentRole, h.receivedByRole);
            const canCancel =
              h.status === "submitted" &&
              canCancelHandoff({ profileId: currentProfileId, role: currentRole }, h.submittedByProfileId);
            return (
              <li
                key={h.id}
                className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {h.fromNode} → {h.toNode}
                  </span>
                  <StatusBadge status={h.status} />
                  <span className="text-[11px] text-zinc-400">
                    接收角色 {h.receivedByRole}
                  </span>
                </div>
                <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <dt className="text-zinc-400">提交人</dt>
                  <dd>{h.submittedBy?.email ?? "—"}</dd>
                  <dt className="text-zinc-400">摘要</dt>
                  <dd>{h.summary ?? "—"}</dd>
                  <dt className="text-zinc-400">缺口</dt>
                  <dd>{h.gapSummary ?? "—"}</dd>
                  <dt className="text-zinc-400">风险</dt>
                  <dd>{h.riskSummary ?? "—"}</dd>
                  <dt className="text-zinc-400">证据</dt>
                  <dd>{h.evidenceSummary ?? "—"}</dd>
                  <dt className="text-zinc-400">创建时间</dt>
                  <dd>{formatDateTime(h.createdAt)}</dd>
                  {h.receivedAt && (
                    <>
                      <dt className="text-zinc-400">接收</dt>
                      <dd>
                        {formatDateTime(h.receivedAt)}
                        {h.receivedBy?.email ? ` · ${h.receivedBy.email}` : ""}
                      </dd>
                    </>
                  )}
                </dl>
                {(canReceive || canCancel) && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {canReceive && (
                      <HandoffButton
                        handoffId={h.id}
                        action={markMerchantStageHandoffReceived}
                        label="标记已接收"
                        tone="primary"
                      />
                    )}
                    {canCancel && (
                      <HandoffButton
                        handoffId={h.id}
                        action={cancelMerchantStageHandoff}
                        label="取消"
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
