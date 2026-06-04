import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { HandoffForm } from "./handoff-form";

export const dynamic = "force-dynamic";

/**
 * New stage-handoff form (Phase C / TASK-057). Reuses getMerchantById(id, user) so the
 * merchant-level permission filter applies (unauthorized -> 404). Record-only: submitting
 * creates a handoff with status=submitted — NO auto-approval, NO node-status change.
 */
export default async function NewHandoffPage({
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
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">新增环节交接记录</h1>
          <p className="text-sm text-zinc-500">{merchant.name} · 人工记录节点交接</p>
        </div>
        <Link
          href={`/dashboard/merchants/${merchant.id}/workspace`}
          className="shrink-0 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 工作台
        </Link>
      </header>

      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
        交接记录不代表自动审批。是否进入下一环节仍需人工确认；本操作不会自动改变任何节点状态、不会自动放行、不会锁定上游。
      </p>

      <HandoffForm merchantId={merchant.id} />
    </main>
  );
}
