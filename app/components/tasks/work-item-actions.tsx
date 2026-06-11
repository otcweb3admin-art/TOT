"use client";

import { useActionState } from "react";
import {
  startWorkItem,
  submitWorkItem,
  requestWorkItemChanges,
  approveWorkItem,
  completeWorkItem,
  cancelWorkItem,
  assignWorkItem,
  type WorkItemActionState,
} from "@/lib/tasks/actions";

// 任务详情操作区 (TASK-071)。可用性由服务端用 lib/tasks/access 计算后传入（仅控制展示；
// 每个 server action 内部会再次做权限 + 状态校验）。不可用的动作明确显示原因，
// 不出现"按钮消失用户不知道为什么"的情况。

export type ActionAvailability = { allowed: boolean; reason: string };

export type WorkItemActionsProps = {
  workItemId: string;
  checks: {
    start: ActionAvailability;
    submit: ActionAvailability;
    requestChanges: ActionAvailability;
    approve: ActionAvailability;
    complete: ActionAvailability;
    cancel: ActionAvailability;
    assign: ActionAvailability;
  };
  assignOptions: { id: string; email: string; role: string }[];
};

type BoundAction = (
  id: string,
  prev: WorkItemActionState,
  fd: FormData,
) => Promise<WorkItemActionState>;

const BTN =
  "rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900";
const BTN_2 =
  "rounded border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700";
const BTN_DANGER =
  "rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-400";
const TEXTAREA =
  "rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

function ActionForm({
  workItemId,
  action,
  label,
  availability,
  tone = "secondary",
  children,
}: {
  workItemId: string;
  action: BoundAction;
  label: string;
  availability: ActionAvailability;
  tone?: "primary" | "secondary" | "danger";
  children?: React.ReactNode;
}) {
  const bound = action.bind(null, workItemId);
  const [state, formAction, pending] = useActionState<WorkItemActionState, FormData>(
    bound,
    undefined,
  );
  const cls = tone === "primary" ? BTN : tone === "danger" ? BTN_DANGER : BTN_2;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-1.5 rounded border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={!availability.allowed || pending} className={cls}>
          {pending ? "处理中…" : label}
        </button>
        {!availability.allowed && (
          <span className="text-[11px] text-zinc-400">不可用：{availability.reason}</span>
        )}
      </div>
      {availability.allowed && children}
      {state?.error ? (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function WorkItemActions({ workItemId, checks, assignOptions }: WorkItemActionsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ActionForm
        workItemId={workItemId}
        action={startWorkItem}
        label="开始任务"
        availability={checks.start}
        tone="primary"
      />

      <ActionForm
        workItemId={workItemId}
        action={submitWorkItem}
        label="提交审核"
        availability={checks.submit}
        tone="primary"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          成果摘要（可选，给审核人看）
          <textarea name="resultSummary" rows={2} className={TEXTAREA} />
        </label>
      </ActionForm>

      <ActionForm
        workItemId={workItemId}
        action={requestWorkItemChanges}
        label="退回修改"
        availability={checks.requestChanges}
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          修改意见 *（退回必填）
          <textarea name="reviewNote" rows={2} required className={TEXTAREA} />
        </label>
      </ActionForm>

      <ActionForm
        workItemId={workItemId}
        action={approveWorkItem}
        label="审核通过"
        availability={checks.approve}
        tone="primary"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          审核意见（可选）
          <textarea name="reviewNote" rows={2} className={TEXTAREA} />
        </label>
      </ActionForm>

      <ActionForm
        workItemId={workItemId}
        action={completeWorkItem}
        label="标记完成"
        availability={checks.complete}
      />

      <ActionForm
        workItemId={workItemId}
        action={cancelWorkItem}
        label="取消任务"
        availability={checks.cancel}
        tone="danger"
      />

      <ActionForm
        workItemId={workItemId}
        action={assignWorkItem}
        label="分配负责人"
        availability={checks.assign}
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          选择负责人
          <select
            name="assignedProfileId"
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            defaultValue=""
          >
            <option value="">（请选择）</option>
            {assignOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.email}（{p.role}）
              </option>
            ))}
          </select>
        </label>
      </ActionForm>
    </div>
  );
}
