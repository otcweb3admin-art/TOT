"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantOperatingCapacity,
  type SaveOperatingCapacityState,
} from "@/lib/merchants/operating-capacity-actions";

export type OperatingCapacityDefaults = {
  status: string;
  responseProcessSummary: string;
  responseTimeSummary: string;
  bookingProcessSummary: string;
  serviceCapacitySummary: string;
  peakHourHandlingSummary: string;
  fulfillmentRiskSummary: string;
  customerExperienceRiskSummary: string;
  ownerDependencySummary: string;
  staffRoleSummary: string;
  delegationReadinessSummary: string;
  standardProcessSummary: string;
  trainingReadinessSummary: string;
  organizationRiskSummary: string;
  operatingConstraintSummary: string;
  notes: string;
};

type Field = { name: keyof OperatingCapacityDefaults; label: string };

const FULFILLMENT_FIELDS: Field[] = [
  { name: "responseProcessSummary", label: "响应流程（谁接、怎么接）" },
  { name: "responseTimeSummary", label: "响应时效（多久回复 / 到店）" },
  { name: "bookingProcessSummary", label: "预约 / 接单流程" },
  { name: "serviceCapacitySummary", label: "服务产能（接待 / 出品上限）" },
  { name: "peakHourHandlingSummary", label: "高峰应对（忙时如何处理）" },
  { name: "fulfillmentRiskSummary", label: "履约风险" },
  { name: "customerExperienceRiskSummary", label: "客户体验风险" },
];

const ORGANIZATION_FIELDS: Field[] = [
  { name: "ownerDependencySummary", label: "老板依赖（是否单点）" },
  { name: "staffRoleSummary", label: "人员分工" },
  { name: "delegationReadinessSummary", label: "可委派度（能否交给别人）" },
  { name: "standardProcessSummary", label: "标准流程 / SOP 现状" },
  { name: "trainingReadinessSummary", label: "培训准备度" },
  { name: "organizationRiskSummary", label: "组织风险" },
];

const GENERAL_FIELDS: Field[] = [
  { name: "operatingConstraintSummary", label: "经营约束（综合）" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: OperatingCapacityDefaults = {
  status: "draft",
  responseProcessSummary: "",
  responseTimeSummary: "",
  bookingProcessSummary: "",
  serviceCapacitySummary: "",
  peakHourHandlingSummary: "",
  fulfillmentRiskSummary: "",
  customerExperienceRiskSummary: "",
  ownerDependencySummary: "",
  staffRoleSummary: "",
  delegationReadinessSummary: "",
  standardProcessSummary: "",
  trainingReadinessSummary: "",
  organizationRiskSummary: "",
  operatingConstraintSummary: "",
  notes: "",
};

export function OperatingCapacityForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: OperatingCapacityDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  const boundAction = saveMerchantOperatingCapacity.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveOperatingCapacityState,
    FormData
  >(boundAction, undefined);

  const inputCls =
    "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  const renderField = (f: Field) => (
    <label key={f.name} className="flex flex-col gap-1 text-sm">
      {f.label}
      <textarea
        name={f.name}
        rows={2}
        defaultValue={d[f.name]}
        className={inputCls}
      />
    </label>
  );

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

      <h2 className="mt-2 text-sm font-medium text-zinc-500">
        履约能力（Fulfillment）
      </h2>
      {FULFILLMENT_FIELDS.map(renderField)}

      <h2 className="mt-2 text-sm font-medium text-zinc-500">
        组织能力（Organization）
      </h2>
      {ORGANIZATION_FIELDS.map(renderField)}

      <h2 className="mt-2 text-sm font-medium text-zinc-500">综合</h2>
      {GENERAL_FIELDS.map(renderField)}

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
          {pending ? "保存中…" : "保存经营承接能力"}
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
