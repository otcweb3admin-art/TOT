"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantDataReview,
  type SaveDataReviewState,
} from "@/lib/merchants/data-review-actions";

export type DataReviewDefaults = {
  status: string;
  reviewPeriodLabel: string;
  goalCompletionSummary: string;
  contentEffectSummary: string;
  liveEffectSummary: string;
  leadConversionEffectSummary: string;
  realBusinessDataSummary: string;
  problemDiagnosisSummary: string;
  optimizationSuggestionSummary: string;
  strategyJudgmentSummary: string;
  attributionObservationSummary: string;
  reviewRiskSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof DataReviewDefaults; label: string }[] = [
  { name: "goalCompletionSummary", label: "目标完成度" },
  { name: "contentEffectSummary", label: "内容效果" },
  { name: "liveEffectSummary", label: "直播效果" },
  { name: "leadConversionEffectSummary", label: "引流转化效果" },
  { name: "realBusinessDataSummary", label: "真实经营数据" },
  { name: "problemDiagnosisSummary", label: "问题诊断" },
  { name: "optimizationSuggestionSummary", label: "优化建议" },
  { name: "strategyJudgmentSummary", label: "策略判断" },
  { name: "attributionObservationSummary", label: "归因观察" },
  { name: "reviewRiskSummary", label: "复盘风险" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: DataReviewDefaults = {
  status: "draft",
  reviewPeriodLabel: "",
  goalCompletionSummary: "",
  contentEffectSummary: "",
  liveEffectSummary: "",
  leadConversionEffectSummary: "",
  realBusinessDataSummary: "",
  problemDiagnosisSummary: "",
  optimizationSuggestionSummary: "",
  strategyJudgmentSummary: "",
  attributionObservationSummary: "",
  reviewRiskSummary: "",
  notes: "",
};

export function DataReviewForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: DataReviewDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantDataReview.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveDataReviewState,
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
        复盘周期（reviewPeriodLabel）
        <input
          name="reviewPeriodLabel"
          type="text"
          defaultValue={d.reviewPeriodLabel}
          placeholder="如 2026-05 或 第 1 个 30 天"
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
          {pending ? "保存中…" : "保存数据复盘"}
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
