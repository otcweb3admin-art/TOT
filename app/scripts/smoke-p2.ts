/**
 * P2 smoke test (TASK-042) — minimal, repeatable, low-risk health check of the P2 merchant
 * business chain at the DB + helper layer. NOT a full test suite / E2E / browser test.
 *
 * Covers: env presence, the merchant-level permission helper (canAccessMerchant /
 * merchantVisibilityWhere), the workspace status helper (buildMerchantWorkspace /
 * getFirstMissingNode), and the full Profile -> Baseline -> TB-001~008 asset chain.
 *
 * Test-data hygiene: every row it creates is prefixed SMOKE_TEST_ and removed in a finally
 * cleanup (even on failure). It NEVER prints secrets (env values / tokens / cookies) — only
 * env KEY NAMES and PASS/FAIL lines. Run: `npm run smoke:p2`.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  canAccessMerchant,
  merchantVisibilityWhere,
} from "@/lib/merchants/permissions";
import { buildMerchantWorkspace } from "@/lib/merchants/workspace";

const PREFIX = "SMOKE_TEST_";

let pass = 0;
let fail = 0;
let cleanupOk = false;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function cleanup(): Promise<void> {
  try {
    // Merchant delete cascades to its 1-1 assets (onDelete: Cascade). STRICT prefix filter
    // so real merchant data is never touched.
    const delM = await prisma.merchant.deleteMany({
      where: { name: { startsWith: PREFIX } },
    });
    const delP = await prisma.userProfile.deleteMany({
      where: { email: { startsWith: PREFIX } },
    });
    const remain = await prisma.merchant.count({
      where: { name: { startsWith: PREFIX } },
    });
    cleanupOk = remain === 0;
    console.log(
      `\n[cleanup] deleted merchants=${delM.count} temp-profiles=${delP.count}; remaining ${PREFIX} merchants=${remain} -> ${cleanupOk ? "CLEAN" : "DIRTY"}`,
    );
  } catch (e) {
    console.error("[cleanup] error:", e instanceof Error ? e.message : e);
  }
}

async function run(): Promise<void> {
  // 0) env presence — names only, never values.
  const REQUIRED_ENV = [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
  check(
    "env present (login/db prerequisites)",
    missingEnv.length === 0,
    missingEnv.length ? `MISSING: ${missingEnv.join(",")}` : "all required keys set",
  );

  // 1) auth prerequisite: at least one UserProfile exists (acts as the owner actor).
  const owner = await prisma.userProfile.findFirst({ orderBy: { createdAt: "asc" } });
  check("auth prerequisite: a UserProfile exists (owner actor)", !!owner);
  if (!owner) throw new Error("no UserProfile to act as owner — cannot continue");

  // temp "other" normal user (cleaned up) — for the negative permission case.
  const other = await prisma.userProfile.create({
    data: {
      authUserId: randomUUID(),
      email: `${PREFIX}other_${Date.now()}@smoke.local`,
      role: "operator",
      status: "active",
    },
  });

  const ownerUser = { profileId: owner.id, role: owner.role };
  const otherUser = { profileId: other.id, role: other.role };
  const adminUser = { profileId: other.id, role: "admin" as const };

  // 2) create a SMOKE merchant with the FULL chain (Merchant + 11 assets).
  const ts = Date.now();
  const full = await prisma.merchant.create({
    data: {
      name: `${PREFIX}MERCHANT_${ts}`,
      industry: "smoke",
      ownerProfileId: owner.id,
      createdByProfileId: owner.id,
    },
  });
  const audit = { createdByProfileId: owner.id, updatedByProfileId: owner.id };
  const profile = await prisma.merchantProfile.create({ data: { merchantId: full.id, ...audit } });
  await prisma.merchantBaselineMetric.create({ data: { merchantId: full.id, ...audit } });
  // 8 TB nodes -> status "completed"; diagnosis carries an upstream pointer to exercise it.
  await prisma.merchantDiagnosis.create({ data: { merchantId: full.id, status: "completed", sourceProfileId: profile.id, ...audit } });
  await prisma.merchantAccountSetup.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantMaterialCollection.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantContentOperation.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantLivePlanning.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantLeadConversion.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantDataReview.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantNinetyDayGrowthPlan.create({ data: { merchantId: full.id, status: "completed", ...audit } });

  // 3) an EMPTY smoke merchant (no assets) for the first-missing case.
  const empty = await prisma.merchant.create({
    data: { name: `${PREFIX}EMPTY_${ts}`, ownerProfileId: owner.id, createdByProfileId: owner.id },
  });

  const include = {
    owner: true,
    createdBy: true,
    profile: true,
    baseline: true,
    diagnosis: true,
    accountSetup: true,
    materialCollection: true,
    contentOperation: true,
    livePlanning: true,
    leadConversion: true,
    dataReview: true,
    ninetyDayGrowthPlan: true,
  } as const;

  // 4) PERMISSION helper (TASK-040) ------------------------------------------------------
  console.log("\n[permission helper]");
  check("owner can access own merchant", canAccessMerchant(ownerUser, full) === true);
  check("other normal user CANNOT access merchant", canAccessMerchant(otherUser, full) === false);
  check("admin can access any merchant", canAccessMerchant(adminUser, full) === true);
  // real visibility WHERE against the DB (mirrors getMerchantById/list filtering)
  const ownerSees = await prisma.merchant.findFirst({ where: { id: full.id, ...merchantVisibilityWhere(ownerUser) } });
  check("visibility where: owner query returns the merchant", !!ownerSees);
  const otherSees = await prisma.merchant.findFirst({ where: { id: full.id, ...merchantVisibilityWhere(otherUser) } });
  check("visibility where: other-user query returns null (denied)", otherSees === null);
  const otherList = await prisma.merchant.findMany({ where: { name: { startsWith: PREFIX }, ...merchantVisibilityWhere(otherUser) } });
  check("visibility where: other user lists none of the smoke merchants", otherList.length === 0);

  // 5) WORKSPACE helper (TASK-041) -------------------------------------------------------
  console.log("\n[workspace helper]");
  const fullM = await prisma.merchant.findUnique({ where: { id: full.id }, include });
  const emptyM = await prisma.merchant.findUnique({ where: { id: empty.id }, include });
  if (!fullM || !emptyM) throw new Error("failed to reload smoke merchants");

  const wsFull = buildMerchantWorkspace(fullM);
  check("full merchant: 10 nodes built", wsFull.nodes.length === 10, `count=${wsFull.nodes.length}`);
  check("full merchant: no missing node", wsFull.nodes.every((n) => n.status !== "missing"));
  check("full merchant: firstMissing is null", wsFull.firstMissing === null);
  check("full merchant: completedCount == 10", wsFull.completedCount === 10, `count=${wsFull.completedCount}`);
  check("full merchant: next-step = chain complete", wsFull.nextStep.title === "最小链路已完整");
  const diagNode = wsFull.nodes.find((n) => n.key === "diagnosis");
  check("full merchant: diagnosis node marks upstream referenced", diagNode?.upstreamReferenced === true);

  const wsEmpty = buildMerchantWorkspace(emptyM);
  check("empty merchant: all 10 nodes missing", wsEmpty.nodes.every((n) => n.status === "missing"));
  check("empty merchant: firstMissing = profile", wsEmpty.firstMissing?.key === "profile", `first=${wsEmpty.firstMissing?.key}`);
  check("empty merchant: next-step suggests filling first node", wsEmpty.nextStep.title.startsWith("建议优先补齐"));
}

async function main(): Promise<void> {
  console.log("=== P2 SMOKE TEST (DB + helper layer) ===");
  try {
    await run();
  } finally {
    await cleanup();
  }
}

main()
  .then(() => {
    const allOk = fail === 0 && cleanupOk;
    console.log(`\n=== SUMMARY: ${pass} passed / ${fail} failed; cleanup ${cleanupOk ? "CLEAN" : "INCOMPLETE"} -> ${allOk ? "PASS ✅" : "FAIL ❌"} ===`);
    process.exit(allOk ? 0 : 1);
  })
  .catch((e) => {
    console.error("\nSMOKE FATAL:", e instanceof Error ? e.message : e);
    console.log(`\n=== SUMMARY: ${pass} passed / ${fail} failed; cleanup ${cleanupOk ? "CLEAN" : "INCOMPLETE"} -> FAIL ❌ ===`);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
