"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantBaselineMetric,
  type SaveBaselineState,
} from "@/lib/merchants/baseline-actions";

export type BaselineDefaults = {
  periodLabel: string;
  monthlyRevenue: string;
  monthlyCustomerCount: string;
  monthlyLeadCount: string;
  monthlyConversionCount: string;
  averageOrderValue: string;
  repeatCustomerRate: string;
  followerCount: string;
  reviewCount: string;
  averageRating: string;
  sourceNote: string;
  dataConfidence: string;
  notes: string;
};

const NUM_FIELDS: {
  name: keyof BaselineDefaults;
  label: string;
  step: string;
}[] = [
  { name: "monthlyRevenue", label: "月营业额", step: "0.01" },
  { name: "monthlyCustomerCount", label: "月客户数", step: "1" },
  { name: "monthlyLeadCount", label: "月咨询数", step: "1" },
  { name: "monthlyConversionCount", label: "月成交数", step: "1" },
  { name: "averageOrderValue", label: "客单价", step: "0.01" },
  { name: "repeatCustomerRate", label: "复购率（%）", step: "0.01" },
  { name: "followerCount", label: "粉丝数", step: "1" },
  { name: "reviewCount", label: "评论数", step: "1" },
  { name: "averageRating", label: "平均评分（0–5）", step: "0.01" },
];

const CONFIDENCE_OPTIONS = [
  { value: "unknown", label: "unknown · 未知 / 未判断" },
  { value: "low", label: "low · 口头估计" },
  { value: "medium", label: "medium · 有部分记录" },
  { value: "high", label: "high · 有完整数据来源" },
];

const EMPTY: BaselineDefaults = {
  periodLabel: "",
  monthlyRevenue: "",
  monthlyCustomerCount: "",
  monthlyLeadCount: "",
  monthlyConversionCount: "",
  averageOrderValue: "",
  repeatCustomerRate: "",
  followerCount: "",
  reviewCount: "",
  averageRating: "",
  sourceNote: "",
  dataConfidence: "unknown",
  notes: "",
};

export function BaselineForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: BaselineDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantBaselineMetric.bind(null, merchantId);
  const [state, action, pending] = useActionState<SaveBaselineState, FormData>(
    boundAction,
    undefined,
  );

  const inputCls =
    "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        统计周期（periodLabel）
        <input
          name="periodLabel"
          type="text"
          defaultValue={d.periodLabel}
          placeholder="如 2026-05 或 2026 Q2"
          className={inputCls}
        />
      </label>

      {NUM_FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          {f.label}
          <input
            name={f.name}
            type="number"
            min="0"
            step={f.step}
            inputMode="decimal"
            defaultValue={d[f.name]}
            className={inputCls}
          />
        </label>
      ))}

      <label className="flex flex-col gap-1 text-sm">
        数据来源说明（sourceNote）
        <textarea
          name="sourceNote"
          rows={2}
          defaultValue={d.sourceNote}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        数据可信度（dataConfidence）
        <select
          name="dataConfidence"
          defaultValue={d.dataConfidence}
          className={inputCls}
        >
          {CONFIDENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        备注
        <textarea
          name="notes"
          rows={2}
          defaultValue={d.notes}
          className={inputCls}
        />
      </label>

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
          {pending ? "保存中…" : "保存基准数据"}
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
