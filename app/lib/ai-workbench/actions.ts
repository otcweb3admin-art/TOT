"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { merchantVisibilityWhere } from "@/lib/merchants/permissions";
import { canCreateWorkItemType } from "@/lib/tasks/access";
import { getAiTask } from "@/lib/ai-workbench/tasks";
import { buildAiDraftReviewWorkItemData } from "@/lib/ai-workbench/draft-review";

// ===== Submit an AI draft for human review (TASK-072) =====
// Thin wrapper over the WorkItem foundation: creates ONE WorkItem(type=ai_draft_review,
// status=submitted) carrying the human-pasted/edited draft. It does NOT save anything to a
// business node, does NOT call any AI API, does NOT approve/complete anything — the draft
// only enters the operator review queue. Permission goes through the SAME task rule
// (canCreateWorkItemType) — operator/admin only, never bypassed.

export type SubmitAiDraftState = { error: string } | undefined;

export async function createAiDraftReviewWorkItem(
  _prevState: SubmitAiDraftState,
  formData: FormData,
): Promise<SubmitAiDraftState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  if (!canCreateWorkItemType(user.role, "ai_draft_review")) {
    return {
      error: `当前角色（${user.role}）不可提交 AI 草稿审核任务；请交给 operator / admin。`,
    };
  }

  const task = getAiTask(String(formData.get("aiTaskKey") ?? ""));
  if (!task) return { error: "AI 任务类型无效，请重新选择任务后再提交。" };

  const aiOutput = String(formData.get("aiOutput") ?? "").trim();
  if (!aiOutput) return { error: "AI 草稿内容为空——请先把 AI 输出粘贴进来并人工检查。" };

  // Visibility-aware merchant load: missing and no-access both yield the SAME error
  // (no existence leak), and it returns the name needed for the task title.
  const merchantId = String(formData.get("merchantId") ?? "");
  const merchant = merchantId
    ? await prisma.merchant.findFirst({
        where: { id: merchantId, ...merchantVisibilityWhere(user) },
        select: { id: true, name: true },
      })
    : null;
  if (!merchant) return { error: "商家不存在或无权访问，请重新选择商家。" };

  const created = await prisma.workItem.create({
    data: buildAiDraftReviewWorkItemData({
      task,
      merchantId: merchant.id,
      merchantName: merchant.name,
      aiOutput,
      createdByProfileId: user.profileId,
      reviewerProfileId: user.role === "operator" ? user.profileId : null,
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  redirect(`/dashboard/tasks/${created.id}`);
}
