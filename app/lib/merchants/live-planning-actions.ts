"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";

export type SaveLivePlanningState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type LivePlanningStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-005 minimal live-planning plan (P2-008 Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantLivePlanning. Records the merchant's CURRENT TB-004 content operation id
 * as the upstream input (soft pointer; null if none). NOT a live scheduling/streaming
 * system, NOT AI talk-tracks, NOT platform APIs, NOT a full TB-005 output set.
 */
export async function saveMerchantLivePlanning(
  merchantId: string,
  _prevState: SaveLivePlanningState,
  formData: FormData,
): Promise<SaveLivePlanningState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantWriteAccess(user, merchantId);
  if (accessError) {
    return { error: accessError };
  }

  // Fetch merchant + the id of its current upstream TB-004 content operation.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, contentOperation: { select: { id: true } } },
  });
  if (!merchant) {
    return { error: "商家不存在。" };
  }

  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const rawStatus = String(formData.get("status") ?? "draft").trim();
  const status: LivePlanningStatusValue = (STATUSES as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as LivePlanningStatusValue)
    : "draft";

  const fields = {
    status,
    feasibilitySummary: opt("feasibilitySummary"),
    platformSummary: opt("platformSummary"),
    liveGoalSummary: opt("liveGoalSummary"),
    liveFormatSummary: opt("liveFormatSummary"),
    liveTopicSummary: opt("liveTopicSummary"),
    liveFrequencySummary: opt("liveFrequencySummary"),
    hostPeopleRequirementSummary: opt("hostPeopleRequirementSummary"),
    readinessSummary: opt("readinessSummary"),
    liveRiskSummary: opt("liveRiskSummary"),
    notes: opt("notes"),
    // Link to the current TB-004 content operation available at save time (or null).
    sourceContentOperationId: merchant.contentOperation?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-008 = any logged-in user may edit
  // any merchant's live planning (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantLivePlanning.upsert({
    where: { merchantId },
    update: { ...fields, updatedByProfileId: user.profileId },
    create: {
      merchantId,
      ...fields,
      createdByProfileId: user.profileId,
      updatedByProfileId: user.profileId,
    },
  });

  revalidatePath(`/dashboard/merchants/${merchantId}`);
  redirect(`/dashboard/merchants/${merchantId}`);
}
