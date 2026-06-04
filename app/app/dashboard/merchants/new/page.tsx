import { requireUser } from "@/lib/auth/dal";
import { IntakeGuidanceBox } from "@/components/merchants/intake-guidance-box";
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
      <IntakeGuidanceBox
        title="录入原则"
        items={[
          "Merchant 只是商家主体——诊断 / 画像 / 经营信息请填到对应资产节点，不要塞进备注。",
          "不确定的信息允许后续补充，先建主体即可。",
          "真实商家录入须来自线下确认或项目负责人授权（系统不决定是否合作）。",
        ]}
      />
      <MerchantForm />
    </main>
  );
}
