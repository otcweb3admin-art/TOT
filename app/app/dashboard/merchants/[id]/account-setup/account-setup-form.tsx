"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantAccountSetup,
  type SaveAccountSetupState,
} from "@/lib/merchants/account-setup-actions";

export type AccountSetupDefaults = {
  status: string;
  platformPlanSummary: string;
  accountPositioningSummary: string;
  namingDirection: string;
  bioDirection: string;
  visualDirectionSummary: string;
  personaDirectionSummary: string;
  googleMapsDirectionSummary: string;
  contactChannelSummary: string;
  setupRiskSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof AccountSetupDefaults; label: string }[] = [
  { name: "platformPlanSummary", label: "平台计划" },
  { name: "accountPositioningSummary", label: "账号定位" },
  { name: "namingDirection", label: "命名方向" },
  { name: "bioDirection", label: "Bio 方向" },
  { name: "visualDirectionSummary", label: "视觉方向" },
  { name: "personaDirectionSummary", label: "人设方向" },
  { name: "googleMapsDirectionSummary", label: "Google Maps 方向" },
  { name: "contactChannelSummary", label: "联系方式 / 私域方向" },
  { name: "setupRiskSummary", label: "风险" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: AccountSetupDefaults = {
  status: "draft",
  platformPlanSummary: "",
  accountPositioningSummary: "",
  namingDirection: "",
  bioDirection: "",
  visualDirectionSummary: "",
  personaDirectionSummary: "",
  googleMapsDirectionSummary: "",
  contactChannelSummary: "",
  setupRiskSummary: "",
  notes: "",
};

export function AccountSetupForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: AccountSetupDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantAccountSetup.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveAccountSetupState,
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
          {pending ? "保存中…" : "保存账号搭建方案"}
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
