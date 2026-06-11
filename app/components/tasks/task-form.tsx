"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createWorkItem, type WorkItemActionState } from "@/lib/tasks/actions";

// 创建任务表单 (TASK-071)。类型选项由服务端按角色过滤后传入（collector 只见
// collector_intake）；服务端 action 再次校验，不依赖前端过滤。V1 仅支持负责人角色
// （assignedRole）；具体负责人由 operator/admin 在任务详情页分配。

export type TaskTypeOption = { value: string; label: string };
export type MerchantOption = { id: string; name: string };

const ROLE_OPTIONS = [
  { value: "", label: "（暂不指定）" },
  { value: "collector", label: "collector（采集员）" },
  { value: "operator", label: "operator（人工审核）" },
  { value: "executor", label: "executor（外包 / 执行）" },
  { value: "merchant", label: "merchant（客户确认）" },
  { value: "admin", label: "admin（平台管理）" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "normal", label: "普通" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

const INPUT_CLS = "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function TaskForm({
  merchants,
  typeOptions,
}: {
  merchants: MerchantOption[];
  typeOptions: TaskTypeOption[];
}) {
  const [state, action, pending] = useActionState<WorkItemActionState, FormData>(
    createWorkItem,
    undefined,
  );

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        所属商家（可选）
        <select name="merchantId" className={INPUT_CLS} defaultValue="">
          <option value="">（不关联商家）</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        任务类型 *
        <select name="type" required className={INPUT_CLS}>
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        标题 *
        <input name="title" type="text" required className={INPUT_CLS} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        说明
        <textarea name="description" rows={2} className={INPUT_CLS} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        要求
        <textarea name="requirements" rows={3} className={INPUT_CLS} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        验收标准
        <textarea
          name="acceptanceCriteria"
          rows={3}
          className={INPUT_CLS}
          placeholder="按什么标准算合格——审核时以此为准"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          负责人角色
          <select name="assignedRole" className={INPUT_CLS} defaultValue="">
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          优先级
          <select name="priority" className={INPUT_CLS} defaultValue="normal">
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="requiresAi" /> 需要 AI 辅助
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="requiresOutsource" /> 需要外包
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="requiresClientConfirmation" /> 需要客户确认
        </label>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        截止时间（可选）
        <input name="dueAt" type="datetime-local" className={INPUT_CLS} />
      </label>

      <p className="text-[11px] text-zinc-400">
        具体负责人（profile）在创建后由 operator / admin 在任务详情页分配；AI 仅辅助草稿，任务的审核与完成均由人工确认。
      </p>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "创建中…" : "创建任务"}
        </button>
        <Link
          href="/dashboard/tasks"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
