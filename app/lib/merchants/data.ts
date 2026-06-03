import "server-only";
import { prisma } from "@/lib/db";

/**
 * Merchant data access (P2-001 Merchant Intake Foundation).
 *
 * P2-001 scope: read all merchants. Visibility/permission filtering by role/owner is
 * intentionally NOT implemented yet — it lands with the permission model in a later
 * phase (see PROJECT_STATE.md "权限原则"). Marked here so it is not forgotten.
 */
export function listMerchants() {
  // TODO(later phase): filter by current user's role / ownership / org visibility.
  return prisma.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });
}

export function getMerchantById(id: string) {
  return prisma.merchant.findUnique({
    where: { id },
    include: {
      owner: true,
      createdBy: true,
      // P2-002: include the 1-1 profile asset (with its updater) for the detail page.
      profile: { include: { updatedBy: true, createdBy: true } },
      // P2-003: include the 1-1 baseline metric asset (with its updater).
      baseline: { include: { updatedBy: true } },
      // P2-004: include the 1-1 TB-001 minimal diagnosis (with its updater).
      diagnosis: { include: { updatedBy: true } },
      // P2-005: include the 1-1 TB-002 account setup (with its updater).
      accountSetup: { include: { updatedBy: true } },
      // P2-006: include the 1-1 TB-003 material collection (with its updater).
      materialCollection: { include: { updatedBy: true } },
    },
  });
}
