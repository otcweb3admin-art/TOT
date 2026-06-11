import type { Role, WorkItemType, WorkItemStatus } from "@prisma/client";
import { merchantVisibilityWhere } from "@/lib/merchants/permissions";

// ===== WorkItem 任务权限 V1 (TASK-071) =====
// MINIMAL task-level permission ON TOP OF the existing merchant-level visibility
// (TASK-040) and node write guard (TASK-056) — it does NOT replace either. Uses only the
// real Role enum. Pure functions + Prisma where-builders so the smoke script can import
// this file (no "server-only"). Status transitions stay HUMAN-triggered: nothing here
// auto-advances a task, AI (ai_worker) can neither see nor operate tasks.

/** Minimal subject for task permission checks. */
export type TaskUser = { profileId: string; role: Role };

/** The fields permission checks need from a WorkItem row. */
export type WorkItemAccessFields = {
  type: WorkItemType;
  status: WorkItemStatus;
  assignedProfileId: string | null;
  createdByProfileId: string | null;
  assignedRole: Role | null;
};

export type WorkItemActionCheck = { allowed: boolean; reason: string };

const ALLOWED: WorkItemActionCheck = { allowed: true, reason: "" };
const deny = (reason: string): WorkItemActionCheck => ({ allowed: false, reason });

// ---- which types each role may CREATE (V1 rules per TASK-071 spec) ----
const CREATABLE: Record<Role, WorkItemType[] | "all"> = {
  admin: "all", // 兜底；UI 提醒 admin 不是日常运营账号
  operator: [
    "review_intake",
    "ai_draft_review",
    "outsource_execution",
    "outsource_review",
    "client_confirmation",
    "general_followup",
  ],
  collector: ["collector_intake"],
  executor: [], // 外包只执行，不创建内部任务
  merchant: [], // 客户不创建内部任务
  ai_worker: [], // AI 不操作真人任务
};

export function canCreateWorkItemType(role: Role, type: WorkItemType): boolean {
  const c = CREATABLE[role];
  return c === "all" || c.includes(type);
}

export function creatableWorkItemTypes(role: Role): WorkItemType[] {
  const c = CREATABLE[role];
  if (c === "all") {
    return [
      "collector_intake",
      "review_intake",
      "ai_draft_review",
      "outsource_execution",
      "outsource_review",
      "client_confirmation",
      "general_followup",
    ];
  }
  return c;
}

export function canCreateAnyWorkItem(role: Role): boolean {
  return creatableWorkItemTypes(role).length > 0;
}

/** operator / admin are the only human review roles (REVIEW_POLICY: AI never approves). */
export function canReviewWorkItems(role: Role): boolean {
  return role === "operator" || role === "admin";
}

// ---- visibility: Prisma where fragment; null = this role sees NO tasks ----
// admin     → all tasks
// operator  → tasks of accessible merchants + merchant-less tasks they're involved in
// collector → assigned-to-me / created-by-me / collector_intake of accessible merchants
// executor  → ONLY outsource_execution assigned to me (no other outsource tasks)
// merchant  → ONLY client_confirmation assigned to me (V1: no merchant-user binding yet)
// ai_worker → nothing
// Combined with the task id via AND in lookups → unauthorized = null (no existence leak).
export function workItemVisibilityWhere(user: TaskUser): Record<string, unknown> | null {
  switch (user.role) {
    case "admin":
      return {};
    case "operator":
      return {
        OR: [
          { merchant: merchantVisibilityWhere(user) },
          {
            AND: [
              { merchantId: null },
              {
                OR: [
                  { assignedProfileId: user.profileId },
                  { createdByProfileId: user.profileId },
                  { reviewerProfileId: user.profileId },
                  { assignedRole: "operator" },
                ],
              },
            ],
          },
        ],
      };
    case "collector":
      return {
        OR: [
          { assignedProfileId: user.profileId },
          { createdByProfileId: user.profileId },
          {
            AND: [
              { type: "collector_intake" },
              { merchant: merchantVisibilityWhere(user) },
            ],
          },
        ],
      };
    case "executor":
      return { type: "outsource_execution", assignedProfileId: user.profileId };
    case "merchant":
      return { type: "client_confirmation", assignedProfileId: user.profileId };
    case "ai_worker":
      return null;
  }
}

