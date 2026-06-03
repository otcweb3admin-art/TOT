"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantContentOperation,
  type SaveContentOperationState,
} from "@/lib/merchants/content-operation-actions";

export type ContentOperationDefaults = {
  status: string;
  contentPositioningSummary: string;
  contentPillarSummary: string;
  contentRatioSummary: string;
  publishingFrequencySummary: string;
  toneStyleSummary: string;
  contentBoundarySummary: string;
  first30DayPlanSummary: string;
  contentRiskSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof ContentOperationDefaults; label: string }[] = [
  { name: "contentPositioningSummary", label: "内容定位" },
  { name: "contentPillarSummary", label: "栏目方向" },
  { name: "contentRatioSummary", label: "内容比例" },
  { name: "publishingFrequencySummary", label: "发布频率" },
  { name: "toneStyleSummary", label: "风格调性" },
  { name: "contentBoundarySummary", label: "内容禁区" },
  { name: "first30DayPlanSummary", label: "前 30 天计划摘要" },
  { name: "contentRiskSummary", label: "内容风险" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: ContentOperationDefaults = {
  status: "draft",
  contentPositioningSummary: "",
  contentPillarSummary: "",
  contentRatioSummary: "",
  publishingFrequencySummary: "",
  toneStyleSummary: "",
  contentBoundarySummary: "",
  first30DayPlanSummary: "",
  contentRiskSummary: "",
  notes: "",
};

export function ContentOperationForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: ContentOperationDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantContentOperation.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveContentOperationState,
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
          {pending ? "保存中…" : "保存内容运营方案"}
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
