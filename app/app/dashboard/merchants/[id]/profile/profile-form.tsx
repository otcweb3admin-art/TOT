"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantProfile,
  type SaveMerchantProfileState,
} from "@/lib/merchants/profile-actions";

export type MerchantProfileFields = {
  industryDetail: string | null;
  targetCustomerSummary: string | null;
  coreOfferSummary: string | null;
  currentAcquisitionSummary: string | null;
  onlinePresenceSummary: string | null;
  growthGoalSummary: string | null;
  executionLimitSummary: string | null;
  baselineDataSummary: string | null;
  notes: string | null;
};

const FIELDS: { name: keyof MerchantProfileFields; label: string }[] = [
  { name: "industryDetail", label: "行业细分" },
  { name: "targetCustomerSummary", label: "目标客群" },
  { name: "coreOfferSummary", label: "核心卖点" },
  { name: "currentAcquisitionSummary", label: "当前获客" },
  { name: "onlinePresenceSummary", label: "线上情况" },
  { name: "growthGoalSummary", label: "增长目标" },
  { name: "executionLimitSummary", label: "执行限制" },
  { name: "baselineDataSummary", label: "基准数据" },
  { name: "notes", label: "备注" },
];

export function MerchantProfileForm({
  merchantId,
  profile,
}: {
  merchantId: string;
  profile: MerchantProfileFields | null;
}) {
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantProfile.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveMerchantProfileState,
    FormData
  >(boundAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          {f.label}
          <textarea
            name={f.name}
            rows={2}
            defaultValue={profile?.[f.name] ?? ""}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
          {pending ? "保存中…" : "保存画像"}
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
