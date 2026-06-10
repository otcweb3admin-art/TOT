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
import { buildOperatingHealthSnapshot } from "@/lib/merchants/operating-health";
import { getNodeRoleUI } from "@/lib/merchants/workspace-role-ui";
import {
  canEditMerchantNode,
  canCreateMerchant,
  assertMerchantNodeWriteAccess,
  canSubmitHandoffFrom,
  canReceiveHandoff,
  canCancelHandoff,
} from "@/lib/merchants/role-access";
import { AI_TASKS, getAiTask } from "@/lib/ai-workbench/tasks";
import { ROLE_HOME, getRoleHome } from "@/lib/dashboard/role-home";
import { buildAiMerchantContext } from "@/lib/ai-workbench/context";
import { buildAiPrompt } from "@/lib/ai-workbench/prompts";

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
    // P2-022: handoffs cascade with their merchant — confirm no residue.
    const handoffResidue = await prisma.merchantStageHandoff.count({
      where: { merchant: { name: { startsWith: PREFIX } } },
    });
    cleanupOk = remain === 0 && handoffResidue === 0;
    console.log(
      `\n[cleanup] deleted merchants=${delM.count} temp-profiles=${delP.count}; remaining ${PREFIX} merchants=${remain} handoffs=${handoffResidue} -> ${cleanupOk ? "CLEAN" : "DIRTY"}`,
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
  const profile = await prisma.merchantProfile.create({
    data: { merchantId: full.id, currentAcquisitionSummary: "smoke channel", coreOfferSummary: "smoke offer", ...audit },
  });
  await prisma.merchantBaselineMetric.create({ data: { merchantId: full.id, monthlyRevenue: 50000, ...audit } });
  // 8 TB nodes -> status "completed"; diagnosis carries an upstream pointer to exercise it.
  await prisma.merchantDiagnosis.create({ data: { merchantId: full.id, status: "completed", sourceProfileId: profile.id, ...audit } });
  await prisma.merchantAccountSetup.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantMaterialCollection.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantContentOperation.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantLivePlanning.create({ data: { merchantId: full.id, status: "completed", hostPeopleRequirementSummary: "smoke host", ...audit } });
  await prisma.merchantLeadConversion.create({
    data: {
      merchantId: full.id,
      status: "completed",
      trafficPathSummary: "smoke traffic",
      conversionPathSummary: "smoke conversion",
      attributionMethodSummary: "smoke attribution",
      privateDomainSummary: "smoke private domain",
      ...audit,
    },
  });
  await prisma.merchantDataReview.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  await prisma.merchantNinetyDayGrowthPlan.create({ data: { merchantId: full.id, status: "completed", ...audit } });
  // P2-016 operating capacity: fulfillment capacity (signal) + organization capacity + risk (attention).
  await prisma.merchantOperatingCapacity.create({
    data: {
      merchantId: full.id,
      status: "completed",
      responseProcessSummary: "smoke fulfillment capacity",
      ownerDependencySummary: "smoke org capacity",
      organizationRiskSummary: "smoke org risk",
      ...audit,
    },
  });

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
    operatingCapacity: true,
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
  check("role-ui: every workspace node has UI meta (Phase A)", wsFull.nodes.every((n) => getNodeRoleUI(n.key) !== null));

  const wsEmpty = buildMerchantWorkspace(emptyM);
  check("empty merchant: all 10 nodes missing", wsEmpty.nodes.every((n) => n.status === "missing"));
  check("empty merchant: firstMissing = profile", wsEmpty.firstMissing?.key === "profile", `first=${wsEmpty.firstMissing?.key}`);
  check("empty merchant: next-step suggests filling first node", wsEmpty.nextStep.title.startsWith("建议优先补齐"));

  // 6) OPERATING HEALTH helper (TASK-044) ------------------------------------------------
  console.log("\n[operating health helper]");
  const ORGAN_KEYS = ["channel", "offer", "fulfillment", "cashflow", "organization"];
  const ohFull = buildOperatingHealthSnapshot(fullM);
  check("full merchant: 5 organs built", ohFull.organs.length === 5, `count=${ohFull.organs.length}`);
  check("full merchant: organs are the five expected", ORGAN_KEYS.every((k) => ohFull.organs.some((o) => o.key === k)));
  check("full merchant: no organ is missing (data present)", ohFull.organs.every((o) => o.status !== "missing"));
  const ohEmpty = buildOperatingHealthSnapshot(emptyM);
  check("empty merchant: 5 organs built", ohEmpty.organs.length === 5, `count=${ohEmpty.organs.length}`);
  check("empty merchant: has missing/unknown (no fake health)", ohEmpty.missingEvidenceCount >= 1 && ohEmpty.organs.every((o) => o.status !== "signal"));
  const ffE = ohEmpty.organs.find((o) => o.key === "fulfillment");
  const orgE = ohEmpty.organs.find((o) => o.key === "organization");
  check("empty merchant: fulfillment = unknown + weakSignalOnly", ffE?.status === "unknown" && ffE?.weakSignalOnly === true, `status=${ffE?.status}`);
  check("empty merchant: organization = unknown + weakSignalOnly", orgE?.status === "unknown" && orgE?.weakSignalOnly === true, `status=${orgE?.status}`);
  // empty merchant: Fulfillment/Organization have no dedicated data -> weak-signal (never faked healthy)
  check("empty merchant: fulfillment/organization are weak-signal (not faked healthy)", [ffE, orgE].every((o) => o?.weakSignalOnly === true));

  // 7) OPERATING CAPACITY intake (TASK-045) ----------------------------------------------
  console.log("\n[operating capacity intake -> health]");
  const ffF = ohFull.organs.find((o) => o.key === "fulfillment");
  const orgF = ohFull.organs.find((o) => o.key === "organization");
  check("full merchant: fulfillment reads capacity asset (signal, not weak)", ffF?.status === "signal" && ffF?.weakSignalOnly === false, `status=${ffF?.status} weak=${ffF?.weakSignalOnly}`);
  check("full merchant: fulfillment source includes 经营承接能力采集", !!ffF?.sources.includes("经营承接能力采集"));
  check("full merchant: organization w/ risk -> attention (not weak)", orgF?.status === "attention" && orgF?.weakSignalOnly === false, `status=${orgF?.status} weak=${orgF?.weakSignalOnly}`);
  check("full merchant: organization source includes 经营承接能力采集", !!orgF?.sources.includes("经营承接能力采集"));
  const ocCount = await prisma.merchantOperatingCapacity.count({ where: { merchant: { name: { startsWith: PREFIX } } } });
  check("operating capacity row created for smoke merchant", ocCount === 1, `count=${ocCount}`);

  // 8) ROLE-BASED NODE WRITE GUARD (TASK-056) --------------------------------------------
  console.log("\n[role-access helper]");
  const ALL_NODES = ["merchant", "profile", "baseline", "operating_capacity", "diagnosis", "account_setup", "material_collection", "content_operation", "live_planning", "lead_conversion", "data_review", "growth_plan"];
  check("admin canEdit ALL nodes", ALL_NODES.every((k) => canEditMerchantNode("admin", k)));
  check("collector canEdit profile/baseline/operating_capacity/material_collection", ["profile", "baseline", "operating_capacity", "material_collection"].every((k) => canEditMerchantNode("collector", k)));
  check("collector CANNOT edit lead_conversion/data_review/growth_plan", ["lead_conversion", "data_review", "growth_plan"].every((k) => !canEditMerchantNode("collector", k)));
  check("executor canEdit account_setup/content_operation/live_planning/lead_conversion", ["account_setup", "content_operation", "live_planning", "lead_conversion"].every((k) => canEditMerchantNode("executor", k)));
  check("executor CANNOT edit baseline/diagnosis/growth_plan", ["baseline", "diagnosis", "growth_plan"].every((k) => !canEditMerchantNode("executor", k)));
  check("operator canEdit diagnosis/data_review/growth_plan", ["diagnosis", "data_review", "growth_plan"].every((k) => canEditMerchantNode("operator", k)));
  check("ai_worker canEdit NO node", ALL_NODES.every((k) => !canEditMerchantNode("ai_worker", k)));
  check("merchant canEdit NO internal node", ALL_NODES.every((k) => !canEditMerchantNode("merchant", k)));
  const ownerAdmin = { profileId: owner.id, role: "admin" };
  const ownerCollector = { profileId: owner.id, role: "collector" };
  const otherOperator = { profileId: other.id, role: "operator" };
  check("owner+admin may write growth_plan (null)", (await assertMerchantNodeWriteAccess(ownerAdmin, full.id, "growth_plan")) === null);
  check("owner+collector blocked on lead_conversion (node-level)", (await assertMerchantNodeWriteAccess(ownerCollector, full.id, "lead_conversion")) !== null);
  check("non-owner operator blocked even on editable diagnosis (merchant-level wins)", (await assertMerchantNodeWriteAccess(otherOperator, full.id, "diagnosis")) !== null);
  check("create-merchant: collector/operator allowed, ai_worker/merchant blocked", canCreateMerchant("collector") && canCreateMerchant("operator") && !canCreateMerchant("ai_worker") && !canCreateMerchant("merchant"));

  // 9) STAGE HANDOFF (TASK-057, Phase C) -------------------------------------------------
  console.log("\n[stage handoff]");
  const handoff = await prisma.merchantStageHandoff.create({
    data: { merchantId: full.id, fromNode: "diagnosis", toNode: "account_setup", receivedByRole: "executor", status: "submitted", summary: "smoke handoff", submittedByProfileId: owner.id },
  });
  const hCount = await prisma.merchantStageHandoff.count({ where: { merchant: { name: { startsWith: PREFIX } } } });
  check("handoff created (status submitted)", hCount === 1 && handoff.status === "submitted", `count=${hCount}`);
  check("submit: operator from diagnosis allowed; collector from diagnosis blocked", canSubmitHandoffFrom("operator", "diagnosis") && !canSubmitHandoffFrom("collector", "diagnosis"));
  check("submit: ai_worker / merchant cannot submit", !canSubmitHandoffFrom("ai_worker", "diagnosis") && !canSubmitHandoffFrom("merchant", "diagnosis"));
  check("receive: executor (target) and admin can; operator (non-target) cannot", canReceiveHandoff("executor", "executor") && canReceiveHandoff("admin", "executor") && !canReceiveHandoff("operator", "executor"));
  check("cancel: submitter and admin can; other non-submitter cannot", canCancelHandoff({ profileId: owner.id, role: "operator" }, owner.id) && canCancelHandoff({ profileId: other.id, role: "admin" }, owner.id) && !canCancelHandoff({ profileId: other.id, role: "operator" }, owner.id));
  // transition works at the DB layer (received)
  const recv = await prisma.merchantStageHandoff.update({ where: { id: handoff.id }, data: { status: "received", receivedByProfileId: other.id, receivedAt: new Date() } });
  check("handoff DB transition submitted -> received", recv.status === "received" && recv.receivedByProfileId === other.id);

  // 10) AI WORKBENCH helpers (TASK-065) — pure prompt flow, no API, no save -------------
  console.log("\n[ai-workbench helpers]");
  check("7 AI tasks defined; unknown key -> null", AI_TASKS.length === 7 && getAiTask("diagnosis") !== null && getAiTask("nope") === null);
  const ctxFull = buildAiMerchantContext(fullM);
  const ctxEmpty = buildAiMerchantContext(emptyM);
  check("context: full merchant builds (商家 + 五器官)", ctxFull.text.includes("【商家】") && ctxFull.text.includes("五器官"));
  check("context: empty merchant marks gaps 待补充 (never faked)", ctxEmpty.text.includes("待补充") && ctxEmpty.missing.length > 0);
  const aiPrompt = buildAiPrompt(getAiTask("diagnosis")!, ctxFull);
  check("prompt: carries safety rules (no fabrication / no growth promise)", aiPrompt.includes("不得编造数据") && aiPrompt.includes("不得承诺增长结果") && aiPrompt.includes("待补充"));
  check("prompt: carries task structure + merchant context", aiPrompt.includes("TB-001 商家诊断") && aiPrompt.includes("已知事实摘要") && aiPrompt.includes("【商家】"));

  // 11) ROLE HOME mapping (TASK-070, Phase 1 role routing) -------------------------------
  console.log("\n[role-home mapping]");
  const ALL_ROLES = ["merchant", "collector", "operator", "executor", "admin", "ai_worker"] as const;
  check("role-home covers all 6 roles with workspace names", ALL_ROLES.every((r) => (ROLE_HOME[r]?.workspaceName ?? "").length > 0));
  check("every role has description + duties + boundaries + nextHint", ALL_ROLES.every((r) => { const h = ROLE_HOME[r]; return h.description.length > 0 && h.duties.length > 0 && h.boundaries.length > 0 && h.nextHint.length > 0; }));
  check("ai_worker is NOT a human workspace", getRoleHome("ai_worker").humanWorkspace === false && ALL_ROLES.filter((r) => r !== "ai_worker").every((r) => getRoleHome(r).humanWorkspace === true));
  check("operator maps to 人工审核 (not generic ops)", getRoleHome("operator").workspaceName.includes("人工审核"));
  check("admin maps to 平台管理; merchant/collector/executor named sensibly", getRoleHome("admin").workspaceName.includes("平台管理") && getRoleHome("merchant").workspaceName.includes("客户") && getRoleHome("collector").workspaceName.includes("采集") && getRoleHome("executor").workspaceName.includes("外包"));
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
