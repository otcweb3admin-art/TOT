"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";

export type SaveMerchantProfileState = { error: string } | undefined;

/**
 * Create or update a Merchant's profile asset (P2-002 Server Action).
 *
 * Security: auth is verified inside the action via requireUser() (Server Actions are
 * reachable via direct POST). `merchantId` is bound server-side (not read from client
 * FormData). Upserts the 1-1 MerchantProfile and records created/updated by the current
 * user's UserProfile.id.
 */
export async function saveMerchantProfile(
  merchantId: string,
  _prevState: SaveMerchantProfileState,
  formData: FormData,
): Promise<SaveMerchantProfileState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantWriteAccess(user, merchantId);
  if (accessError) {
    return { error: accessError };
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true },
  });
  if (!merchant) {
    return { error: "商家不存在。" };
  }

  // Optional summary fields -> trimmed string or null.
  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };
  const fields = {
    industryDetail: opt("industryDetail"),
    targetCustomerSummary: opt("targetCustomerSummary"),
    coreOfferSummary: opt("coreOfferSummary"),
    currentAcquisitionSummary: opt("currentAcquisitionSummary"),
    onlinePresenceSummary: opt("onlinePresenceSummary"),
    growthGoalSummary: opt("growthGoalSummary"),
    executionLimitSummary: opt("executionLimitSummary"),
    baselineDataSummary: opt("baselineDataSummary"),
    notes: opt("notes"),
  };

  // TODO(later phase): role/permission check. P2-002 = any logged-in user may edit
  // any merchant's profile (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantProfile.upsert({
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
