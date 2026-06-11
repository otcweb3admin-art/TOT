import "server-only";
import type { Role, WorkItemStatus, WorkItemType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/dal";
import { workItemVisibilityWhere, type TaskUser } from "@/lib/tasks/access";

// ===== WorkItem data access (TASK-071) =====
// Every query goes through workItemVisibilityWhere — role + merchant visibility enforced
// at the data layer; unauthorized lookups return null / empty (no existence leak).
// Lean selects only: a task row never carries full merchant business data (an executor
// sees the merchant NAME on their task, never the merchant's operating data).

const LIST_SELECT = {
  id: true,
  title: true,
  type: true,
  status: true,
  priority: true,
  assignedRole: true,
  dueAt: true,
  requiresAi: true,
  requiresOutsource: true,
  requiresClientConfirmation: true,
  createdAt: true,
  merchant: { select: { id: true, name: true } },
  assignedProfile: { select: { id: true, email: true, role: true } },
  createdByProfile: { select: { id: true, email: true } },
} as const;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  description: true,
  requirements: true,
  acceptanceCriteria: true,
  resultSummary: true,
  reviewNote: true,
  sourceNode: true,
  targetNode: true,
  assignedProfileId: true,
  createdByProfileId: true,
  reviewerProfileId: true,
  submittedAt: true,
  approvedAt: true,
  completedAt: true,
  cancelledAt: true,
  updatedAt: true,
  reviewerProfile: { select: { id: true, email: true } },
} as const;

export type WorkItemListFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "submitted"
  | "changes_requested"
  | "completed";

export const WORK_ITEM_LIST_FILTERS: WorkItemListFilter[] = [
  "all",
  "not_started",
  "in_progress",
  "submitted",
  "changes_requested",
  "completed",
];

const filterWhere = (filter: WorkItemListFilter) =>
  filter === "all" ? {} : { status: filter as WorkItemStatus };

/** Tasks the user may see (role-scoped), newest first. ai_worker → []. */
export async function listWorkItemsForUser(user: CurrentUser, filter: WorkItemListFilter = "all") {
  const vis = workItemVisibilityWhere(user);
  if (vis === null) return [];
  return prisma.workItem.findMany({
    where: { AND: [vis, filterWhere(filter)] },
    select: LIST_SELECT,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** One task by id — AND'ed with visibility: missing and no-access both yield null. */
export async function getWorkItemByIdForUser(id: string, user: CurrentUser) {
  const vis = workItemVisibilityWhere(user);
  if (vis === null) return null;
  return prisma.workItem.findFirst({ where: { AND: [{ id }, vis] }, select: DETAIL_SELECT });
}

/** Tasks of one merchant the user may see (visibility re-applied; no merchant-id probing). */
export async function listWorkItemsForMerchant(merchantId: string, user: CurrentUser) {
  const vis = workItemVisibilityWhere(user);
  if (vis === null) return [];
  return prisma.workItem.findMany({
    where: { AND: [{ merchantId }, vis] },
    select: LIST_SELECT,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export type WorkItemStats = {
  total: number;
  byStatus: Record<WorkItemStatus, number>;
  /** 审核侧队列（operator / admin 首页用） */
  reviewQueue: {
    submittedTotal: number;
    aiDraftSubmitted: number;
    outsourceSubmitted: number;
    clientConfirmationOpen: number;
    /** TASK-074: 待客户确认（submitted） / 客户已反馈待处理（approved+changes_requested） */
    clientConfirmationAwaiting: number;
    clientConfirmationFeedback: number;
  };
  highPriorityOpen: number;
  overdueOpen: number;
};

const ZERO_BY_STATUS: Record<WorkItemStatus, number> = {
  not_started: 0,
  in_progress: 0,
  submitted: 0,
  changes_requested: 0,
  approved: 0,
  assigned: 0,
  completed: 0,
  cancelled: 0,
};

const OPEN_NOT_IN: WorkItemStatus[] = ["completed", "cancelled"];

/** Role-scoped task counts for workspaces / the task center. ai_worker → null. */
export async function getWorkItemStatsForUser(user: TaskUser): Promise<WorkItemStats | null> {
  const vis = workItemVisibilityWhere(user);
  if (vis === null) return null;

  const [grouped, aiDraftSubmitted, outsourceSubmitted, clientConfirmationOpen, clientConfirmationAwaiting, clientConfirmationFeedback, highPriorityOpen, overdueOpen] =
    await Promise.all([
      prisma.workItem.groupBy({ by: ["status"], where: vis, _count: { _all: true } }),
      prisma.workItem.count({
        where: { AND: [vis, { type: "ai_draft_review", status: "submitted" }] },
      }),
      prisma.workItem.count({
        where: {
          AND: [vis, { type: { in: ["outsource_execution", "outsource_review"] }, status: "submitted" }],
        },
      }),
      prisma.workItem.count({
        where: { AND: [vis, { type: "client_confirmation", status: { notIn: OPEN_NOT_IN } }] },
      }),
      prisma.workItem.count({
        where: { AND: [vis, { type: "client_confirmation", status: "submitted" }] },
      }),
      prisma.workItem.count({
        where: { AND: [vis, { type: "client_confirmation", status: { in: ["approved", "changes_requested"] } }] },
      }),
      prisma.workItem.count({
        where: { AND: [vis, { priority: { in: ["high", "urgent"] }, status: { notIn: OPEN_NOT_IN } }] },
      }),
      prisma.workItem.count({
        where: { AND: [vis, { dueAt: { lt: new Date() }, status: { notIn: OPEN_NOT_IN } }] },
      }),
    ]);

  const byStatus = { ...ZERO_BY_STATUS };
  for (const g of grouped) byStatus[g.status] = g._count._all;
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return {
    total,
    byStatus,
    reviewQueue: {
      submittedTotal: byStatus.submitted,
      aiDraftSubmitted,
      outsourceSubmitted,
      clientConfirmationOpen,
      clientConfirmationAwaiting,
      clientConfirmationFeedback,
    },
    highPriorityOpen,
    overdueOpen,
  };
}

/**
 * Profiles selectable as assignee. admin → all active; operator → depends on task type:
 * outsource_execution → executors, client_confirmation → merchants (TASK-074), else none.
 */
export async function listAssignableProfiles(user: TaskUser, taskType?: WorkItemType) {
  if (user.role !== "admin" && user.role !== "operator") return [];
  let roleFilter: { role: Role } | null | Record<string, never> = {};
  if (user.role === "operator") {
    roleFilter =
      taskType === "outsource_execution"
        ? { role: "executor" as Role }
        : taskType === "client_confirmation"
          ? { role: "merchant" as Role }
          : null;
    if (roleFilter === null) return [];
  }
  return prisma.userProfile.findMany({
    where: { status: "active", ...roleFilter },
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
    take: 100,
  });
}
