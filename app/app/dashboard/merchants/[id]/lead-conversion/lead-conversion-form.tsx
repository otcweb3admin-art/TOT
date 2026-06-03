"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantLeadConversion,
  type SaveLeadConversionState,
} from "@/lib/merchants/lead-conversion-actions";

export type LeadConversionDefaults = {
  status: string;
  trafficPathSummary: string;
  conversionPathSummary: string;
  privateDomainSummary: string;
  campaignIdeaSummary: string;
  googleMapsActionSummary: string;
  paidTrafficTestSummary: string;
  p001ReadinessSummary: string;
  thirtyDayActionSummary: string;
  conversionRiskSummary: string;
  attributionMethodSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof LeadConversionDefaults; label: string }[] = [
  { name: "trafficPathSummary", label: "引流路径" },
  { name: "conversionPathSummary", label: "转化路径" },
  { name: "privateDomainSummary", label: "私域承接" },
  { name: "campaignIdeaSummary", label: "活动想法" },
  { name: "googleMapsActionSummary", label: "Google Maps 动作" },
  { name: "paidTrafficTestSummary", label: "投流测试方向" },
  { name: "p001ReadinessSummary", label: "P-001 准备度" },
  { name: "thirtyDayActionSummary", label: "30 天动作摘要" },
  { name: "conversionRiskSummary", label: "转化风险" },
  { name: "attributionMethodSummary", label: "归因方式" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: LeadConversionDefaults = {
  status: "draft",
  trafficPathSummary: "",
  conversionPathSummary: "",
  privateDomainSummary: "",
  campaignIdeaSummary: "",
  googleMapsActionSummary: "",
  paidTrafficTestSummary: "",
  p001ReadinessSummary: "",
  thirtyDayActionSummary: "",
  conversionRiskSummary: "",
  attributionMethodSummary: "",
  notes: "",
};

export function LeadConversionForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: LeadConversionDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantLeadConversion.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveLeadConversionState,
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
          {pending ? "保存中…" : "保存引流转化方案"}
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
