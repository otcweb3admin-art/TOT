import { requireUser } from "@/lib/auth/dal";
import { MerchantForm } from "./merchant-form";

export const dynamic = "force-dynamic";

export default async function NewMerchantPage() {
  await requireUser(); // guard: unauthenticated -> /login
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">新建商家</h1>
        <p className="text-sm text-zinc-500">
          P2 Merchant Intake Foundation · 仅录入接入阶段基础信息（诊断/策略等属后续模块）
        </p>
      </header>
      <MerchantForm />
    </main>
  );
}
