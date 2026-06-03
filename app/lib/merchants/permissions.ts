import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

// ===== P2 Permission Foundation (TASK-040) =====
// MINIMAL merchant-level access isolation. NOT a complex RBAC matrix, NOT org/tenant,
// NOT a merchant portal, NOT invites/billing. Uses the existing Merchant.ownerProfileId
// / Merchant.createdByProfileId — no schema change.
//
//   - admin  → every merchant (full visibility + write)
//   - others → only merchants they OWN or CREATED
//
// NOTE: roles other than `admin` (operator/collector/executor/merchant/ai_worker) all get
// the same "own merchants only" scope for now (safest minimal default). Per-role nuance is
// later-phase work.

/** Minimal access subject — only what permission checks need from the current user. */
type AccessUser = { profileId: string; role: Role };
/** Merchant ownership fields used by the access predicate. */
type MerchantOwnership = { ownerProfileId: string; createdByProfileId: string };

/** True when the user may view/write this merchant (admin → all; others → own/created). */
export function canAccessMerchant(
  user: AccessUser,
  merchant: MerchantOwnership,
): boolean {
  if (user.role === "admin") return true;
  return (
    merchant.ownerProfileId === user.profileId ||
    merchant.createdByProfileId === user.profileId
  );
}

/**
 * Prisma `where` fragment for the merchants a user may see — spread into a list query
 * (admin → `{}` = no filter; others → owner OR creator). Also used by getMerchantById to
 * AND with the id so unauthorized access yields null (no existence leak -> page 404s).
 */
export function merchantVisibilityWhere(user: AccessUser) {
  if (user.role === "admin") return {};
  return {
    OR: [
      { ownerProfileId: user.profileId },
      { createdByProfileId: user.profileId },
    ],
  };
}

/**
 * Server-action write guard: confirm a merchant exists AND the user may write it.
 * Returns an error message to surface to the form, or null when allowed. Defense-in-depth
 * alongside the page-level visibility check (an unauthorized user is already 404'd at the
 * page, so they cannot reach the bound action; this protects direct POSTs too).
 */
export async function assertMerchantWriteAccess(
  user: AccessUser,
  merchantId: string,
): Promise<string | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { ownerProfileId: true, createdByProfileId: true },
  });
  if (!merchant) return "商家不存在。";
  if (!canAccessMerchant(user, merchant)) return "无权操作该商家。";
  return null;
}
