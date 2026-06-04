"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantNodeWriteAccess } from "@/lib/merchants/role-access";

export type SaveGrowthPlanState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type GrowthPlanStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-008 minimal 90-day growth plan (P2-011 Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantNinetyDayGrowthPlan. Records the merchant's CURRENT baseline / TB-001
 * diagnosis / TB-006 lead conversion / TB-007 data review ids as upstream inputs (soft
 * pointers; null if missing). NOT a full execution system, NOT auto scheduling / KPI /
 * AI plan generation, NOT a full TB-008 output set.
 */
export async function saveMerchantNinetyDayGrowthPlan(
  merchantId: string,
  _prevState: SaveGrowthPlanState,
  formData: FormData,
): Promise<SaveGrowthPlanState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantNodeWriteAccess(user, merchantId, "growth_plan");
  if (accessError) {
    return { error: accessError };
  }

  // Fetch merchant + ids of current upstream baseline / TB-001 / TB-006 / TB-007.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      baseline: { select: { id: true } },
      diagnosis: { select: { id: true } },
      leadConversion: { select: { id: true } },
      dataReview: { select: { id: true } },
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
  const status: GrowthPlanStatusValue = (STATUSES as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as GrowthPlanStatusValue)
    : "draft";

  const fields = {
    status,
    planPeriodLabel: opt("planPeriodLabel"),
    stageGoalSummary: opt("stageGoalSummary"),
    roadmapSummary: opt("roadmapSummary"),
    platformPrioritySummary: opt("platformPrioritySummary"),
    contentRouteSummary: opt("contentRouteSummary"),
    leadConversionRouteSummary: opt("leadConversionRouteSummary"),
    kpiSummary: opt("kpiSummary"),
    riskSummary: opt("riskSummary"),
    cycleJudgmentSummary: opt("cycleJudgmentSummary"),
    nextStageDirectionSummary: opt("nextStageDirectionSummary"),
    notes: opt("notes"),
    // Link to the current upstream inputs available at save time (or null).
    sourceBaselineMetricId: merchant.baseline?.id ?? null,
    sourceDiagnosisId: merchant.diagnosis?.id ?? null,
    sourceLeadConversionId: merchant.leadConversion?.id ?? null,
    sourceDataReviewId: merchant.dataReview?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-011 = any logged-in user may edit
  // any merchant's growth plan (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantNinetyDayGrowthPlan.upsert({
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
