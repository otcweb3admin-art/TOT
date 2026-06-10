import "server-only";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/dal";
import { merchantVisibilityWhere } from "@/lib/merchants/permissions";

/**
 * Dashboard home / handoff-center read helpers (TASK-063). READ-ONLY queries that REUSE the
 * existing merchant-level visibility filter (TASK-040) — no permission logic is changed
 * here. UI-shell layer only.
 */

/** First DEMO_ merchant visible to the user (for the home-page DEMO entry), or null. */
export function findDemoMerchant(user: CurrentUser) {
  return prisma.merchant.findFirst({
    where: { name: { startsWith: "DEMO_" }, ...merchantVisibilityWhere(user) },
    select: { id: true, name: true },
  });
}

/** Recent stage handoffs across all merchants the user may see (handoff center V0). */
export function listRecentHandoffs(user: CurrentUser, take = 20) {
  return prisma.merchantStageHandoff.findMany({
    where: { merchant: merchantVisibilityWhere(user) },
    include: {
      merchant: { select: { id: true, name: true } },
      submittedBy: { select: { email: true } },
      receivedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
