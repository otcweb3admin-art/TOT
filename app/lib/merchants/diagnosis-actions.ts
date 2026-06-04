"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantNodeWriteAccess } from "@/lib/merchants/role-access";

export type SaveDiagnosisState = { error: string } | undefined;

const STATUSES = ["draft", "completed", "archived"] as const;
type DiagnosisStatusValue = (typeof STATUSES)[number];

/**
 * Create or update a Merchant's TB-001 minimal diagnosis (P2-004 Server Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantDiagnosis. Records the merchant's CURRENT profile / baseline ids as the
 * upstream inputs used (soft pointers). NOT AI, NOT scoring, NOT a full TB-001 form.
 */
export async function saveMerchantDiagnosis(
  merchantId: string,
  _prevState: SaveDiagnosisState,
  formData: FormData,
): Promise<SaveDiagnosisState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantNodeWriteAccess(user, merchantId, "diagnosis");
  if (accessError) {
    return { error: accessError };
  }

  // Fetch merchant + the ids of its current upstream inputs (profile / baseline).
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      profile: { select: { id: true } },
      baseline: { select: { id: true } },
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
  const status: DiagnosisStatusValue = (STATUSES as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as DiagnosisStatusValue)
    : "draft";

  const fields = {
    status,
    diagnosisSummary: opt("diagnosisSummary"),
    growthProblemSummary: opt("growthProblemSummary"),
    opportunitySummary: opt("opportunitySummary"),
    riskSummary: opt("riskSummary"),
    recommendedNextStep: opt("recommendedNextStep"),
    // Link to the upstream inputs that were available at save time.
    sourceProfileId: merchant.profile?.id ?? null,
    sourceBaselineMetricId: merchant.baseline?.id ?? null,
  };

  // TODO(later phase): role/permission check. P2-004 = any logged-in user may edit
  // any merchant's diagnosis (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantDiagnosis.upsert({
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
