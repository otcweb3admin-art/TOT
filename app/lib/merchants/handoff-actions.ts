"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MerchantStageNode, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";
import {
  canSubmitHandoffFrom,
  canReceiveHandoff,
  canCancelHandoff,
} from "@/lib/merchants/role-access";

export type HandoffState = { error: string } | undefined;

const NODES: MerchantStageNode[] = [
  "merchant", "profile", "baseline", "operating_capacity", "diagnosis",
  "account_setup", "material_collection", "content_operation", "live_planning",
  "lead_conversion", "data_review", "growth_plan", "workspace",
];
const ROLES: Role[] = ["merchant", "collector", "operator", "executor", "admin", "ai_worker"];

const pickNode = (v: unknown): MerchantStageNode | null =>
  NODES.includes(v as MerchantStageNode) ? (v as MerchantStageNode) : null;
const pickRole = (v: unknown): Role | null =>
  ROLES.includes(v as Role) ? (v as Role) : null;
const opt = (fd: FormData, k: string): string | null => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};

/**
 * Record a node-to-node handoff (Phase C / TASK-057). RECORD ONLY: status=submitted; NO
 * auto-approval, NO auto-transition, does NOT change any node status or lock anything.
 * Security: requireUser() + merchant access (TASK-040) + fromNode submit permission
 * (ai_worker/merchant blocked; else node edit role). merchantId bound server-side.
 */
export async function createMerchantStageHandoff(
  merchantId: string,
  _prevState: HandoffState,
  formData: FormData,
): Promise<HandoffState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantWriteAccess(user, merchantId);
  if (accessError) return { error: accessError };

  const fromNode = pickNode(formData.get("fromNode"));
  const toNode = pickNode(formData.get("toNode"));
  const receivedByRole = pickRole(formData.get("receivedByRole"));
  if (!fromNode || !toNode || !receivedByRole) {
    return { error: "请选择有效的 fromNode / toNode / 接收角色。" };
  }
  if (!canSubmitHandoffFrom(user.role, fromNode)) {
    return { error: `当前角色（${user.role}）无权从该节点提交交接；请交给对应负责角色。` };
  }

  await prisma.merchantStageHandoff.create({
    data: {
      merchantId,
      fromNode,
      toNode,
      receivedByRole,
      status: "submitted",
      summary: opt(formData, "summary"),
      gapSummary: opt(formData, "gapSummary"),
      riskSummary: opt(formData, "riskSummary"),
      evidenceSummary: opt(formData, "evidenceSummary"),
      submittedByProfileId: user.profileId,
    },
  });

  revalidatePath(`/dashboard/merchants/${merchantId}/workspace`);
  redirect(`/dashboard/merchants/${merchantId}/workspace`);
}

/**
 * Mark a submitted handoff as received by the current user (target role or admin). Does NOT
 * approve / transition / change any node status — it only records receipt.
 */
export async function markMerchantStageHandoffReceived(
  handoffId: string,
  _prevState: HandoffState,
  _formData: FormData,
): Promise<HandoffState> {
  const user = await requireUser();
  void _prevState;
  void _formData;

  const h = await prisma.merchantStageHandoff.findUnique({
    where: { id: handoffId },
    select: { id: true, merchantId: true, status: true, receivedByRole: true },
  });
  if (!h) return { error: "交接记录不存在。" };

  const accessError = await assertMerchantWriteAccess(user, h.merchantId);
  if (accessError) return { error: accessError };
  if (h.status !== "submitted") return { error: "该交接当前不可接收。" };
  if (!canReceiveHandoff(user.role, h.receivedByRole)) {
    return { error: `仅 ${h.receivedByRole} 或 admin 可接收此交接。` };
  }

  await prisma.merchantStageHandoff.update({
    where: { id: h.id },
    data: { status: "received", receivedByProfileId: user.profileId, receivedAt: new Date() },
  });

  revalidatePath(`/dashboard/merchants/${h.merchantId}/workspace`);
  redirect(`/dashboard/merchants/${h.merchantId}/workspace`);
}

/** Cancel a submitted handoff (only its submitter or admin). Does not affect node status. */
export async function cancelMerchantStageHandoff(
  handoffId: string,
  _prevState: HandoffState,
  _formData: FormData,
): Promise<HandoffState> {
  const user = await requireUser();
  void _prevState;
  void _formData;

  const h = await prisma.merchantStageHandoff.findUnique({
    where: { id: handoffId },
    select: { id: true, merchantId: true, status: true, submittedByProfileId: true },
  });
  if (!h) return { error: "交接记录不存在。" };

  const accessError = await assertMerchantWriteAccess(user, h.merchantId);
  if (accessError) return { error: accessError };
  if (h.status !== "submitted") return { error: "仅可取消待接收（submitted）的交接。" };
  if (!canCancelHandoff({ profileId: user.profileId, role: user.role }, h.submittedByProfileId)) {
    return { error: "仅提交人或 admin 可取消此交接。" };
  }

  await prisma.merchantStageHandoff.update({
    where: { id: h.id },
    data: { status: "cancelled" },
  });

  revalidatePath(`/dashboard/merchants/${h.merchantId}/workspace`);
  redirect(`/dashboard/merchants/${h.merchantId}/workspace`);
}
