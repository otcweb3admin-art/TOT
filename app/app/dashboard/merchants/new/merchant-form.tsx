"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createMerchant, type CreateMerchantState } from "@/lib/merchants/actions";

const FIELDS = [
  { name: "name", label: "商家名称 *", type: "text", required: true },
  { name: "industry", label: "行业", type: "text", required: false },
  { name: "city", label: "城市", type: "text", required: false },
  { name: "country", label: "国家", type: "text", required: false },
  { name: "contactName", label: "联系人", type: "text", required: false },
  { name: "contactPhone", label: "联系电话", type: "tel", required: false },
  { name: "contactEmail", label: "联系邮箱", type: "email", required: false },
] as const;

export function MerchantForm() {
  const [state, action, pending] = useActionState<CreateMerchantState, FormData>(
    createMerchant,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          {f.label}
          <input
            name={f.name}
            type={f.type}
            required={f.required}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      ))}

      <label className="flex flex-col gap-1 text-sm">
        备注
        <textarea
          name="notes"
          rows={3}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
          {pending ? "创建中…" : "创建商家"}
        </button>
        <Link
          href="/dashboard/merchants"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
