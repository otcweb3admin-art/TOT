import type { WorkItemType, WorkItemStatus, WorkItemPriority } from "@prisma/client";

// ===== WorkItem 中文显示映射 (TASK-071) =====
// Pure presentation maps — the enum VALUES are authoritative; UI renders "value 中文".
// Task statuses deliberately do NOT reuse the merchant/handoff StatusBadge maps
// (e.g. "submitted" means 待审核 here but 已提交交接 there).

export const WORK_ITEM_TYPE_LABELS: Record<WorkItemType, string> = {
  collector_intake: "采集原始资料",
  review_intake: "审核采集资料",
  ai_draft_review: "审核 AI 草稿",
  outsource_execution: "外包执行任务",
  outsource_review: "审核外包成果",
  client_confirmation: "客户确认事项",
  general_followup: "通用跟进任务",
};

export const WORK_ITEM_STATUS_LABELS: Record<WorkItemStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  submitted: "待审核",
  changes_requested: "退回修改",
  approved: "审核通过",
  assigned: "已分配",
  completed: "已完成",
  cancelled: "已取消",
};

export const WORK_ITEM_PRIORITY_LABELS: Record<WorkItemPriority, string> = {
  low: "低",
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

// TASK-074: client_confirmation 的客户语义状态文案（覆盖通用标签；其余状态用通用）。
// submitted=等待客户确认 / approved=客户已确认 / changes_requested=客户要求修改。
export const CLIENT_CONFIRMATION_STATUS_LABELS: Partial<Record<WorkItemStatus, string>> = {
  submitted: "待确认",
  approved: "客户已确认",
  changes_requested: "客户要求修改",
};

export function workItemStatusLabel(status: WorkItemStatus, type?: WorkItemType): string {
  if (type === "client_confirmation" && CLIENT_CONFIRMATION_STATUS_LABELS[status]) {
    return CLIENT_CONFIRMATION_STATUS_LABELS[status]!;
  }
  return WORK_ITEM_STATUS_LABELS[status];
}

export const WORK_ITEM_STATUS_STYLES: Record<WorkItemStatus, string> = {
  not_started: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  changes_requested: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  assigned: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300",
};

export const WORK_ITEM_PRIORITY_STYLES: Record<WorkItemPriority, string> = {
  low: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  normal: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export const WORK_ITEM_TYPES: WorkItemType[] = [
  "collector_intake",
  "review_intake",
  "ai_draft_review",
  "outsource_execution",
  "outsource_review",
  "client_confirmation",
  "general_followup",
];

export const WORK_ITEM_STATUSES: WorkItemStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "changes_requested",
  "approved",
  "assigned",
  "completed",
  "cancelled",
];

export const WORK_ITEM_PRIORITIES: WorkItemPriority[] = ["low", "normal", "high", "urgent"];
