"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

export type SaveDataReviewState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type DataReviewStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-007 minimal data review (P2-010 Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantDataReview. Records the merchant's CURRENT baseline / TB-004 / TB-005 /
 * TB-006 ids as upstream inputs (soft pointers; null if missing). NOT a full MVS, NOT
 * auto attribution / ROI / reports, NOT AI review, NOT a full TB-007 output set.
 */
export async function saveMerchantDataReview(
  merchantId: string,
  _prevState: SaveDataReviewState,
  formData: FormData,
): Promise<SaveDataReviewState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  // Fetch merchant + ids of its current upstream baseline / TB-004 / TB-005 / TB-006.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      baseline: { select: { id: true } },
      contentOperation: { select: { id: true } },
      livePlanning: { select: { id: true } },
      leadConversion: { select: { id: true } },
    },
  });
  if (!merchant) {
    return { error: "商家不存在。" };
  }

  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const rawStatus = String(formData.get("status") ?? "draft").trim();
  const status: DataReviewStatusValue = (STATUSES as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as DataReviewStatusValue)
    : "draft";

  const fields = {
    status,
    reviewPeriodLabel: opt("reviewPeriodLabel"),
    goalCompletionSummary: opt("goalCompletionSummary"),
    contentEffectSummary: opt("contentEffectSummary"),
    liveEffectSummary: opt("liveEffectSummary"),
    leadConversionEffectSummary: opt("leadConversionEffectSummary"),
    realBusinessDataSummary: opt("realBusinessDataSummary"),
    problemDiagnosisSummary: opt("problemDiagnosisSummary"),
    optimizationSuggestionSummary: opt("optimizationSuggestionSummary"),
    strategyJudgmentSummary: opt("strategyJudgmentSummary"),
    attributionObservationSummary: opt("attributionObservationSummary"),
    reviewRiskSummary: opt("reviewRiskSummary"),
    notes: opt("notes"),
    // Link to the current upstream inputs available at save time (or null).
    sourceBaselineMetricId: merchant.baseline?.id ?? null,
    sourceContentOperationId: merchant.contentOperation?.id ?? null,
    sourceLivePlanningId: merchant.livePlanning?.id ?? null,
    sourceLeadConversionId: merchant.leadConversion?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-010 = any logged-in user may edit
  // any merchant's data review (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantDataReview.upsert({
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
