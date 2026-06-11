import type { WorkItemStatus, WorkItemPriority } from "@prisma/client";
import {
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_STATUS_STYLES,
  WORK_ITEM_PRIORITY_LABELS,
  WORK_ITEM_PRIORITY_STYLES,
} from "@/lib/tasks/display";

// WorkItem 专用徽章 (TASK-071) — presentation only。不复用 merchants/StatusBadge：
// 任务的 submitted=待审核，交接的 submitted=已提交交接，语义不同不可混。

const PILL = "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function TaskStatusBadge({ status }: { status: WorkItemStatus }) {
  return (
    <span className={`${PILL} ${WORK_ITEM_STATUS_STYLES[status]}`}>
      {WORK_ITEM_STATUS_LABELS[status]}
    </span>
  );
}

export function TaskPriorityBadge({ priority }: { priority: WorkItemPriority }) {
  return (
    <span className={`${PILL} ${WORK_ITEM_PRIORITY_STYLES[priority]}`}>
      优先级 {WORK_ITEM_PRIORITY_LABELS[priority]}
    </span>
  );
}

/** AI / 外包 / 客户确认 标识 chips（仅在为 true 时显示）。 */
export function TaskFlagBadges({
  requiresAi,
  requiresOutsource,
  requiresClientConfirmation,
}: {
  requiresAi: boolean;
  requiresOutsource: boolean;
  requiresClientConfirmation: boolean;
}) {
  const CHIP =
    "inline-flex w-fit items-center rounded border border-zinc-300 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-400";
  return (
    <>
      {requiresAi && <span className={CHIP}>需 AI 辅助</span>}
      {requiresOutsource && <span className={CHIP}>需外包</span>}
      {requiresClientConfirmation && <span className={CHIP}>需客户确认</span>}
    </>
  );
}
