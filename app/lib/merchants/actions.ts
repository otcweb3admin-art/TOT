"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

export type CreateMerchantState = { error: string } | undefined;

/**
 * Create a Merchant (P2-001 Server Action).
 *
 * Security: Server Actions are reachable via direct POST, so we verify auth INSIDE
 * the action via requireUser() (redirects to /login if unauthenticated). The current
 * user's UserProfile.id is written as both owner and creator.
 */
export async function createMerchant(
  _prevState: CreateMerchantState,
  formData: FormData,
): Promise<CreateMerchantState> {
  const user = await requireUser(); // guard: unauthenticated -> redirect /login

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "商家名称必填。" };
  }

  // Optional intake fields -> trimmed string or null (empty stays null).
  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const merchant = await prisma.merchant.create({
    data: {
      name,
      industry: opt("industry"),
      city: opt("city"),
      country: opt("country"),
      contactName: opt("contactName"),
      contactPhone: opt("contactPhone"),
      contactEmail: opt("contactEmail"),
      notes: opt("notes"),
      // status defaults to `lead` (schema default).
      ownerProfileId: user.profileId,
      createdByProfileId: user.profileId,
    },
  });

  revalidatePath("/dashboard/merchants");
  redirect(`/dashboard/merchants/${merchant.id}`);
}
