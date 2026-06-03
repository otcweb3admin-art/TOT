"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantLivePlanning,
  type SaveLivePlanningState,
} from "@/lib/merchants/live-planning-actions";

export type LivePlanningDefaults = {
  status: string;
  feasibilitySummary: string;
  platformSummary: string;
  liveGoalSummary: string;
  liveFormatSummary: string;
  liveTopicSummary: string;
  liveFrequencySummary: string;
  hostPeopleRequirementSummary: string;
  readinessSummary: string;
  liveRiskSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof LivePlanningDefaults; label: string }[] = [
  { name: "feasibilitySummary", label: "直播可行性" },
  { name: "platformSummary", label: "直播平台" },
  { name: "liveGoalSummary", label: "直播目标" },
  { name: "liveFormatSummary", label: "直播形式" },
  { name: "liveTopicSummary", label: "直播主题" },
  { name: "liveFrequencySummary", label: "直播频率" },
  { name: "hostPeopleRequirementSummary", label: "出镜 / 人员要求" },
  { name: "readinessSummary", label: "执行准备度" },
  { name: "liveRiskSummary", label: "直播风险" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: LivePlanningDefaults = {
  status: "draft",
  feasibilitySummary: "",
  platformSummary: "",
  liveGoalSummary: "",
  liveFormatSummary: "",
  liveTopicSummary: "",
  liveFrequencySummary: "",
  hostPeopleRequirementSummary: "",
  readinessSummary: "",
  liveRiskSummary: "",
  notes: "",
};

export function LivePlanningForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: LivePlanningDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantLivePlanning.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveLivePlanningState,
    FormData
  >(boundAction, undefined);

  const inputCls =
    "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        状态（status）
        <select name="status" defaultValue={d.status} className={inputCls}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {TEXT_FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          {f.label}
          <textarea
            name={f.name}
            rows={2}
            defaultValue={d[f.name]}
            className={inputCls}
          />
        </label>
      ))}

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
          {pending ? "保存中…" : "保存直播规划方案"}
        </button>
        <Link
          href={`/dashboard/merchants/${merchantId}`}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
