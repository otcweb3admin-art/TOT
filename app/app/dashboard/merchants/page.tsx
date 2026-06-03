import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listMerchants } from "@/lib/merchants/data";

// Reads session + DB at request time; never prerender at build.
export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const user = await requireUser(); // guard: unauthenticated -> /login
  // P2 permission foundation (TASK-040): admin sees all merchants; other roles see only
  // merchants they own / created (enforced in listMerchants via merchantVisibilityWhere).
  const merchants = await listMerchants(user);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">商家列表</h1>
          <p className="text-sm text-zinc-500">P2 Merchant Intake Foundation</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            ← 后台
          </Link>
          <Link
            href="/dashboard/merchants/new"
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-zinc-900"
          >
            + 新建商家
          </Link>
        </div>
      </header>

      {merchants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          暂无商家。点击右上角「新建商家」创建第一个。
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4 font-medium">名称</th>
              <th className="py-2 pr-4 font-medium">行业</th>
              <th className="py-2 pr-4 font-medium">城市 / 国家</th>
              <th className="py-2 pr-4 font-medium">状态</th>
              <th className="py-2 font-medium">创建时间</th>
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
                </td>
                <td className="py-2 pr-4">{m.industry ?? "—"}</td>
                <td className="py-2 pr-4">
                  {[m.city, m.country].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="py-2 pr-4">{m.status}</td>
                <td className="py-2">{m.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
