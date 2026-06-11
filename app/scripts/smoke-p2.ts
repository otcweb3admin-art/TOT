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
import {
  canCreateWorkItemType,
  workItemVisibilityWhere,
  checkStartWorkItem,
  checkSubmitWorkItem,
  checkSubmitOutsourceResult,
  checkApproveWorkItem,
  checkRequestWorkItemChanges,
  checkCompleteWorkItem,
  checkCancelWorkItem,
} from "@/lib/tasks/access";
import {
  WORK_ITEM_TYPES,
  WORK_ITEM_STATUSES,
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_TYPE_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_PRIORITY_LABELS,
} from "@/lib/tasks/display";
import {
  AI_TASK_TARGET_NODE,
  aiTaskForTargetNode,
  buildAiDraftReviewWorkItemData,
} from "@/lib/ai-workbench/draft-review";

const PREFIX = "SMOKE_TEST_";

let pass = 0;
let fail = 0;
let cleanupOk = false;
// TASK-071: DEMO_/UAT_ isolation — counts captured in run(), re-checked in cleanup().
let demoMerchantsBefore = -1;
let uatMerchantsBefore = -1;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function cleanup(): Promise<void> {
  try {
    // TASK-071: work items first (merchant-less smoke tasks are matched by title prefix;
    // merchant-bound ones would cascade anyway). STRICT prefix filters only.
    const delW = await prisma.workItem.deleteMany({
      where: {
        OR: [
          { title: { startsWith: PREFIX } },
          { merchant: { name: { startsWith: PREFIX } } },
        ],
      },
    });
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
    const workItemResidue = await prisma.workItem.count({
      where: { title: { startsWith: PREFIX } },
    });
    // TASK-071: DEMO_/UAT_ untouched by the smoke run + cleanup.
    const demoAfter = await prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } });
    const uatAfter = await prisma.merchant.count({ where: { name: { startsWith: "UAT_" } } });
    const isolationOk = demoAfter === demoMerchantsBefore && uatAfter === uatMerchantsBefore;
    cleanupOk = remain === 0 && handoffResidue === 0 && workItemResidue === 0 && isolationOk;
    console.log(
      `\n[cleanup] deleted merchants=${delM.count} temp-profiles=${delP.count} work-items=${delW.count}; remaining ${PREFIX} merchants=${remain} handoffs=${handoffResidue} work-items=${workItemResidue}; DEMO ${demoMerchantsBefore}->${demoAfter} UAT ${uatMerchantsBefore}->${uatAfter} ${isolationOk ? "UNTOUCHED" : "CHANGED!"} -> ${cleanupOk ? "CLEAN" : "DIRTY"}`,
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

  // TASK-071: capture DEMO_/UAT_ counts up-front — cleanup() re-checks they are untouched.
  demoMerchantsBefore = await prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } });
  uatMerchantsBefore = await prisma.merchant.count({ where: { name: { startsWith: "UAT_" } } });

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

  // 12) WORK ITEM / TASK CENTER (TASK-071) -----------------------------------------------
  console.log("\n[work item / task center]");
  // enum + display coverage: 7 types / 8 statuses / 4 priorities all labeled in Chinese.
  check("work-item enums exist with full 中文 display maps (7 types / 8 statuses / 4 priorities)",
    WORK_ITEM_TYPES.length === 7 && WORK_ITEM_STATUSES.length === 8 && WORK_ITEM_PRIORITIES.length === 4 &&
    WORK_ITEM_TYPES.every((t) => (WORK_ITEM_TYPE_LABELS[t] ?? "").length > 0) &&
    WORK_ITEM_STATUSES.every((s) => (WORK_ITEM_STATUS_LABELS[s] ?? "").length > 0) &&
    WORK_ITEM_PRIORITIES.every((p) => (WORK_ITEM_PRIORITY_LABELS[p] ?? "").length > 0));

  // creation rules per role.
  check("collector may create collector_intake ONLY",
    canCreateWorkItemType("collector", "collector_intake") &&
    !canCreateWorkItemType("collector", "outsource_execution") &&
    !canCreateWorkItemType("collector", "client_confirmation"));
  check("operator may create review/ai-draft/outsource/client/followup (not collector_intake)",
    (["review_intake", "ai_draft_review", "outsource_execution", "outsource_review", "client_confirmation", "general_followup"] as const).every((t) => canCreateWorkItemType("operator", t)) &&
    !canCreateWorkItemType("operator", "collector_intake"));
  check("admin may create ALL types; merchant/executor/ai_worker may create NONE",
    WORK_ITEM_TYPES.every((t) => canCreateWorkItemType("admin", t)) &&
    WORK_ITEM_TYPES.every((t) => !canCreateWorkItemType("merchant", t) && !canCreateWorkItemType("executor", t) && !canCreateWorkItemType("ai_worker", t)));

  // create SMOKE_TEST_ tasks (strict prefix; cleaned in cleanup()).
  const taskIntake = await prisma.workItem.create({
    data: { title: `${PREFIX}TASK_INTAKE_${ts}`, type: "collector_intake", merchantId: full.id, createdByProfileId: owner.id, assignedRole: "collector" },
  });
  check("work item created (defaults: not_started / normal)", taskIntake.status === "not_started" && taskIntake.priority === "normal");

  // collector lifecycle on own intake task: start -> submit; never approve.
  const ownerAsCollector = { profileId: owner.id, role: "collector" as const };
  const ownerAsOperator = { profileId: owner.id, role: "operator" as const };
  check("collector (creator) may start own intake task", checkStartWorkItem(ownerAsCollector, taskIntake).allowed === true);
  const intakeInProgress = await prisma.workItem.update({ where: { id: taskIntake.id }, data: { status: "in_progress" } });
  check("collector may submit own in-progress intake task", checkSubmitWorkItem(ownerAsCollector, intakeInProgress).allowed === true);
  const intakeSubmitted = await prisma.workItem.update({ where: { id: taskIntake.id }, data: { status: "submitted", submittedAt: new Date() } });
  check("collector CANNOT approve a submitted task", checkApproveWorkItem(ownerAsCollector, intakeSubmitted).allowed === false);
  check("operator CAN approve / request changes on submitted", checkApproveWorkItem(ownerAsOperator, intakeSubmitted).allowed === true && checkRequestWorkItemChanges(ownerAsOperator, intakeSubmitted).allowed === true);
  const intakeApproved = await prisma.workItem.update({ where: { id: taskIntake.id }, data: { status: "approved", approvedAt: new Date(), reviewerProfileId: owner.id } });
  check("DB transition submitted -> approved recorded", intakeApproved.status === "approved" && intakeApproved.reviewerProfileId === owner.id);
  check("complete: operator allowed from approved ONLY", checkCompleteWorkItem(ownerAsOperator, intakeApproved).allowed === true && checkCompleteWorkItem(ownerAsOperator, intakeSubmitted).allowed === false);
  check("cancel: admin only (operator/collector denied)", checkCancelWorkItem({ profileId: owner.id, role: "admin" }, intakeApproved).allowed === true && checkCancelWorkItem(ownerAsOperator, intakeApproved).allowed === false && checkCancelWorkItem(ownerAsCollector, intakeApproved).allowed === false);

  // executor visibility: ONLY outsource_execution assigned to self.
  const exec1 = await prisma.userProfile.create({
    data: { authUserId: randomUUID(), email: `${PREFIX}exec1_${ts}@smoke.local`, role: "executor", status: "active" },
  });
  const exec2 = await prisma.userProfile.create({
    data: { authUserId: randomUUID(), email: `${PREFIX}exec2_${ts}@smoke.local`, role: "executor", status: "active" },
  });
  const taskOutA = await prisma.workItem.create({
    data: { title: `${PREFIX}TASK_OUT_A_${ts}`, type: "outsource_execution", merchantId: full.id, status: "assigned", assignedRole: "executor", assignedProfileId: exec1.id, createdByProfileId: owner.id },
  });
  await prisma.workItem.create({
    data: { title: `${PREFIX}TASK_OUT_B_${ts}`, type: "outsource_execution", merchantId: full.id, status: "assigned", assignedRole: "executor", assignedProfileId: exec2.id, createdByProfileId: owner.id },
  });
  const exec1User = { profileId: exec1.id, role: "executor" as const };
  const exec1Vis = workItemVisibilityWhere(exec1User);
  const exec1Sees = await prisma.workItem.findMany({ where: { AND: [{ title: { startsWith: PREFIX } }, exec1Vis!] } });
  check("executor sees ONLY the outsource task assigned to himself", exec1Sees.length === 1 && exec1Sees[0].id === taskOutA.id, `count=${exec1Sees.length}`);
  check("executor does NOT see other executors' tasks nor internal review tasks", exec1Sees.every((w) => w.type === "outsource_execution" && w.assignedProfileId === exec1.id));
  check("no existence leak: executor lookup of internal task returns null", (await prisma.workItem.findFirst({ where: { AND: [{ id: taskIntake.id }, exec1Vis!] } })) === null);
  check("executor may start/submit own assigned task but never approve",
    checkStartWorkItem(exec1User, taskOutA).allowed === true &&
    checkSubmitWorkItem(exec1User, { ...taskOutA, status: "in_progress" }).allowed === true &&
    checkApproveWorkItem(exec1User, { ...taskOutA, status: "submitted" }).allowed === false);

  // ai_worker: sees nothing, operates nothing.
  const aiUser = { profileId: other.id, role: "ai_worker" as const };
  check("ai_worker sees NO tasks (visibility null) and cannot start/approve",
    workItemVisibilityWhere(aiUser) === null &&
    checkStartWorkItem(aiUser, taskOutA).allowed === false &&
    checkApproveWorkItem(aiUser, intakeSubmitted).allowed === false);

  // admin sees all; merchant sees only own client_confirmation (none here).
  const adminVis = workItemVisibilityWhere({ profileId: other.id, role: "admin" })!;
  const adminSees = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: PREFIX } }, adminVis] } });
  check("admin sees ALL smoke tasks", adminSees === 3, `count=${adminSees}`);
  const merchVis = workItemVisibilityWhere({ profileId: other.id, role: "merchant" })!;
  const merchSees = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: PREFIX } }, merchVis] } });
  check("merchant sees only own client_confirmation tasks (0 here; no internal leak)", merchSees === 0, `count=${merchSees}`);

  // 13) AI DRAFT -> ai_draft_review TASK (TASK-072) ----------------------------------------
  console.log("\n[ai draft review task]");
  check("create permission: operator/admin yes; collector/executor/merchant/ai_worker NO",
    canCreateWorkItemType("operator", "ai_draft_review") && canCreateWorkItemType("admin", "ai_draft_review") &&
    !canCreateWorkItemType("collector", "ai_draft_review") && !canCreateWorkItemType("executor", "ai_draft_review") &&
    !canCreateWorkItemType("merchant", "ai_draft_review") && !canCreateWorkItemType("ai_worker", "ai_draft_review"));
  const diagAiTask = getAiTask("diagnosis")!;
  check("AI task -> target node map covers all 7 AI tasks + reverse lookup works",
    AI_TASKS.every((t) => !!AI_TASK_TARGET_NODE[t.key]) &&
    aiTaskForTargetNode("diagnosis")?.key === "diagnosis" &&
    aiTaskForTargetNode("material_collection")?.key === "materials" &&
    aiTaskForTargetNode(null) === null);

  // capture the diagnosis node BEFORE the review flow — approval must NOT touch it.
  const diagBefore = await prisma.merchantDiagnosis.findUnique({ where: { merchantId: full.id }, select: { diagnosisSummary: true, updatedAt: true } });

  const aiDraftData = buildAiDraftReviewWorkItemData({
    task: diagAiTask,
    merchantId: full.id,
    merchantName: full.name,
    aiOutput: "SMOKE 草稿正文：主要问题判断（待验证）；无承诺。",
    createdByProfileId: owner.id,
    reviewerProfileId: owner.id,
  });
  const aiDraft = await prisma.workItem.create({ data: aiDraftData });
  check("ai draft task created: type=ai_draft_review status=submitted", aiDraft.type === "ai_draft_review" && aiDraft.status === "submitted" && aiDraft.submittedAt !== null);
  check("ai draft task: requiresAi=true, assignedRole=operator, priority normal", aiDraft.requiresAi === true && aiDraft.assignedRole === "operator" && aiDraft.priority === "normal");
  check("ai draft task: targetNode=diagnosis, sourceNode=workspace", aiDraft.targetNode === "diagnosis" && aiDraft.sourceNode === "workspace");
  check("ai draft task: resultSummary carries the draft; title carries task+merchant", (aiDraft.resultSummary ?? "").includes("SMOKE 草稿正文") && aiDraft.title.startsWith("审核 AI 草稿：商家诊断草稿") && aiDraft.title.includes(full.name));
  check("ai draft task: requirements/acceptance carry review discipline (人工审核/待验证/不承诺)", (aiDraft.requirements ?? "").includes("待验证") && (aiDraft.requirements ?? "").includes("不会自动写入业务节点") && (aiDraft.acceptanceCriteria ?? "").includes("无增长承诺"));

  // operator home stat: aiDraftSubmitted counts it (replicates getWorkItemStatsForUser query).
  const opVis = workItemVisibilityWhere({ profileId: owner.id, role: "operator" })!;
  const aiDraftSubmittedCount = await prisma.workItem.count({ where: { AND: [opVis, { type: "ai_draft_review", status: "submitted" }] } });
  check("operator home stat counts the submitted AI draft", aiDraftSubmittedCount >= 1, `count=${aiDraftSubmittedCount}`);

  // operator approves — and the merchant node stays untouched (no auto-save).
  check("operator may approve the submitted ai draft", checkApproveWorkItem({ profileId: owner.id, role: "operator" }, aiDraft).allowed === true);
  const aiApproved = await prisma.workItem.update({ where: { id: aiDraft.id }, data: { status: "approved", approvedAt: new Date(), reviewerProfileId: owner.id } });
  check("ai draft transition submitted -> approved recorded", aiApproved.status === "approved" && aiApproved.approvedAt !== null);
  const diagAfter = await prisma.merchantDiagnosis.findUnique({ where: { merchantId: full.id }, select: { diagnosisSummary: true, updatedAt: true } });
  check("approval did NOT auto-write the diagnosis node (fields + updatedAt unchanged)",
    diagAfter?.diagnosisSummary === diagBefore?.diagnosisSummary &&
    diagAfter?.updatedAt.getTime() === diagBefore?.updatedAt.getTime());

  // 14) OUTSOURCE EXECUTION SUBMISSION (TASK-073) ------------------------------------------
  console.log("\n[outsource submission]");
  // operator creates an outsource task with assignedRole=executor (then assigns exec1).
  check("operator may create outsource_execution", canCreateWorkItemType("operator", "outsource_execution"));
  const tOut = await prisma.workItem.create({
    data: { title: `${PREFIX}TASK_OUT_FLOW_${ts}`, type: "outsource_execution", merchantId: full.id, assignedRole: "executor", createdByProfileId: owner.id, requirements: "smoke 工作要求", acceptanceCriteria: "smoke 验收标准", requiresOutsource: true },
  });
  check("outsource task created with assignedRole=executor (role queue)", tOut.assignedRole === "executor" && tOut.status === "not_started");
  const tAssigned = await prisma.workItem.update({ where: { id: tOut.id }, data: { assignedProfileId: exec1.id, status: "assigned" } });
  check("assign to executor profile -> status assigned", tAssigned.assignedProfileId === exec1.id && tAssigned.status === "assigned");

  // visibility: exec1 sees it, exec2 does not (re-using the TASK-071 temp executor profiles).
  const exec2User = { profileId: exec2.id, role: "executor" as const };
  const exec1SeesFlow = await prisma.workItem.findFirst({ where: { AND: [{ id: tOut.id }, workItemVisibilityWhere(exec1User)!] } });
  const exec2SeesFlow = await prisma.workItem.findFirst({ where: { AND: [{ id: tOut.id }, workItemVisibilityWhere(exec2User)!] } });
  check("assigned executor sees the task; another executor does NOT (no leak)", !!exec1SeesFlow && exec2SeesFlow === null);

  // executor can start; can submit result from assigned/in_progress; others cannot.
  check("executor may start own outsource task", checkStartWorkItem(exec1User, tAssigned).allowed === true);
  check("submit-result allowed for assigned executor (from assigned / in_progress)",
    checkSubmitOutsourceResult(exec1User, tAssigned).allowed === true &&
    checkSubmitOutsourceResult(exec1User, { ...tAssigned, status: "in_progress" }).allowed === true);
  check("submit-result DENIED for operator/admin (no proxy submit), other executor, ai_worker, non-outsource type",
    !checkSubmitOutsourceResult({ profileId: owner.id, role: "operator" }, tAssigned).allowed &&
    !checkSubmitOutsourceResult({ profileId: owner.id, role: "admin" }, tAssigned).allowed &&
    !checkSubmitOutsourceResult(exec2User, tAssigned).allowed &&
    !checkSubmitOutsourceResult({ profileId: exec1.id, role: "ai_worker" }, tAssigned).allowed &&
    !checkSubmitOutsourceResult(exec1User, { ...tAssigned, type: "general_followup" }).allowed);

  // submit result (the action composes 成果说明/链接/备注 -> resultSummary; replicate payload).
  const RESULT = "【成果说明】smoke 已完成 10 张菜单图\n【成果链接】https://example.com/smoke-deliverable\n【补充备注】smoke 备注";
  const tSubmitted = await prisma.workItem.update({ where: { id: tOut.id }, data: { status: "submitted", submittedAt: new Date(), resultSummary: RESULT } });
  check("submitted: status + submittedAt + resultSummary(说明/链接/备注)", tSubmitted.status === "submitted" && tSubmitted.submittedAt !== null && (tSubmitted.resultSummary ?? "").includes("成果链接") && (tSubmitted.resultSummary ?? "").includes("https://example.com/smoke-deliverable"));

  // operator home queue: outsource submitted counted.
  const outsourceSubmittedCount = await prisma.workItem.count({ where: { AND: [workItemVisibilityWhere({ profileId: owner.id, role: "operator" })!, { type: { in: ["outsource_execution", "outsource_review"] }, status: "submitted" }] } });
  check("operator home stat counts submitted outsource result", outsourceSubmittedCount >= 1, `count=${outsourceSubmittedCount}`);

  // review: request changes (note required is enforced by the action) then resubmit then approve.
  check("operator may request changes / approve on submitted outsource", checkRequestWorkItemChanges({ profileId: owner.id, role: "operator" }, tSubmitted).allowed && checkApproveWorkItem({ profileId: owner.id, role: "operator" }, tSubmitted).allowed);
  const tReturned = await prisma.workItem.update({ where: { id: tOut.id }, data: { status: "changes_requested", reviewNote: "smoke 修改意见：图 3 需重拍", reviewerProfileId: owner.id } });
  check("changes_requested recorded with review note", tReturned.status === "changes_requested" && (tReturned.reviewNote ?? "").includes("smoke 修改意见"));
  check("executor may RESUBMIT after changes_requested", checkSubmitOutsourceResult(exec1User, tReturned).allowed === true);
  const tResubmitted = await prisma.workItem.update({ where: { id: tOut.id }, data: { status: "submitted", submittedAt: new Date(), resultSummary: RESULT + "\n【成果说明】v2 已重拍" } });
  check("resubmit overwrites to latest (V1 keeps newest only)", tResubmitted.status === "submitted" && (tResubmitted.resultSummary ?? "").includes("v2 已重拍"));
  const tApproved = await prisma.workItem.update({ where: { id: tOut.id }, data: { status: "approved", approvedAt: new Date(), reviewerProfileId: owner.id } });
  check("approved: NOT auto-completed (completedAt null, status stays approved)", tApproved.status === "approved" && tApproved.completedAt === null);
  const autoClientConfirm = await prisma.workItem.count({ where: { merchantId: full.id, type: "client_confirmation" } });
  check("approval did NOT auto-create a client_confirmation task", autoClientConfirm === 0, `count=${autoClientConfirm}`);

  // merchant / ai_worker boundaries on the outsource task.
  check("merchant cannot see the outsource task; ai_worker cannot operate it",
    (await prisma.workItem.findFirst({ where: { AND: [{ id: tOut.id }, workItemVisibilityWhere({ profileId: other.id, role: "merchant" })!] } })) === null &&
    workItemVisibilityWhere({ profileId: other.id, role: "ai_worker" }) === null);
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
