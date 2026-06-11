"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role, WorkItemPriority, WorkItemType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, type CurrentUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";
import {
  canCreateWorkItemType,
  workItemVisibilityWhere,
  checkStartWorkItem,
  checkSubmitWorkItem,
  checkSubmitOutsourceResult,
  checkRequestWorkItemChanges,
  checkApproveWorkItem,
  checkCompleteWorkItem,
  checkCancelWorkItem,
  checkAssignWorkItem,
  checkConfirmClientWorkItem,
  checkRequestClientWorkItemChanges,
} from "@/lib/tasks/access";

// ===== WorkItem server actions (TASK-071) =====
// Every action: requireUser → visibility-aware fetch (no existence leak) → task permission
// check (lib/tasks/access) → ONE explicit human-triggered status change. NO auto-advance to
// a next stage, NO AI call, NO notification, NO side effect beyond the task row itself.

export type WorkItemActionState = { error: string } | undefined;

const TYPES: WorkItemType[] = [
  "collector_intake", "review_intake", "ai_draft_review", "outsource_execution",
  "outsource_review", "client_confirmation", "general_followup",
];
const PRIORITIES: WorkItemPriority[] = ["low", "normal", "high", "urgent"];
// ai_worker is NOT assignable — AI tasks/AIDraft are out of scope (REVIEW_POLICY: AI 无审批权).
const ASSIGNABLE_ROLES: Role[] = ["merchant", "collector", "operator", "executor", "admin"];

const opt = (fd: FormData, k: string): string | null => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};

const ACCESS_FIELDS = {
  id: true,
  type: true,
  status: true,
  assignedProfileId: true,
  createdByProfileId: true,
  assignedRole: true,
} as const;

/** Visibility-aware fetch for actions: missing and no-access both yield the same error. */
async function getActionableWorkItem(user: CurrentUser, workItemId: string) {
  const vis = workItemVisibilityWhere(user);
  if (vis === null) return null;
  return prisma.workItem.findFirst({
    where: { AND: [{ id: workItemId }, vis] },
    select: ACCESS_FIELDS,
  });
}

