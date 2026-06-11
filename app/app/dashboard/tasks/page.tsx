import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { roleLabel } from "@/lib/merchants/role-access";
import { canCreateAnyWorkItem } from "@/lib/tasks/access";
import {
  listWorkItemsForUser,
  getWorkItemStatsForUser,
  WORK_ITEM_LIST_FILTERS,
  type WorkItemListFilter,
} from "@/lib/tasks/data";
import { WORK_ITEM_TYPE_LABELS } from "@/lib/tasks/display";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskFlagBadges,
} from "@/components/tasks/work-item-badges";
import { formatDateTime } from "@/components/merchants/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { btnPrimary, btnSecondary, btnSecondarySm } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const FILTER_LABELS: Record<WorkItemListFilter, string> = {
  all: "全部",
  not_started: "未开始",
  in_progress: "进行中",
  submitted: "待审核",
  changes_requested: "退回修改",
  completed: "已完成",
};

// TASK-074: merchant（客户）视角用客户语义文案——他们只看到自己的客户确认事项。
const CLIENT_FILTER_LABELS: Partial<Record<WorkItemListFilter, string>> = {
  submitted: "待确认",
  changes_requested: "需要修改",
};

/** 各角色空状态下一步提示（规则提示，非决策）。 */
const EMPTY_HINTS: Record<string, string[]> = {
  collector: ["从「新建任务」创建采集任务，或先在商家管理新建商家后按接入向导采集。"],
  operator: ["暂无需要你处理的任务；可在「新建任务」为采集 / 外包 / 客户确认建任务。"],
  executor: ["暂无分配给你的外包任务；任务由审核员分配后会出现在这里。"],
  admin: ["暂无任务；各角色创建的任务会在这里全局可见。"],
  merchant: ["暂无需要你确认的事项；有待确认内容时会出现在这里，确认事项由负责人发起。"],
};

/**
 * 任务中心 (TASK-071)：当前用户应处理的任务，按角色可见性过滤（admin 全部；operator
 * 可访问商家任务；collector 自己的 + 可访问商家采集任务；executor 仅分配给自己的外包
 * 任务；merchant 仅自己的客户确认事项；ai_worker 不可操作）。
 */
export default async function TaskCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams; // Next 16: searchParams is async
  const filter: WorkItemListFilter = WORK_ITEM_LIST_FILTERS.includes(
    sp.filter as WorkItemListFilter,
  )
    ? (sp.filter as WorkItemListFilter)
    : "all";

  // ai_worker：不开放任务操作，只显示说明。
  if (user.role === "ai_worker") {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
        <PageHeader title="任务中心" description="ai_worker 不操作真人任务。" />
        <section className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          ai_worker 是 AI 能力的系统标识，不作为真人工作账号，不可查看或操作任务。AI
          草稿能力由审核员在「AI 工作台」调用；如你是真人登录到此账号，请联系管理员配置正确角色。
        </section>
      </main>
    );
  }

  const [items, stats] = await Promise.all([
    listWorkItemsForUser(user, filter),
    getWorkItemStatsForUser(user),
  ]);

  const isClient = user.role === "merchant";
  const filterCount = (f: WorkItemListFilter): number =>
    !stats ? 0 : f === "all" ? stats.total : stats.byStatus[f];
  const filterLabel = (f: WorkItemListFilter): string =>
    (isClient ? CLIENT_FILTER_LABELS[f] : undefined) ?? FILTER_LABELS[f];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title={isClient ? "我的事项" : "任务中心"}
        description={
          isClient
            ? "这里只显示需要你确认的事项：内容没问题点「确认通过」，需要调整就提交修改意见。"
            : `当前角色：${roleLabel(user.role)} — 这里只显示你可见、应处理的任务。审核 / 退回 / 完成均为人工操作，系统不自动流转。`
        }
        actions={
          canCreateAnyWorkItem(user.role) ? (
            <Link href="/dashboard/tasks/new" className={btnPrimary}>
              + 新建任务
            </Link>
          ) : undefined
        }
      />

      {isClient && (
        <p className="rounded-lg border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
          确认通过后团队才会进入下一步；确认通过不代表承诺增长结果。资料上传等更多客户功能将在后续版本提供。
        </p>
      )}

      {/* 筛选 + 统计（chip 即筛选入口） */}
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="任务筛选">
        {WORK_ITEM_LIST_FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/dashboard/tasks" : `/dashboard/tasks?filter=${f}`}
            className={`rounded-full border px-3 py-1 ${
              f === filter
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {filterLabel(f)} {filterCount(f)}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          title={
            filter === "all"
              ? isClient
                ? "当前暂无需要你确认的事项"
                : "当前暂无任务"
              : `暂无「${filterLabel(filter)}」状态的${isClient ? "事项" : "任务"}`
          }
          hints={EMPTY_HINTS[user.role]}
          actions={
            canCreateAnyWorkItem(user.role) ? (
              <Link href="/dashboard/tasks/new" className={btnPrimary}>
                新建任务
              </Link>
            ) : (
              <Link href="/dashboard" className={btnSecondary}>
                返回首页
              </Link>
            )
          }
        />
      ) : (
        <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-medium text-zinc-500">
            {isClient ? "事项列表" : "任务列表"}（{filterLabel(filter)}，最多 200 条）
          </h2>
          <ul className="flex flex-col">
            {items.map((t) => (
              <li
                key={t.id}
                className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/tasks/${t.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {t.title}
                  </Link>
                  <span className="text-xs text-zinc-500">{WORK_ITEM_TYPE_LABELS[t.type]}</span>
                  <TaskStatusBadge status={t.status} type={t.type} />
                  <TaskPriorityBadge priority={t.priority} />
                  <TaskFlagBadges
                    requiresAi={t.requiresAi}
                    requiresOutsource={t.requiresOutsource}
                    requiresClientConfirmation={t.requiresClientConfirmation}
                  />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-zinc-400">
                  <span>商家：{t.merchant ? t.merchant.name : "（未关联）"}</span>
                  <span>
                    负责人：
                    {t.assignedProfile
                      ? t.assignedProfile.email
                      : t.assignedRole
                        ? `${t.assignedRole}（角色队列，待分配）`
                        : "未分配"}
                  </span>
                  <span>截止：{t.dueAt ? formatDateTime(t.dueAt) : "未设置"}</span>
                  <span>创建：{formatDateTime(t.createdAt)}</span>
                  <Link href={`/dashboard/tasks/${t.id}`} className={btnSecondarySm}>
                    查看详情
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
