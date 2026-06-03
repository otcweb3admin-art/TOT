"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantNinetyDayGrowthPlan,
  type SaveGrowthPlanState,
} from "@/lib/merchants/growth-plan-actions";

export type GrowthPlanDefaults = {
  status: string;
  planPeriodLabel: string;
  stageGoalSummary: string;
  roadmapSummary: string;
  platformPrioritySummary: string;
  contentRouteSummary: string;
  leadConversionRouteSummary: string;
  kpiSummary: string;
  riskSummary: string;
  cycleJudgmentSummary: string;
  nextStageDirectionSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof GrowthPlanDefaults; label: string }[] = [
  { name: "stageGoalSummary", label: "三阶段目标" },
  { name: "roadmapSummary", label: "90 天路线图" },
  { name: "platformPrioritySummary", label: "平台优先级" },
  { name: "contentRouteSummary", label: "内容路线" },
  { name: "leadConversionRouteSummary", label: "引流路线" },
  { name: "kpiSummary", label: "KPI 摘要" },
  { name: "riskSummary", label: "风险摘要" },
  { name: "cycleJudgmentSummary", label: "周期判断" },
  { name: "nextStageDirectionSummary", label: "下一阶段方向" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: GrowthPlanDefaults = {
  status: "draft",
  planPeriodLabel: "",
  stageGoalSummary: "",
  roadmapSummary: "",
  platformPrioritySummary: "",
  contentRouteSummary: "",
  leadConversionRouteSummary: "",
  kpiSummary: "",
  riskSummary: "",
  cycleJudgmentSummary: "",
  nextStageDirectionSummary: "",
  notes: "",
};

export function GrowthPlanForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: GrowthPlanDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantNinetyDayGrowthPlan.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveGrowthPlanState,
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

      <label className="flex flex-col gap-1 text-sm">
        计划周期（planPeriodLabel）
        <input
          name="planPeriodLabel"
          type="text"
          defaultValue={d.planPeriodLabel}
          placeholder="如 2026 Q3 或 第 1 个 90 天"
          className={inputCls}
        />
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
          {pending ? "保存中…" : "保存 90 天增长计划"}
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
