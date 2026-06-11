import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import { listMerchants } from "@/lib/merchants/data";
import { creatableWorkItemTypes } from "@/lib/tasks/access";
import { WORK_ITEM_TYPE_LABELS } from "@/lib/tasks/display";
import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/ui/page-header";
import { btnSecondary } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * 新建任务 (TASK-071)。创建权限：collector 仅 collector_intake；operator 可建多数运营
 * 任务；admin 全部；executor / merchant / ai_worker 不可创建内部任务（页面给出说明，
 * server action 再次校验）。V1 仅支持负责人角色，具体负责人在详情页分配。
 */
export default async function NewTaskPage() {
  const user = await requireUser();
  const types = creatableWorkItemTypes(user.role);

  if (types.length === 0) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
        <PageHeader
          title="新建任务"
          description="当前角色不可创建内部任务。"
          actions={
            <Link href="/dashboard/tasks" className={btnSecondary}>
              ← 任务中心
            </Link>
          }
        />
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          当前角色（{roleLabel(user.role)}）不可创建内部任务：任务由 collector（采集）/
          operator（审核）/ admin 创建并分配。如你需要新任务，请联系审核员或管理员。
        </section>
      </main>
    );
  }

  // 可达此处的角色（collector/operator/admin）都有商家可见性 helper 支持。
  const merchants = await listMerchants(user);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title="新建任务"
        description={`当前角色：${roleLabel(user.role)} — 可创建 ${types.length} 种类型。创建后任务从「未开始」起步，审核 / 完成均需人工操作。`}
        actions={
          <Link href="/dashboard/tasks" className={btnSecondary}>
            ← 任务中心
          </Link>
        }
      />
      {user.role === "admin" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          提醒：admin 是平台管理账号，不建议作为日常运营账号创建/推进任务；日常任务请用对应角色账号。
        </p>
      )}
      <TaskForm
        merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
        typeOptions={types.map((t) => ({ value: t, label: WORK_ITEM_TYPE_LABELS[t] }))}
      />
    </main>
  );
}
