"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

export type SaveLeadConversionState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type LeadConversionStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-006 minimal lead-conversion plan (P2-009 Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantLeadConversion. Records the merchant's CURRENT TB-004 content operation id
 * AND TB-005 live planning id as upstream inputs (soft pointers; null if missing). NOT ad
 * spend / campaign execution / ROI / attribution algorithms / MVS / platform APIs.
 */
export async function saveMerchantLeadConversion(
  merchantId: string,
  _prevState: SaveLeadConversionState,
  formData: FormData,
): Promise<SaveLeadConversionState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  // Fetch merchant + ids of its current upstream TB-004 content op / TB-005 live planning.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      contentOperation: { select: { id: true } },
      livePlanning: { select: { id: true } },
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
  const status: LeadConversionStatusValue = (
    STATUSES as readonly string[]
  ).includes(rawStatus)
    ? (rawStatus as LeadConversionStatusValue)
    : "draft";

  const fields = {
    status,
    trafficPathSummary: opt("trafficPathSummary"),
    conversionPathSummary: opt("conversionPathSummary"),
    privateDomainSummary: opt("privateDomainSummary"),
    campaignIdeaSummary: opt("campaignIdeaSummary"),
    googleMapsActionSummary: opt("googleMapsActionSummary"),
    paidTrafficTestSummary: opt("paidTrafficTestSummary"),
    p001ReadinessSummary: opt("p001ReadinessSummary"),
    thirtyDayActionSummary: opt("thirtyDayActionSummary"),
    conversionRiskSummary: opt("conversionRiskSummary"),
    attributionMethodSummary: opt("attributionMethodSummary"),
    notes: opt("notes"),
    // Link to the current upstream inputs available at save time (or null).
    sourceContentOperationId: merchant.contentOperation?.id ?? null,
    sourceLivePlanningId: merchant.livePlanning?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-009 = any logged-in user may edit
  // any merchant's lead conversion (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantLeadConversion.upsert({
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
