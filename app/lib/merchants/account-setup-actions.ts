"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";

export type SaveAccountSetupState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type AccountSetupStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-002 minimal account-setup plan (P2-005 Server Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantAccountSetup. Records the merchant's CURRENT TB-001 diagnosis id as the
 * upstream input (soft pointer; null if no diagnosis). NOT real account creation, NOT
 * platform API integration, NOT AI, NOT a full TB-002 output set.
 */
export async function saveMerchantAccountSetup(
  merchantId: string,
  _prevState: SaveAccountSetupState,
  formData: FormData,
): Promise<SaveAccountSetupState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantWriteAccess(user, merchantId);
  if (accessError) {
    return { error: accessError };
  }

  // Fetch merchant + the id of its current upstream TB-001 diagnosis.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, diagnosis: { select: { id: true } } },
  });
  if (!merchant) {
    return { error: "商家不存在。" };
  }

  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const rawStatus = String(formData.get("status") ?? "draft").trim();
  const status: AccountSetupStatusValue = (STATUSES as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as AccountSetupStatusValue)
    : "draft";

  const fields = {
    status,
    platformPlanSummary: opt("platformPlanSummary"),
    accountPositioningSummary: opt("accountPositioningSummary"),
    namingDirection: opt("namingDirection"),
    bioDirection: opt("bioDirection"),
    visualDirectionSummary: opt("visualDirectionSummary"),
    personaDirectionSummary: opt("personaDirectionSummary"),
    googleMapsDirectionSummary: opt("googleMapsDirectionSummary"),
    contactChannelSummary: opt("contactChannelSummary"),
    setupRiskSummary: opt("setupRiskSummary"),
    notes: opt("notes"),
    // Link to the current TB-001 diagnosis available at save time (or null).
    sourceDiagnosisId: merchant.diagnosis?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-005 = any logged-in user may edit
  // any merchant's account setup (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantAccountSetup.upsert({
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
