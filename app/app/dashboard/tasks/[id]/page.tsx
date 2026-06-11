import Link from "next/link";
import { notFound } from "next/navigation";
import type { MerchantStageNode } from "@prisma/client";
import { requireUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import {
  checkStartWorkItem,
  checkSubmitWorkItem,
  checkSubmitOutsourceResult,
  checkRequestWorkItemChanges,
  checkApproveWorkItem,
  checkCompleteWorkItem,
  checkCancelWorkItem,
  checkAssignWorkItem,
  checkConfirmClientWorkItem,
  canReviewWorkItems,
} from "@/lib/tasks/access";
import { getWorkItemByIdForUser, listAssignableProfiles } from "@/lib/tasks/data";
import { WORK_ITEM_TYPE_LABELS } from "@/lib/tasks/display";
import { aiTaskForTargetNode } from "@/lib/ai-workbench/draft-review";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskFlagBadges,
} from "@/components/tasks/work-item-badges";
import { WorkItemActions } from "@/components/tasks/work-item-actions";
import { OutsourceResultForm } from "@/components/tasks/outsource-result-form";
import { ClientConfirmationForm } from "@/components/tasks/client-confirmation-form";
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

const AI_DRAFT_RISK_REMINDERS = [
  "AI 输出不是事实——逐条核对，删除编造数据。",
  "没有证据的内容必须标「待验证」。",
  "不得保留承诺增长结果的表述。",
  "审核通过后系统不会自动写入业务节点——仍需人工到目标节点编辑页保存。",
];

