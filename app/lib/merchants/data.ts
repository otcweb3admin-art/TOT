import "server-only";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/dal";
import { merchantVisibilityWhere } from "@/lib/merchants/permissions";

/**
 * Merchant data access (P2-001 + P2 permission foundation TASK-040).
 *
 * Access is scoped to the current user: `admin` sees all merchants; other roles see only
 * merchants they own or created (see merchantVisibilityWhere). Callers MUST pass the
 * current user, so visibility is enforced at the data layer and cannot be forgotten.
 */
export function listMerchants(user: CurrentUser) {
  return prisma.merchant.findMany({
    where: merchantVisibilityWhere(user),
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });
}

export function getMerchantById(id: string, user: CurrentUser) {
  // findFirst (not findUnique) so the id can be ANDed with the visibility filter: returns
  // null for both "missing" and "no access" — no existence leak; callers notFound() on null.
  return prisma.merchant.findFirst({
    where: { id, ...merchantVisibilityWhere(user) },
    include: {
      owner: true,
      createdBy: true,
      // P2-002~011: the 1-1 asset chain (each with its updater) for the detail / node pages.
      profile: { include: { updatedBy: true, createdBy: true } },
      baseline: { include: { updatedBy: true } },
      diagnosis: { include: { updatedBy: true } },
      accountSetup: { include: { updatedBy: true } },
      materialCollection: { include: { updatedBy: true } },
      contentOperation: { include: { updatedBy: true } },
      livePlanning: { include: { updatedBy: true } },
      leadConversion: { include: { updatedBy: true } },
      dataReview: { include: { updatedBy: true } },
      ninetyDayGrowthPlan: { include: { updatedBy: true } },
      // P2-016: operating capacity (Fulfillment + Organization intake).
      operatingCapacity: { include: { updatedBy: true } },
      // P2-022: stage handoff records (Phase C), newest first.
      stageHandoffs: {
        include: { submittedBy: true, receivedBy: true, reviewedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
