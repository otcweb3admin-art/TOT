"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveMerchantMaterialCollection,
  type SaveMaterialCollectionState,
} from "@/lib/merchants/material-actions";

export type MaterialDefaults = {
  status: string;
  materialCategorySummary: string;
  materialGapSummary: string;
  shootingSceneSummary: string;
  peopleMaterialSummary: string;
  productServiceMaterialSummary: string;
  trustMaterialSummary: string;
  brandStoryMaterialSummary: string;
  collectionPrioritySummary: string;
  collectionRiskSummary: string;
  notes: string;
};

const TEXT_FIELDS: { name: keyof MaterialDefaults; label: string }[] = [
  { name: "materialCategorySummary", label: "素材分类" },
  { name: "materialGapSummary", label: "素材缺口" },
  { name: "shootingSceneSummary", label: "拍摄场景" },
  { name: "peopleMaterialSummary", label: "人物素材" },
  { name: "productServiceMaterialSummary", label: "产品 / 服务素材" },
  { name: "trustMaterialSummary", label: "信任素材" },
  { name: "brandStoryMaterialSummary", label: "品牌故事素材" },
  { name: "collectionPrioritySummary", label: "采集优先级" },
  { name: "collectionRiskSummary", label: "风险" },
  { name: "notes", label: "备注" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft · 草稿" },
  { value: "completed", label: "completed · 已完成" },
  { value: "archived", label: "archived · 归档" },
];

const EMPTY: MaterialDefaults = {
  status: "draft",
  materialCategorySummary: "",
  materialGapSummary: "",
  shootingSceneSummary: "",
  peopleMaterialSummary: "",
  productServiceMaterialSummary: "",
  trustMaterialSummary: "",
  brandStoryMaterialSummary: "",
  collectionPrioritySummary: "",
  collectionRiskSummary: "",
  notes: "",
};

export function MaterialForm({
  merchantId,
  defaults,
}: {
  merchantId: string;
  defaults: MaterialDefaults | null;
}) {
  const d = defaults ?? EMPTY;
  // Bind merchantId server-side (not trusted from client FormData).
  const boundAction = saveMerchantMaterialCollection.bind(null, merchantId);
  const [state, action, pending] = useActionState<
    SaveMaterialCollectionState,
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
          {pending ? "保存中…" : "保存素材采集方案"}
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
