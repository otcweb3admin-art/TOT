import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listMerchants } from "@/lib/merchants/data";
import {
  isDemoMerchant,
  DemoDataBadge,
} from "@/components/merchants/demo-data-badge";
import { StatusBadge } from "@/components/merchants/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { btnPrimary, btnSecondary } from "@/components/ui/button";

// Reads session + DB at request time; never prerender at build.
export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const user = await requireUser(); // guard: unauthenticated -> /login
  // P2 permission foundation (TASK-040): admin sees all merchants; other roles see only
  // merchants they own / created (enforced in listMerchants via merchantVisibilityWhere).
  const merchants = await listMerchants(user);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title="商家列表"
        description="你可见的全部商家——点名称进详情，点「工作台」看链路与缺口。"
        actions={
          <>
            <Link href="/dashboard/merchants/intake" className={btnSecondary}>
              接入向导
            </Link>
            <Link href="/dashboard/merchants/new" className={btnPrimary}>
              + 新建商家
            </Link>
          </>
        }
      />

      {merchants.length === 0 ? (
        <EmptyState
          title="当前还没有商家"
          hints={[
            "建议先打开「商家接入向导」了解录入步骤，或运行 npm run seed:demo 生成 DEMO 学习。",
          ]}
          actions={
            <>
              <Link href="/dashboard/merchants/intake" className={btnPrimary}>
                查看接入向导
              </Link>
              <Link href="/dashboard/merchants/new" className={btnSecondary}>
                开始接入商家
              </Link>
            </>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-4 font-medium">名称</th>
                <th className="py-2 pr-4 font-medium">行业</th>
                <th className="py-2 pr-4 font-medium">城市 / 国家</th>
                <th className="py-2 pr-4 font-medium">状态</th>
                <th className="py-2 pr-4 font-medium">创建时间</th>
                <th className="py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={`/dashboard/merchants/${m.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {m.name}
                    </Link>
                    {isDemoMerchant(m.name) && (
                      <span className="ml-2">
                        <DemoDataBadge variant="compact" />
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{m.industry ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {[m.city, m.country].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="py-2 pr-4">{m.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="py-2">
                    <Link
                      href={`/dashboard/merchants/${m.id}/workspace`}
                      className="underline-offset-2 hover:underline"
                    >
                      工作台
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
