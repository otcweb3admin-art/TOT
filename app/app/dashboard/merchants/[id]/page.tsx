import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";

export const dynamic = "force-dynamic";

// Placeholder only — these modules are NOT implemented in P2-001.
const FUTURE_MODULES = [
  "TB-001 商家诊断",
  "增长诊断",
  "策略",
  "计划",
  "执行",
  "监控",
  "复盘",
];

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params; // Next 16: params is async
  const merchant = await getMerchantById(id);
  if (!merchant) notFound();

  const row = (label: string, value: ReactNode) => (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{merchant.name}</h1>
          <p className="text-sm text-zinc-500">
            商家详情 · P2 Merchant Intake Foundation
          </p>
        </div>
        <Link
          href="/dashboard/merchants"
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 列表
        </Link>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">基础信息</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {row("状态", merchant.status)}
          {row("行业", merchant.industry)}
          {row("城市", merchant.city)}
          {row("国家", merchant.country)}
          {row("联系人", merchant.contactName)}
          {row("联系电话", merchant.contactPhone)}
          {row("联系邮箱", merchant.contactEmail)}
          {row("负责人", merchant.owner?.email)}
          {row("创建人", merchant.createdBy?.email)}
          {row(
            "创建时间",
            merchant.createdAt.toISOString().slice(0, 19).replace("T", " "),
          )}
          {row("备注", merchant.notes)}
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          后续模块（占位，本阶段不实现）
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {FUTURE_MODULES.map((m) => (
            <li key={m} className="flex items-center justify-between">
              <span>{m}</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                未开始
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
