import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { IntakeGuidanceBox } from "@/components/merchants/intake-guidance-box";
import { getMerchantById } from "@/lib/merchants/data";
import { MerchantProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function EditMerchantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params;
  const merchant = await getMerchantById(id, user);
  if (!merchant) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {merchant.profile ? "编辑商家画像" : "创建商家画像"}
          </h1>
          <p className="text-sm text-zinc-500">
            {merchant.name} · 摘要级画像（为后续 TB-001 / 诊断 / 策略提供输入，本阶段非完整 TB-001）
          </p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 详情
        </Link>
      </header>

      <IntakeGuidanceBox
        tone="evidence"
        title="录入纪律（先事实，后判断）"
        items={[
          "先记录事实，再谈判断；卖点 / 客群 / 线上情况要区分『事实』与『假设』。",
          "Offer 要能让客户快速（约 3 秒）理解卖什么、好在哪。",
          "不知道就写『待补充』，不要编。",
        ]}
      />
      <MerchantProfileForm merchantId={merchant.id} profile={merchant.profile} />
    </main>
  );
}