/** ai_draft_review 专属面板 (TASK-072)：标识 + 目标节点 + 状态指引 + 风险提醒。 */
function AiDraftReviewPanel({
  status,
  merchantId,
  targetNode,
}: {
  status: string;
  merchantId: string | null;
  targetNode: MerchantStageNode | null;
}) {
  const aiTask = aiTaskForTargetNode(targetNode);
  const nodeEditHref =
    merchantId && aiTask ? `/dashboard/merchants/${merchantId}/${aiTask.nodeSegment}` : null;
  const aiWorkbenchHref =
    merchantId && aiTask
      ? `/dashboard/ai-workbench?merchantId=${merchantId}&task=${aiTask.key}`
      : "/dashboard/ai-workbench";

  return (
    <section className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-sm dark:border-indigo-800 dark:bg-indigo-950/30">
      <h2 className="font-medium text-indigo-800 dark:text-indigo-300">
        AI 草稿审核任务
        {aiTask && (
          <span className="ml-2 text-xs font-normal">
            AI 任务：{aiTask.label} → 目标节点：{aiTask.nodeLabel}
          </span>
        )}
      </h2>

      {status === "submitted" && (
        <p className="mt-1 text-xs text-indigo-800/90 dark:text-indigo-300/90">
          当前待审核：由 operator（或 admin）对照下方「AI 草稿正文」与验收标准，决定「审核通过」或「退回修改」。
        </p>
      )}
      {status === "changes_requested" && (
        <p className="mt-1 text-xs text-indigo-800/90 dark:text-indigo-300/90">
          已退回：请按「审核意见」回{" "}
          <Link href={aiWorkbenchHref} className="underline underline-offset-2">
            AI 工作台
          </Link>{" "}
          重新生成 / 修改后再提交一条新的审核任务。
        </p>
      )}
      {status === "approved" && (
        <div className="mt-1 text-xs text-indigo-800/90 dark:text-indigo-300/90">
          <p>
            审核已通过。下一步：复制下方审核后的草稿正文，到对应业务节点<strong>手动保存</strong>
            （系统不会自动写入）。保存后可回任务详情「标记完成」。
          </p>
          {nodeEditHref && (
            <Link
              href={nodeEditHref}
              className="mt-2 inline-flex rounded border border-indigo-400 bg-white px-3 py-1.5 font-medium text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              去「{aiTask?.nodeLabel}」编辑页手动保存 →
            </Link>
          )}
        </div>
      )}
      {status === "completed" && (
        <p className="mt-1 text-xs text-indigo-800/90 dark:text-indigo-300/90">
          已完成：草稿经人工审核并已由人工保存处理。
        </p>
      )}

      <ul className="mt-2 list-disc pl-5 text-[11px] text-indigo-800/80 dark:text-indigo-300/80 [&>li]:mt-0.5">
        {AI_DRAFT_RISK_REMINDERS.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}

const OUTSOURCE_REMINDERS = [
  "你只能看到分配给你的任务。",
  "你不能查看完整客户经营数据。",
  "你提交的是待审核成果，不代表最终通过。",
  "审核员通过后，成果才能进入下一步。",
];

const OUTSOURCE_REVIEW_REMINDERS = [
  "请根据验收标准检查外包成果。",
  "未确认版权 / 素材授权 / 平台风险前，不要通过。",
  "通过不等于发布，也不等于客户确认。",
];

/** outsource_execution 专属面板 (TASK-073)：外包提醒 + 成果提交区 / 审核员验收提示。 */
function OutsourceExecutionPanel({
  workItemId,
  status,
  reviewNote,
  isReviewer,
  showSubmitForm,
}: {
  workItemId: string;
  status: string;
  reviewNote: string | null;
  isReviewer: boolean;
  showSubmitForm: boolean;
}) {
  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/30">
      <h2 className="font-medium text-amber-800 dark:text-amber-300">外包执行任务</h2>
      <ul className="mt-1 list-disc pl-5 text-[11px] text-amber-800/80 dark:text-amber-300/80 [&>li]:mt-0.5">
        {OUTSOURCE_REMINDERS.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      {status === "changes_requested" && (
        <div className="mt-2 rounded border border-rose-300 bg-rose-50 p-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <p className="font-medium">已退回：审核员修改意见</p>
          <p className="mt-0.5 whitespace-pre-wrap">{reviewNote ?? "（未填写意见）"}</p>
          {!showSubmitForm && (
            <p className="mt-1 text-rose-700/80 dark:text-rose-300/80">
              等待外包负责人按意见修改后重新提交。
            </p>
          )}
        </div>
      )}

      {showSubmitForm && <OutsourceResultForm workItemId={workItemId} isResubmit={status === "changes_requested"} />}

      {status === "submitted" && isReviewer && (
        <div className="mt-2 rounded border border-amber-400 bg-white p-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">审核员验收提示</p>
          <ul className="mt-0.5 list-disc pl-5 [&>li]:mt-0.5">
            {OUTSOURCE_REVIEW_REMINDERS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-1">
            成果见下方「外包成果」区块；对照「验收标准」后，在底部操作区选择「审核通过」或「退回修改」（退回必须填写修改意见）。
          </p>
        </div>
      )}
      {status === "submitted" && !isReviewer && (
        <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-300/90">
          成果已提交，等待审核员验收：通过或退回会显示在这里。
        </p>
      )}
      {status === "approved" && (
        <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-300/90">
          成果已审核通过。注意：通过不等于发布、不等于客户确认——后续对外使用 / 客户确认由审核员人工推进；任务由审核员「标记完成」收尾。
        </p>
      )}
      {status === "completed" && (
        <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-300/90">
          任务已完成（成果经人工验收）。
        </p>
      )}
    </section>
  );
}

const CLIENT_CONFIRM_REMINDERS = [
  "请确认当前内容是否可以进入下一步。",
  "确认通过不代表承诺增长结果。",
  "如需修改，请写清楚需要调整的地方。",
];

/** client_confirmation 专属面板 (TASK-074)：客户提醒 + 确认/修改意见表单 + 双方状态指引。 */
function ClientConfirmationPanel({
  workItemId,
  status,
  reviewNote,
  isClientViewer,
  isReviewer,
  showClientForm,
}: {
  workItemId: string;
  status: string;
  reviewNote: string | null;
  isClientViewer: boolean;
  isReviewer: boolean;
  showClientForm: boolean;
}) {
  return (
    <section className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
      <h2 className="font-medium text-emerald-800 dark:text-emerald-300">客户确认事项</h2>
      <ul className="mt-1 list-disc pl-5 text-[11px] text-emerald-800/80 dark:text-emerald-300/80 [&>li]:mt-0.5">
        {CLIENT_CONFIRM_REMINDERS.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      {/* 审核员侧：未发起前的推进指引 */}
      {isReviewer && ["not_started", "assigned", "in_progress"].includes(status) && (
        <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-300/90">
          尚未发起确认：先在下方分配客户负责人（merchant），再用底部操作区「开始任务」→「提交审核」把事项推送给客户——提交后客户登录即可看到并确认。
        </p>
      )}

      {/* 客户操作区（merchant 本人 + submitted） */}
      {showClientForm && <ClientConfirmationForm workItemId={workItemId} />}

      {status === "submitted" && isReviewer && (
        <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-300/90">
          等待客户确认：客户登录后会看到「确认通过 / 提交修改意见」两个操作。
        </p>
      )}

      {status === "changes_requested" && (
        <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="font-medium">客户提出修改意见</p>
          <p className="mt-0.5 whitespace-pre-wrap">{reviewNote ?? "（未填写）"}</p>
          {isClientViewer ? (
            <p className="mt-1">
              修改意见已提交，等待团队处理。不需要重复提交——团队调整后会重新发起确认；有疑问请联系负责人。
            </p>
          ) : (
            <p className="mt-1">
              需要内部处理：按意见调整后可创建后续任务（外包修改 / AI 草稿 / 通用跟进，去「新建任务」），处理完成后由审核员重新发起确认或「标记完成」。系统不会自动创建后续任务。
            </p>
          )}
        </div>
      )}

      {status === "approved" && (
        <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-300/90">
          {isClientViewer
            ? "已确认 ✓ 团队将进入下一步。确认通过不代表承诺增长结果。"
            : "客户已确认 ✓ 可人工「标记完成」收尾，或在「新建任务」创建下一步任务。系统不会自动发布、不会自动完成、不会自动创建后续任务。"}
        </p>
      )}
      {status === "completed" && (
        <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-300/90">
          该确认事项已由团队处理完成。
        </p>
      )}
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
  const assignOptions = checks.assign.allowed
    ? await listAssignableProfiles(user, wi.type)
    : [];
  const isClientViewer = user.role === "merchant";

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
        <TaskStatusBadge status={wi.status} type={wi.type} />
        <TaskPriorityBadge priority={wi.priority} />
        <TaskFlagBadges
          requiresAi={wi.requiresAi}
          requiresOutsource={wi.requiresOutsource}
          requiresClientConfirmation={wi.requiresClientConfirmation}
        />
      </div>

      {wi.type === "ai_draft_review" && (
        <AiDraftReviewPanel
          status={wi.status}
          merchantId={wi.merchant?.id ?? null}
          targetNode={wi.targetNode}
        />
      )}

      {wi.type === "outsource_execution" && (
        <OutsourceExecutionPanel
          workItemId={wi.id}
          status={wi.status}
          reviewNote={wi.reviewNote}
          isReviewer={canReviewWorkItems(user.role)}
          showSubmitForm={checkSubmitOutsourceResult(user, accessFields).allowed}
        />
      )}

      {wi.type === "client_confirmation" && (
        <ClientConfirmationPanel
          workItemId={wi.id}
          status={wi.status}
          reviewNote={wi.reviewNote}
          isClientViewer={isClientViewer}
          isReviewer={canReviewWorkItems(user.role)}
          showClientForm={checkConfirmClientWorkItem(user, accessFields).allowed}
        />
      )}

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
        <TextBlock
          label={wi.type === "client_confirmation" ? "说明 / 背景" : "说明"}
          value={wi.description}
        />
        <TextBlock
          label={wi.type === "client_confirmation" ? "需要确认的内容" : "要求"}
          value={wi.requirements}
        />
        <TextBlock
          label={wi.type === "client_confirmation" ? "确认后的下一步" : "验收标准"}
          value={wi.acceptanceCriteria}
        />
        <TextBlock
          label={
            wi.type === "ai_draft_review"
              ? "AI 草稿正文（人工粘贴 / 修改后，待人工审核）"
              : wi.type === "outsource_execution"
                ? "外包成果（成果说明 / 链接 / 备注，仅保留最新提交）"
                : "成果摘要（执行人提交）"
          }
          value={wi.resultSummary}
        />
        <TextBlock
          label={
            wi.type === "client_confirmation" ? "客户反馈 / 修改意见" : "审核意见 / 退回原因"
          }
          value={wi.reviewNote}
        />
      </div>

      {/* TASK-074: merchant（客户）不显示内部操作区——客户操作在上方确认面板；
          内部 7 个动作对 merchant 全部拒绝（服务端仍校验），不向客户展示内部术语。 */}
      {!isClientViewer && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">可执行操作</h2>
          <WorkItemActions workItemId={wi.id} checks={checks} assignOptions={assignOptions} />
          <p className="mt-2 text-[11px] text-zinc-400">
            所有状态变化均为人工触发：审核通过不等于自动完成，任务流转不改变商家节点状态；AI 不参与审批。
          </p>
        </section>
      )}
    </main>
  );
}
