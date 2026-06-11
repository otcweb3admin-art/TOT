import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import {
  checkStartWorkItem,
  checkSubmitWorkItem,
  checkRequestWorkItemChanges,
  checkApproveWorkItem,
  checkCompleteWorkItem,
  checkCancelWorkItem,
  checkAssignWorkItem,
} from "@/lib/tasks/access";
import { getWorkItemByIdForUser, listAssignableProfiles } from "@/lib/tasks/data";
import { WORK_ITEM_TYPE_LABELS } from "@/lib/tasks/display";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskFlagBadges,
} from "@/components/tasks/work-item-badges";
import { WorkItemActions } from "@/components/tasks/work-item-actions";
import { formatDateTime } from "@/components/merchants/format";
import { PageHeader } from "@/components/ui/page-header";
import { btnSecondary } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-500">{label}</h2>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {value ?? "（未填写）"}
      </p>
    </section>
  );
}

/**
 * 任务详情 (TASK-071)：字段 + 人员 + 时间线 + 按角色/状态可用的操作。无权访问的任务
 * 与不存在的任务同样 404（可见性 AND 查询，不泄露存在性）。
 */
export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params; // Next 16: params is async
  const wi = await getWorkItemByIdForUser(id, user);
  if (!wi) notFound();

  const accessFields = {
    type: wi.type,
    status: wi.status,
    assignedProfileId: wi.assignedProfileId,
    createdByProfileId: wi.createdByProfileId,
    assignedRole: wi.assignedRole,
  };
  const checks = {
    start: checkStartWorkItem(user, accessFields),
    submit: checkSubmitWorkItem(user, accessFields),
    requestChanges: checkRequestWorkItemChanges(user, accessFields),
    approve: checkApproveWorkItem(user, accessFields),
    complete: checkCompleteWorkItem(user, accessFields),
    cancel: checkCancelWorkItem(user, accessFields),
    assign: checkAssignWorkItem(user, accessFields),
  };
  const assignOptions = checks.assign.allowed ? await listAssignableProfiles(user) : [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title={wi.title}
        description={`类型：${WORK_ITEM_TYPE_LABELS[wi.type]} · 当前角色：${roleLabel(user.role)}`}
        actions={
          <Link href="/dashboard/tasks" className={btnSecondary}>
            ← 任务中心
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={wi.status} />
        <TaskPriorityBadge priority={wi.priority} />
        <TaskFlagBadges
          requiresAi={wi.requiresAi}
          requiresOutsource={wi.requiresOutsource}
          requiresClientConfirmation={wi.requiresClientConfirmation}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">基本信息</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-zinc-500">所属商家</dt>
            <dd>
              {wi.merchant ? (
                <Link
                  href={`/dashboard/merchants/${wi.merchant.id}`}
                  className="underline underline-offset-2"
                >
                  {wi.merchant.name}
                </Link>
              ) : (
                "（未关联商家）"
              )}
            </dd>
            <dt className="text-zinc-500">负责人</dt>
            <dd>
              {wi.assignedProfile
                ? `${wi.assignedProfile.email}（${wi.assignedProfile.role}）`
                : wi.assignedRole
                  ? `${wi.assignedRole}（角色队列，待分配具体负责人）`
                  : "未分配"}
            </dd>
            <dt className="text-zinc-500">创建人</dt>
            <dd>{wi.createdByProfile?.email ?? "—"}</dd>
            <dt className="text-zinc-500">审核人</dt>
            <dd>{wi.reviewerProfile?.email ?? "（尚未审核）"}</dd>
            <dt className="text-zinc-500">截止时间</dt>
            <dd>{wi.dueAt ? formatDateTime(wi.dueAt) : "未设置"}</dd>
            {wi.sourceNode && (
              <>
                <dt className="text-zinc-500">来源节点</dt>
                <dd>{wi.sourceNode}</dd>
              </>
            )}
            {wi.targetNode && (
              <>
                <dt className="text-zinc-500">目标节点</dt>
                <dd>{wi.targetNode}</dd>
              </>
            )}
          </dl>
        </section>

        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">时间线</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-zinc-500">创建</dt>
            <dd>{formatDateTime(wi.createdAt)}</dd>
            <dt className="text-zinc-500">提交审核</dt>
            <dd>{wi.submittedAt ? formatDateTime(wi.submittedAt) : "—"}</dd>
            <dt className="text-zinc-500">审核通过</dt>
            <dd>{wi.approvedAt ? formatDateTime(wi.approvedAt) : "—"}</dd>
            <dt className="text-zinc-500">完成</dt>
            <dd>{wi.completedAt ? formatDateTime(wi.completedAt) : "—"}</dd>
            <dt className="text-zinc-500">取消</dt>
            <dd>{wi.cancelledAt ? formatDateTime(wi.cancelledAt) : "—"}</dd>
            <dt className="text-zinc-500">最近更新</dt>
            <dd>{formatDateTime(wi.updatedAt)}</dd>
          </dl>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextBlock label="说明" value={wi.description} />
        <TextBlock label="要求" value={wi.requirements} />
        <TextBlock label="验收标准" value={wi.acceptanceCriteria} />
        <TextBlock label="成果摘要（执行人提交）" value={wi.resultSummary} />
        <TextBlock label="审核意见 / 退回原因" value={wi.reviewNote} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">可执行操作</h2>
        <WorkItemActions workItemId={wi.id} checks={checks} assignOptions={assignOptions} />
        <p className="mt-2 text-[11px] text-zinc-400">
          所有状态变化均为人工触发：审核通过不等于自动完成，任务流转不改变商家节点状态；AI 不参与审批。
        </p>
      </section>
    </main>
  );
}
