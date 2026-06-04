"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createMerchantStageHandoff,
  type HandoffState,
} from "@/lib/merchants/handoff-actions";

const NODE_OPTIONS = [
  "merchant", "profile", "baseline", "operating_capacity", "diagnosis",
  "account_setup", "material_collection", "content_operation", "live_planning",
  "lead_conversion", "data_review", "growth_plan", "workspace",
];

const ROLE_OPTIONS = [
  { value: "collector", label: "collector（资料采集 / 录入）" },
  { value: "operator", label: "operator（运营协调 / 审核占位）" },
  { value: "executor", label: "executor（方案 / 执行）" },
  { value: "admin", label: "admin（管理 / 最终配置）" },
];

const TEXTAREAS = [
  { name: "summary", label: "交接摘要（summary）" },
  { name: "gapSummary", label: "缺口说明（gapSummary）" },
  { name: "riskSummary", label: "风险说明（riskSummary）" },
  { name: "evidenceSummary", label: "上游依据 / 证据（evidenceSummary）" },
];

export function HandoffForm({ merchantId }: { merchantId: string }) {
  const boundAction = createMerchantStageHandoff.bind(null, merchantId);
  const [state, action, pending] = useActionState<HandoffState, FormData>(
    boundAction,
    undefined,
  );

  const inputCls =
    "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        交接来源节点（fromNode）
        <select name="fromNode" defaultValue="diagnosis" className={inputCls}>
          {NODE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        交接目标节点（toNode）
        <select name="toNode" defaultValue="account_setup" className={inputCls}>
          {NODE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        接收角色（receivedByRole）
        <select name="receivedByRole" defaultValue="executor" className={inputCls}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {TEXTAREAS.map((t) => (
        <label key={t.name} className="flex flex-col gap-1 text-sm">
          {t.label}
          <textarea name={t.name} rows={2} className={inputCls} />
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
          {pending ? "提交中…" : "记录交接"}
        </button>
        <Link
          href={`/dashboard/merchants/${merchantId}/workspace`}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
