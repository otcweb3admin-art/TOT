"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OperatingCapacityStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";

export type SaveOperatingCapacityState = { error: string } | undefined;

const STATUSES: OperatingCapacityStatus[] = ["draft", "completed", "archived"];

/**
 * Create or update a Merchant's operating capacity asset (P2-016 / TASK-045 Server Action).
 *
 * Captures Fulfillment + Organization承接能力 as SUMMARY facts (no scoring / AI / decision).
 * Security: requireUser() + assertMerchantWriteAccess() inside (Server Actions are reachable
 * via direct POST). `merchantId` is bound server-side. Upserts the 1-1 row and records
 * created/updated by the current user's UserProfile.id. Redirects to the merchant workspace.
 */
export async function saveMerchantOperatingCapacity(
  merchantId: string,
  _prevState: SaveOperatingCapacityState,
  formData: FormData,
): Promise<SaveOperatingCapacityState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantWriteAccess(user, merchantId);
  if (accessError) {
    return { error: accessError };
  }

  // Optional summary field -> trimmed string or null.
  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };
  const rawStatus = String(formData.get("status") ?? "draft");
  const status: OperatingCapacityStatus = STATUSES.includes(
    rawStatus as OperatingCapacityStatus,
  )
    ? (rawStatus as OperatingCapacityStatus)
    : "draft";

  const fields = {
    status,
    // Fulfillment（履约）
    responseProcessSummary: opt("responseProcessSummary"),
    responseTimeSummary: opt("responseTimeSummary"),
    bookingProcessSummary: opt("bookingProcessSummary"),
    serviceCapacitySummary: opt("serviceCapacitySummary"),
    peakHourHandlingSummary: opt("peakHourHandlingSummary"),
    fulfillmentRiskSummary: opt("fulfillmentRiskSummary"),
    customerExperienceRiskSummary: opt("customerExperienceRiskSummary"),
    // Organization（组织）
    ownerDependencySummary: opt("ownerDependencySummary"),
    staffRoleSummary: opt("staffRoleSummary"),
    delegationReadinessSummary: opt("delegationReadinessSummary"),
    standardProcessSummary: opt("standardProcessSummary"),
    trainingReadinessSummary: opt("trainingReadinessSummary"),
    organizationRiskSummary: opt("organizationRiskSummary"),
    // Cross-cutting
    operatingConstraintSummary: opt("operatingConstraintSummary"),
    notes: opt("notes"),
  };

  await prisma.merchantOperatingCapacity.upsert({
    where: { merchantId },
    update: { ...fields, updatedByProfileId: user.profileId },
    create: {
      merchantId,
      ...fields,
      createdByProfileId: user.profileId,
      updatedByProfileId: user.profileId,
    },
  });

  revalidatePath(`/dashboard/merchants/${merchantId}/workspace`);
  revalidatePath(`/dashboard/merchants/${merchantId}`);
  redirect(`/dashboard/merchants/${merchantId}/workspace`);
}
