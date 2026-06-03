"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";

export type SaveMaterialCollectionState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type MaterialCollectionStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-003 minimal material-collection plan (P2-006 Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantMaterialCollection. Records the merchant's CURRENT TB-002 account setup id
 * as the upstream input (soft pointer; null if none). NOT file upload, NOT a material
 * library, NOT AI analysis, NOT a full TB-003 output set.
 */
export async function saveMerchantMaterialCollection(
  merchantId: string,
  _prevState: SaveMaterialCollectionState,
  formData: FormData,
): Promise<SaveMaterialCollectionState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantWriteAccess(user, merchantId);
  if (accessError) {
    return { error: accessError };
  }

  // Fetch merchant + the id of its current upstream TB-002 account setup.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, accountSetup: { select: { id: true } } },
  });
  if (!merchant) {
    return { error: "商家不存在。" };
  }

  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const rawStatus = String(formData.get("status") ?? "draft").trim();
  const status: MaterialCollectionStatusValue = (
    STATUSES as readonly string[]
  ).includes(rawStatus)
    ? (rawStatus as MaterialCollectionStatusValue)
    : "draft";

  const fields = {
    status,
    materialCategorySummary: opt("materialCategorySummary"),
    materialGapSummary: opt("materialGapSummary"),
    shootingSceneSummary: opt("shootingSceneSummary"),
    peopleMaterialSummary: opt("peopleMaterialSummary"),
    productServiceMaterialSummary: opt("productServiceMaterialSummary"),
    trustMaterialSummary: opt("trustMaterialSummary"),
    brandStoryMaterialSummary: opt("brandStoryMaterialSummary"),
    collectionPrioritySummary: opt("collectionPrioritySummary"),
    collectionRiskSummary: opt("collectionRiskSummary"),
    notes: opt("notes"),
    // Link to the current TB-002 account setup available at save time (or null).
    sourceAccountSetupId: merchant.accountSetup?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-006 = any logged-in user may edit
  // any merchant's material collection (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantMaterialCollection.upsert({
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
