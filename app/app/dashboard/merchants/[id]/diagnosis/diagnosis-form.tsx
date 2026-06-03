"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantDiagnosis,
  type SaveDiagnosisState,
} from "@/lib/merchants/diagnosis-actions";

export type DiagnosisDefaults = {
  status: string;
  diagnosisSummary: string;
  growthProblemSummary: string;
  opportunitySummary: string;
  riskSummary: string;
  recommendedNextStep: string;
};

const TEXT_FIELDS: { name: keyof DiagnosisDefaults; label: string }[] = [
  { name: "diagnosisSummary", label: "诊断摘要" },
  { name: "growthProblemSummary", label: "增长问题" },
  { name: "opportunitySummary", label: "机会点" },
  { name: "riskSummary", label: "风险" },
  { name: "recommendedNextStep", label: "建议下一步" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: DiagnosisDefaults = {
  status: "draft",
  diagnosisSummary: "",
  growthProblemSummary: "",
  opportunitySummary: "",
  riskSummary: "",
  recommendedNextStep: "",
};

export function DiagnosisForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: DiagnosisDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantDiagnosis.bind(null, merchantId);
  const [state, action, pending] = useActionState<SaveDiagnosisState, FormData>(
    boundAction,
    undefined,
  );

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
          {pending ? "保存中…" : "保存诊断"}
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
