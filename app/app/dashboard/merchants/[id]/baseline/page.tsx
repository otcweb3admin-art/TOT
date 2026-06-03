import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { BaselineForm, type BaselineDefaults } from "./baseline-form";

export const dynamic = "force-dynamic";

export default async function EditBaselinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params;
  const merchant = await getMerchantById(id);
  if (!merchant) notFound();

  const b = merchant.baseline;
  // Convert to plain strings (Prisma.Decimal is not safely serializable to a client comp).
  const defaults: BaselineDefaults | null = b
    ? {
        periodLabel: b.periodLabel ?? "",
        monthlyRevenue: b.monthlyRevenue?.toString() ?? "",
        monthlyCustomerCount: b.monthlyCustomerCount?.toString() ?? "",
        monthlyLeadCount: b.monthlyLeadCount?.toString() ?? "",
        monthlyConversionCount: b.monthlyConversionCount?.toString() ?? "",
        averageOrderValue: b.averageOrderValue?.toString() ?? "",
        repeatCustomerRate: b.repeatCustomerRate?.toString() ?? "",
        followerCount: b.followerCount?.toString() ?? "",
        reviewCount: b.reviewCount?.toString() ?? "",
        averageRating: b.averageRating?.toString() ?? "",
        sourceNote: b.sourceNote ?? "",
        dataConfidence: b.dataConfidence,
        notes: b.notes ?? "",
      }
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {b ? "编辑增长前基准数据" : "创建增长前基准数据"}
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 增长前基线（为后续 TB-001 / MVS / 复盘提供对照，本阶段非完整指标系统）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      <BaselineForm merchantId={merchant.id} defaults={defaults} />
    </main>
  );
}
