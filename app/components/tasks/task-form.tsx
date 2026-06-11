"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createWorkItem, type WorkItemActionState } from "@/lib/tasks/actions";

// TASK-073: 选择外包执行任务时的创建提示（保护客户数据 + 证据纪律）。
const OUTSOURCE_CREATE_GUIDANCE = [
  "必须填写清楚「要求」——外包只看得到本任务，不会看到商家上下文。",
  "必须填写「验收标准」——审核员按此验收，外包按此交付。",
  "不得在任务中暴露完整客户经营数据（只给完成本任务必需的信息）。",
  "如附 AI 参考 brief，只放人工审核后的内容。",
  "不要把未审核的 AI 草稿直接给外包。",
];

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
  // TASK-073: 控制 类型/负责人角色/需要外包，选外包执行任务时给提示并自动建议 executor。
  const [type, setType] = useState(typeOptions[0]?.value ?? "");
  const [assignedRole, setAssignedRole] = useState("");
  const [requiresOutsource, setRequiresOutsource] = useState(false);
  const isOutsource = type === "outsource_execution";
  const onTypeChange = (v: string) => {
    setType(v);
    if (v === "outsource_execution") {
      setRequiresOutsource(true);
      if (assignedRole === "") setAssignedRole("executor");
    }
  };

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
        <select
          name="type"
          required
          className={INPUT_CLS}
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {isOutsource && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="font-medium">创建外包执行任务前请确认：</p>
          <ul className="mt-1 list-disc pl-5 [&>li]:mt-0.5">
            {OUTSOURCE_CREATE_GUIDANCE.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

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
          <select
            name="assignedRole"
            className={INPUT_CLS}
            value={assignedRole}
            onChange={(e) => setAssignedRole(e.target.value)}
          >
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
          <input
            type="checkbox"
            name="requiresOutsource"
            checked={requiresOutsource}
            onChange={(e) => setRequiresOutsource(e.target.checked)}
          />{" "}
          需要外包
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