function revalidateTaskPaths(workItemId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${workItemId}`);
}

/** Create a task (collector → collector_intake only; operator → 运营任务; admin → 全部). */
export async function createWorkItem(
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const type = formData.get("type") as WorkItemType;
  if (!TYPES.includes(type)) return { error: "请选择有效的任务类型。" };
  if (!canCreateWorkItemType(user.role, type)) {
    return { error: `当前角色（${user.role}）无权创建该类型任务。` };
  }

  const title = opt(formData, "title");
  if (!title) return { error: "请填写任务标题。" };

  const merchantId = opt(formData, "merchantId");
  if (merchantId) {
    const accessError = await assertMerchantWriteAccess(user, merchantId);
    if (accessError) return { error: accessError };
  }

  const priorityRaw = String(formData.get("priority") ?? "normal") as WorkItemPriority;
  const priority = PRIORITIES.includes(priorityRaw) ? priorityRaw : "normal";

  const assignedRoleRaw = opt(formData, "assignedRole") as Role | null;
  if (assignedRoleRaw && !ASSIGNABLE_ROLES.includes(assignedRoleRaw)) {
    return { error: "负责人角色无效（ai_worker 不可作为任务负责人）。" };
  }

  let dueAt: Date | null = null;
  const dueRaw = opt(formData, "dueAt");
  if (dueRaw) {
    const d = new Date(dueRaw);
    if (Number.isNaN(d.getTime())) return { error: "截止时间格式无效。" };
    dueAt = d;
  }

  const created = await prisma.workItem.create({
    data: {
      type,
      title,
      merchantId,
      description: opt(formData, "description"),
      requirements: opt(formData, "requirements"),
      acceptanceCriteria: opt(formData, "acceptanceCriteria"),
      priority,
      assignedRole: assignedRoleRaw,
      requiresAi: formData.get("requiresAi") === "on",
      requiresOutsource: formData.get("requiresOutsource") === "on",
      requiresClientConfirmation: formData.get("requiresClientConfirmation") === "on",
      dueAt,
      createdByProfileId: user.profileId,
    },
  });

  revalidateTaskPaths(created.id);
  redirect(`/dashboard/tasks/${created.id}`);
}

/** 开始任务：not_started / assigned / changes_requested → in_progress（负责人触发）。 */
export async function startWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  _formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState; void _formData;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkStartWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  await prisma.workItem.update({ where: { id: wi.id }, data: { status: "in_progress" } });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/** 提交审核：in_progress → submitted（可附成果摘要；等待人工审核，不自动通过）。 */
export async function submitWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkSubmitWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  const resultSummary = opt(formData, "resultSummary");
  await prisma.workItem.update({
    where: { id: wi.id },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      ...(resultSummary ? { resultSummary } : {}),
    },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/**
 * 外包成果提交 (TASK-073)：executor 本人把 成果说明（必填）/ 成果链接 / 补充备注 提交为
 * 待审核成果 → submitted。resultSummary 仅保留最新提交（V1 无版本模型）。不自动 approve /
 * complete / 客户确认，不写商家业务节点，不接文件上传——链接为外部交付地址。
 */
export async function submitOutsourceResult(
  workItemId: string,
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkSubmitOutsourceResult(user, wi);
  if (!c.allowed) return { error: c.reason };

  const description = opt(formData, "resultDescription");
  if (!description) return { error: "成果说明不能为空——请说明你交付了什么、放在哪里。" };
  const link = opt(formData, "resultLink");
  const note = opt(formData, "resultNote");

  const resultSummary = [
    `【成果说明】${description}`,
    link ? `【成果链接】${link}` : null,
    note ? `【补充备注】${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { status: "submitted", submittedAt: new Date(), resultSummary },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/** 退回修改：submitted → changes_requested（operator/admin；必须附修改意见）。 */
export async function requestWorkItemChanges(
  workItemId: string,
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkRequestWorkItemChanges(user, wi);
  if (!c.allowed) return { error: c.reason };

  const reviewNote = opt(formData, "reviewNote");
  if (!reviewNote) return { error: "退回必须填写修改意见，让负责人知道改什么。" };

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { status: "changes_requested", reviewNote, reviewerProfileId: user.profileId },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/** 审核通过：submitted → approved（operator/admin 人工判断；不自动完成、不自动进入下一阶段）。 */
export async function approveWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkApproveWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  const reviewNote = opt(formData, "reviewNote");
  await prisma.workItem.update({
    where: { id: wi.id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      reviewerProfileId: user.profileId,
      ...(reviewNote ? { reviewNote } : {}),
    },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/** 标记完成：approved → completed（operator/admin）。 */
export async function completeWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  _formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState; void _formData;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkCompleteWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { status: "completed", completedAt: new Date() },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/** 取消任务：仅 admin；completed / cancelled 不可取消。 */
export async function cancelWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  _formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState; void _formData;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkCancelWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/**
 * 客户确认通过 (TASK-074)：merchant 本人对分配给自己的 submitted 确认事项点「确认通过」
 * → approved（客户已确认）。不自动 completed / 不自动发布 / 不自动创建后续任务 /
 * 不写商家节点——后续由审核员人工推进。
 */
export async function confirmClientWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  _formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState; void _formData;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "事项不存在或无权访问。" };
  const c = checkConfirmClientWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { status: "approved", approvedAt: new Date(), reviewNote: "【客户确认】客户已确认通过。" },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/**
 * 客户提出修改意见 (TASK-074)：merchant 本人对 submitted 确认事项提交修改意见（必填）
 * → changes_requested，意见写入 reviewNote。不自动退回外包 / 不自动重开 AI 草稿 /
 * 不改业务节点——内部如何处理由审核员决定。
 */
export async function requestClientWorkItemChanges(
  workItemId: string,
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "事项不存在或无权访问。" };
  const c = checkRequestClientWorkItemChanges(user, wi);
  if (!c.allowed) return { error: c.reason };

  const clientNote = opt(formData, "clientNote");
  if (!clientNote) return { error: "修改意见不能为空——请写清楚需要调整的地方。" };

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { status: "changes_requested", reviewNote: `【客户修改意见】${clientNote}` },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}

/** 分配负责人：admin 任意任务；operator 仅 外包执行（目标 executor）/ 客户确认（目标 merchant）。 */
export async function assignWorkItem(
  workItemId: string,
  _prevState: WorkItemActionState,
  formData: FormData,
): Promise<WorkItemActionState> {
  const user = await requireUser();
  void _prevState;

  const wi = await getActionableWorkItem(user, workItemId);
  if (!wi) return { error: "任务不存在或无权访问。" };
  const c = checkAssignWorkItem(user, wi);
  if (!c.allowed) return { error: c.reason };

  const assignedProfileId = opt(formData, "assignedProfileId");
  if (!assignedProfileId) return { error: "请选择要分配的负责人。" };
  const target = await prisma.userProfile.findUnique({
    where: { id: assignedProfileId },
    select: { id: true, role: true, status: true },
  });
  if (!target || target.status !== "active") return { error: "目标账号不存在或未启用。" };
  if (target.role === "ai_worker") return { error: "ai_worker 不可作为任务负责人。" };
  if (user.role === "operator") {
    if (wi.type === "outsource_execution" && target.role !== "executor") {
      return { error: "operator 分配外包任务时，负责人必须是 executor。" };
    }
    if (wi.type === "client_confirmation" && target.role !== "merchant") {
      return { error: "operator 分配客户确认事项时，负责人必须是 merchant（客户）。" };
    }
  }

  await prisma.workItem.update({
    where: { id: wi.id },
    data: { assignedProfileId: target.id, assignedRole: target.role, status: "assigned" },
  });
  revalidateTaskPaths(wi.id);
  redirect(`/dashboard/tasks/${wi.id}`);
}
