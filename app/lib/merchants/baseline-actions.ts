"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { assertMerchantNodeWriteAccess } from "@/lib/merchants/role-access";

export type SaveBaselineState = { error: string } | undefined;

const CONFIDENCE = ["unknown", "low", "medium", "high"] as const;
type Confidence = (typeof CONFIDENCE)[number];

/**
 * Create or update a Merchant's pre-growth baseline metrics (P2-003 Server Action).
 *
 * Security: requireUser() inside the action; merchantId bound server-side. Upserts the
 * 1-1 MerchantBaselineMetric. Numeric fields are validated (empty -> null, non-numeric or
 * negative -> form error, no DB write). NOT a full metric/MVS/ROI system.
 */
export async function saveMerchantBaselineMetric(
  merchantId: string,
  _prevState: SaveBaselineState,
  formData: FormData,
): Promise<SaveBaselineState> {
  const user = await requireUser(); // guard: unauthenticated -> /login

  const accessError = await assertMerchantNodeWriteAccess(user, merchantId, "baseline");
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

  const errors: string[] = [];

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  // Non-negative integer or null; bad input -> push error + undefined.
  const intField = (key: string, label: string): number | null | undefined => {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw === "") return null;
    if (!/^\d+$/.test(raw)) {
      errors.push(`${label}必须是非负整数。`);
      return undefined;
    }
    return Number(raw);
  };

  // Non-negative decimal (kept as validated string for Prisma Decimal) or null.
  const decField = (key: string, label: string): string | null | undefined => {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw === "") return null;
    if (!/^\d+(\.\d+)?$/.test(raw)) {
      errors.push(`${label}必须是非负数字。`);
      return undefined;
    }
    return raw;
  };

  const periodLabel = str("periodLabel");
  const monthlyRevenue = decField("monthlyRevenue", "月营业额");
  const monthlyCustomerCount = intField("monthlyCustomerCount", "月客户数");
  const monthlyLeadCount = intField("monthlyLeadCount", "月咨询数");
  const monthlyConversionCount = intField("monthlyConversionCount", "月成交数");
  const averageOrderValue = decField("averageOrderValue", "客单价");
  const repeatCustomerRate = decField("repeatCustomerRate", "复购率");
  const followerCount = intField("followerCount", "粉丝数");
  const reviewCount = intField("reviewCount", "评论数");
  const averageRating = decField("averageRating", "平均评分");
  const sourceNote = str("sourceNote");
  const notes = str("notes");

  const rawConfidence = String(formData.get("dataConfidence") ?? "unknown").trim();
  const dataConfidence: Confidence = (CONFIDENCE as readonly string[]).includes(
    rawConfidence,
  )
    ? (rawConfidence as Confidence)
    : "unknown";

  // Reject bad numeric input WITHOUT writing dirty data.
  if (errors.length > 0) {
    return { error: errors.join(" ") };
  }

  const data = {
    periodLabel,
    monthlyRevenue: monthlyRevenue as string | null,
    monthlyCustomerCount: monthlyCustomerCount as number | null,
    monthlyLeadCount: monthlyLeadCount as number | null,
    monthlyConversionCount: monthlyConversionCount as number | null,
    averageOrderValue: averageOrderValue as string | null,
    repeatCustomerRate: repeatCustomerRate as string | null,
    followerCount: followerCount as number | null,
    reviewCount: reviewCount as number | null,
    averageRating: averageRating as string | null,
    sourceNote,
    dataConfidence,
    notes,
  };

  // TODO(later phase): role/permission check. P2-003 = any logged-in user may edit
  // any merchant's baseline (no owner-only restriction yet — see PROJECT_STATE.md).
  await prisma.merchantBaselineMetric.upsert({
    where: { merchantId },
    update: { ...data, updatedByProfileId: user.profileId },
    create: {
      merchantId,
      ...data,
      createdByProfileId: user.profileId,
      updatedByProfileId: user.profileId,
    },
  });

  revalidatePath(`/dashboard/merchants/${merchantId}`);
  redirect(`/dashboard/merchants/${merchantId}`);
}
