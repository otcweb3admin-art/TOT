"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

export type SaveContentOperationState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type ContentOperationStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-004 minimal content-operation plan (P2-007 Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantContentOperation. Records the merchant's CURRENT TB-003 material collection
 * id as the upstream input (soft pointer; null if none). NOT content publishing, NOT a
 * calendar, NOT AI copy, NOT a full TB-004 output set.
 */
export async function saveMerchantContentOperation(
  merchantId: string,
  _prevState: SaveContentOperationState,
  formData: FormData,
): Promise<SaveContentOperationState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  // Fetch merchant + the id of its current upstream TB-003 material collection.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, materialCollection: { select: { id: true } } },
  });
  if (!merchant) {
    return { error: "商家不存在。" };
  }

  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const rawStatus = String(formData.get("status") ?? "draft").trim();
  const status: ContentOperationStatusValue = (
    STATUSES as readonly string[]
  ).includes(rawStatus)
    ? (rawStatus as ContentOperationStatusValue)
    : "draft";

  const fields = {
    status,
    contentPositioningSummary: opt("contentPositioningSummary"),
    contentPillarSummary: opt("contentPillarSummary"),
    contentRatioSummary: opt("contentRatioSummary"),
    publishingFrequencySummary: opt("publishingFrequencySummary"),
    toneStyleSummary: opt("toneStyleSummary"),
    contentBoundarySummary: opt("contentBoundarySummary"),
    first30DayPlanSummary: opt("first30DayPlanSummary"),
    contentRiskSummary: opt("contentRiskSummary"),
    notes: opt("notes"),
    // Link to the current TB-003 material collection available at save time (or null).
    sourceMaterialCollectionId: merchant.materialCollection?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-007 = any logged-in user may edit
  // any merchant's content operation (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantContentOperation.upsert({
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
