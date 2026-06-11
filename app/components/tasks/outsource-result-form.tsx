"use client";

import { useActionState } from "react";
import { submitOutsourceResult, type WorkItemActionState } from "@/lib/tasks/actions";

/**
 * 外包成果提交表单 (TASK-073)：成果说明（必填）+ 成果链接（可选，云盘/图片/视频/文档等
 * 外部交付地址）+ 补充备注（可选）。提交 → submitted 进入审核员待审核队列；通过前不得对外
 * 发布或交付客户。V1 无版本模型：重新提交会覆盖上一次内容（仅保留最新提交）。
 * 仅在服务端判定 checkSubmitOutsourceResult 允许时渲染；action 内部会再次校验。
 */
export function OutsourceResultForm({
  workItemId,
  isResubmit,
}: {
  workItemId: string;
  isResubmit: boolean;
}) {
  const bound = submitOutsourceResult.bind(null, workItemId);
  const [state, formAction, pending] = useActionState<WorkItemActionState, FormData>(
    bound,
    undefined,
  );
  const INPUT = "rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <h3 className="text-sm font-medium">
        {isResubmit ? "按退回意见修改后重新提交成果" : "提交成果"}
      </h3>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        成果说明 *（交付了什么、完成到什么程度）
        <textarea name="resultDescription" rows={4} required className={INPUT} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        成果链接（可选：云盘 / 图片 / 视频 / 文档等外部交付地址）
        <input name="resultLink" type="url" placeholder="https://…" className={INPUT} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        补充备注（可选：使用说明、注意事项等）
        <textarea name="resultNote" rows={2} className={INPUT} />
      </label>
      {state?.error ? (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "提交中…" : "提交成果，等待审核"}
        </button>
      </div>
      <p className="text-[11px] text-zinc-400">
        提交后，该任务会进入审核员的待审核队列。审核通过前，请不要对外发布或交付客户。
        {isResubmit && " 注意：V1 仅保留最新提交内容，重新提交会覆盖上一次的成果说明。"}
      </p>
    </form>
  );
}
