"use client";

import { useActionState } from "react";
import {
  confirmClientWorkItem,
  requestClientWorkItemChanges,
  type WorkItemActionState,
} from "@/lib/tasks/actions";

/**
 * 客户确认操作区 (TASK-074)：两个动作——「确认通过」与「提交修改意见」（意见必填）。
 * 仅在服务端判定（merchant 本人 + submitted）允许时渲染；action 内部再次校验。
 * 确认通过 ≠ 发布 ≠ 承诺增长结果；后续推进由团队人工进行。
 */
export function ClientConfirmationForm({ workItemId }: { workItemId: string }) {
  const confirmBound = confirmClientWorkItem.bind(null, workItemId);
  const changesBound = requestClientWorkItemChanges.bind(null, workItemId);
  const [confirmState, confirmAction, confirmPending] = useActionState<
    WorkItemActionState,
    FormData
  >(confirmBound, undefined);
  const [changesState, changesAction, changesPending] = useActionState<
    WorkItemActionState,
    FormData
  >(changesBound, undefined);

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <form
        action={confirmAction}
        className="flex flex-col gap-2 rounded border border-emerald-300 bg-white p-3 dark:border-emerald-800 dark:bg-zinc-950"
      >
        <h3 className="text-sm font-medium">内容没问题，可以进入下一步</h3>
        <button
          type="submit"
          disabled={confirmPending}
          className="w-fit rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {confirmPending ? "提交中…" : "确认通过"}
        </button>
        {confirmState?.error ? (
          <p className="text-xs text-red-600" role="alert">
            {confirmState.error}
          </p>
        ) : null}
        <p className="text-[11px] text-zinc-400">
          确认通过后团队才会进入下一步；确认通过不代表承诺增长结果。
        </p>
      </form>

      <form
        action={changesAction}
        className="flex flex-col gap-2 rounded border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <h3 className="text-sm font-medium">需要调整？告诉我们改什么</h3>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          修改意见 *（请写清楚需要调整的地方）
          <textarea
            name="clientNote"
            rows={3}
            required
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={changesPending}
          className="w-fit rounded border border-zinc-400 px-4 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-600"
        >
          {changesPending ? "提交中…" : "提交修改意见"}
        </button>
        {changesState?.error ? (
          <p className="text-xs text-red-600" role="alert">
            {changesState.error}
          </p>
        ) : null}
        <p className="text-[11px] text-zinc-400">提交后团队会按你的意见调整，再请你确认。</p>
      </form>
    </div>
  );
}