// ---- per-action checks (status machine is enforced here; reasons surface in the UI) ----

/** Roles that can never push a task forward themselves. */
function isOperatingRole(role: Role): boolean {
  return role !== "ai_worker" && role !== "merchant";
}

/** The "actor" of a task: admin; the assignee; or (when unassigned) its creator / role queue. */
function isTaskActor(user: TaskUser, wi: WorkItemAccessFields): boolean {
  if (!isOperatingRole(user.role)) return false;
  if (user.role === "admin") return true;
  if (wi.assignedProfileId) return wi.assignedProfileId === user.profileId;
  return wi.createdByProfileId === user.profileId || wi.assignedRole === user.role;
}

export function checkStartWorkItem(user: TaskUser, wi: WorkItemAccessFields): WorkItemActionCheck {
  if (!isTaskActor(user, wi)) {
    return deny("仅任务负责人（或对应负责角色 / admin）可开始此任务。");
  }
  if (!["not_started", "assigned", "changes_requested"].includes(wi.status)) {
    return deny("仅「未开始 / 已分配 / 退回修改」状态的任务可开始。");
  }
  return ALLOWED;
}

export function checkSubmitWorkItem(user: TaskUser, wi: WorkItemAccessFields): WorkItemActionCheck {
  if (!isTaskActor(user, wi)) {
    return deny("仅任务负责人（或对应负责角色 / admin）可提交此任务。");
  }
  if (wi.status !== "in_progress") {
    return deny("仅「进行中」的任务可提交审核；被退回的任务请先「开始任务」再修改重交。");
  }
  return ALLOWED;
}

export function checkRequestWorkItemChanges(
  user: TaskUser,
  wi: WorkItemAccessFields,
): WorkItemActionCheck {
  if (!canReviewWorkItems(user.role)) {
    return deny("仅人工审核（operator）或 admin 可退回任务。");
  }
  if (wi.status !== "submitted") return deny("仅「待审核」状态的任务可退回修改。");
  return ALLOWED;
}

export function checkApproveWorkItem(user: TaskUser, wi: WorkItemAccessFields): WorkItemActionCheck {
  if (!canReviewWorkItems(user.role)) {
    return deny("仅人工审核（operator）或 admin 可审核通过。");
  }
  if (wi.status !== "submitted") return deny("仅「待审核」状态的任务可审核通过。");
  return ALLOWED;
}

export function checkCompleteWorkItem(user: TaskUser, wi: WorkItemAccessFields): WorkItemActionCheck {
  if (!canReviewWorkItems(user.role)) {
    return deny("仅人工审核（operator）或 admin 可标记完成。");
  }
  if (wi.status !== "approved") return deny("仅「审核通过」的任务可标记完成（先审核再完成）。");
  return ALLOWED;
}

export function checkCancelWorkItem(user: TaskUser, wi: WorkItemAccessFields): WorkItemActionCheck {
  if (user.role !== "admin") return deny("仅 admin 可取消任务。");
  if (wi.status === "completed" || wi.status === "cancelled") {
    return deny("已完成 / 已取消的任务不可再取消。");
  }
  return ALLOWED;
}

/** Assign a concrete profile: admin any task; operator only outsource_execution（分配外包）. */
export function checkAssignWorkItem(user: TaskUser, wi: WorkItemAccessFields): WorkItemActionCheck {
  if (user.role !== "admin" && !(user.role === "operator" && wi.type === "outsource_execution")) {
    return deny("仅 admin 可修改任意分配；operator 仅可分配外包执行任务。");
  }
  if (!["not_started", "assigned"].includes(wi.status)) {
    return deny("仅「未开始 / 已分配」状态的任务可（重新）分配负责人。");
  }
  return ALLOWED;
}
