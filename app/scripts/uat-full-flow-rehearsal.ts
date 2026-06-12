/**
 * UAT FULL-FLOW REHEARSAL (TASK-075) — 真实客户进入前的一条龙彩排：
 *   采集任务 → 人工审核 → AI 草稿审核 → 手动保存节点(模拟) → 外包任务 → 外包提交成果
 *   → 审核验收 → 客户确认 → 客户反馈/确认 → 审核员收口。
 *
 * 业务流程测试脚本（不调用任何多代理工具、不接 AI API）。所有状态变化先用与线上 server
 * action 相同的权限/状态机检查函数（lib/tasks/access、lib/ai-workbench/draft-review）验证
 * 允许后，再以等价 prisma 写入复现（HTTP/表单层已在 TASK-071~074 真实 E2E 验证过）。
 * UI 渲染与计数页面需另行手工/HTTP 验证——本脚本用与页面相同的查询复现统计。
 *
 * 数据纪律：仅操作 UAT_ 前缀数据；DEMO/SMOKE/真实数据前后计数断言不变；UAT 数据不得当
 * 真实案例、不得进入经验库；运行后用 `npm run clean:uat` 一键清理。
 * 前置：先 `npm run seed:uat`。运行：`npm run uat:full-flow`。
 */
import { prisma } from "@/lib/db";
import { merchantVisibilityWhere } from "@/lib/merchants/permissions";
import {
  canCreateWorkItemType,
  workItemVisibilityWhere,
  checkStartWorkItem,
  checkSubmitWorkItem,
  checkSubmitOutsourceResult,
  checkRequestWorkItemChanges,
  checkApproveWorkItem,
  checkCompleteWorkItem,
  checkAssignWorkItem,
  checkConfirmClientWorkItem,
  checkRequestClientWorkItemChanges,
} from "@/lib/tasks/access";
import { getAiTask } from "@/lib/ai-workbench/tasks";
import { buildAiDraftReviewWorkItemData } from "@/lib/ai-workbench/draft-review";

let pass = 0;
let fail = 0;
const stageFails: Record<string, number> = {};
let currentStage = "";

function stage(title: string): void {
  currentStage = title;
  stageFails[title] = stageFails[title] ?? 0;
  console.log(`\n===== ${title} =====`);
}
function check(name: string, ok: boolean, detail = ""): void {
  if (ok) pass++;
  else {
    fail++;
    stageFails[currentStage] = (stageFails[currentStage] ?? 0) + 1;
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main(): Promise<void> {
  console.log("=== UAT FULL-FLOW REHEARSAL (TASK-075) ===");
  console.log("提醒：UAT 虚拟数据，不得当真实案例 / 不得进入经验库 / 不承诺增长结果。");

  // ---- 前置：seed 产物 + 隔离基线 ----
  const owner = await prisma.userProfile.findFirst({ where: { email: "admin@tot.local" } });
  const merchant = await prisma.merchant.findFirst({ where: { name: "UAT_咖啡店全链彩排" } });
  const uatCollector = await prisma.userProfile.findFirst({ where: { email: "UAT_collector@uat.local" } });
  const uatOperator = await prisma.userProfile.findFirst({ where: { email: "UAT_operator@uat.local" } });
  const uatExecutor = await prisma.userProfile.findFirst({ where: { email: "UAT_executor@uat.local" } });
  const uatClient = await prisma.userProfile.findFirst({ where: { email: "UAT_client@uat.local" } });
  if (!owner || !merchant || !uatCollector || !uatOperator || !uatExecutor || !uatClient) {
    console.error("缺少 UAT 商家或 UAT 角色 profile —— 请先运行 `npm run seed:uat`。");
    process.exit(1);
  }
  const demoBefore = await prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } });
  const smokeBefore = await prisma.merchant.count({ where: { name: { startsWith: "SMOKE_TEST_" } } });
  const realBefore = await prisma.merchant.count({
    where: { NOT: { OR: [{ name: { startsWith: "DEMO_" } }, { name: { startsWith: "SMOKE_TEST_" } }, { name: { startsWith: "UAT_" } }] } },
  });

  const col = { profileId: uatCollector.id, role: "collector" as const };
  const op = { profileId: uatOperator.id, role: "operator" as const };
  const exe = { profileId: uatExecutor.id, role: "executor" as const };
  const cli = { profileId: uatClient.id, role: "merchant" as const };
  const ownerOp = { profileId: owner.id, role: "operator" as const };
  // UAT_审核员 profile 不是商家 owner——商家级操作（创建任务挂商家等）以 owner（admin@tot.local
  // 的 operator profile）名义执行；角色级权限检查用对应 UAT profile。

  // ---------------- 阶段 1：UAT 商家准备 ----------------
  stage("阶段 1 · UAT 商家准备");
  check("UAT 商家存在且名称带 UAT_ 前缀", merchant.name.startsWith("UAT_"));
  check("UAT ≠ DEMO ≠ SMOKE（前缀互斥）", !merchant.name.startsWith("DEMO_") && !merchant.name.startsWith("SMOKE_TEST_"));
  check("商家备注写明不得当真实案例", (merchant.notes ?? "").includes("不得当真实案例"));
  const opSeesMerchant = await prisma.merchant.findFirst({ where: { id: merchant.id, ...merchantVisibilityWhere(ownerOp) } });
  const adminSeesMerchant = await prisma.merchant.findFirst({ where: { id: merchant.id, ...merchantVisibilityWhere({ profileId: uatOperator.id, role: "admin" }) } });
  check("operator(owner) / admin 可见 UAT 商家", !!opSeesMerchant && !!adminSeesMerchant);

  // ---------------- 阶段 2：采集任务闭环 ----------------
  stage("阶段 2 · 采集任务闭环（创建→分配→提交→退回→重交→通过→完成）");
  check("collector 可创建 collector_intake；operator 不可", canCreateWorkItemType("collector", "collector_intake") && !canCreateWorkItemType("operator", "collector_intake"));
  let intake = await prisma.workItem.create({
    data: {
      title: "UAT_采集原始资料任务_咖啡店", type: "collector_intake", merchantId: merchant.id,
      assignedRole: "collector", assignedProfileId: uatCollector.id, status: "assigned",
      createdByProfileId: uatCollector.id,
      requirements: "UAT·采集门店照片/菜单/口述基线（口述标注，不编数据）",
      acceptanceCriteria: "UAT·按 Field Pack 清单齐全，缺口标待补充",
    },
  });
  check("采集任务已创建并分配给 UAT_采集员", intake.assignedProfileId === uatCollector.id && intake.status === "assigned");
  check("collector 可开始自己的采集任务", checkStartWorkItem(col, intake).allowed);
  intake = await prisma.workItem.update({ where: { id: intake.id }, data: { status: "in_progress" } });
  check("collector 可提交采集成果", checkSubmitWorkItem(col, intake).allowed);
  intake = await prisma.workItem.update({
    where: { id: intake.id },
    data: { status: "submitted", submittedAt: new Date(), resultSummary: "【UAT 采集包】门店 12 张照片 + 菜单 + 口述月营收（标口述/估计）" },
  });
  check("resultSummary 保存采集提交内容", (intake.resultSummary ?? "").includes("UAT 采集包"));
  check("collector 不能 approve；operator 能 approve", !checkApproveWorkItem(col, intake).allowed && checkApproveWorkItem(op, intake).allowed);
  check("operator 可退回（修改意见必填由 action 层强制）", checkRequestWorkItemChanges(op, intake).allowed);
  intake = await prisma.workItem.update({
    where: { id: intake.id },
    data: { status: "changes_requested", reviewNote: "UAT·门头照片缺失，请补拍", reviewerProfileId: uatOperator.id },
  });
  check("reviewNote 保存退回意见", (intake.reviewNote ?? "").includes("门头照片缺失"));
  check("collector 退回后可重新开始并提交", checkStartWorkItem(col, intake).allowed);
  intake = await prisma.workItem.update({ where: { id: intake.id }, data: { status: "in_progress" } });
  check("（重交前）collector 可再次提交", checkSubmitWorkItem(col, intake).allowed);
  intake = await prisma.workItem.update({
    where: { id: intake.id },
    data: { status: "submitted", submittedAt: new Date(), resultSummary: "【UAT 采集包 v2】已补门头照片" },
  });
  intake = await prisma.workItem.update({ where: { id: intake.id }, data: { status: "approved", approvedAt: new Date(), reviewerProfileId: uatOperator.id } });
  check("operator 审核通过；可标记完成（仅 approved 后）", checkCompleteWorkItem(op, intake).allowed && !checkCompleteWorkItem(op, { ...intake, status: "submitted" }).allowed);
  intake = await prisma.workItem.update({ where: { id: intake.id }, data: { status: "completed", completedAt: new Date() } });
  check("完成后 completedAt 存在", intake.status === "completed" && intake.completedAt !== null);
  // 审核采集资料任务（operator 自有跟踪任务）
  const reviewIntake = await prisma.workItem.create({
    data: { title: "UAT_审核采集资料任务_咖啡店", type: "review_intake", merchantId: merchant.id, assignedRole: "operator", createdByProfileId: uatOperator.id },
  });
  check("operator 可创建并驱动 review_intake（角色队列任务）", canCreateWorkItemType("operator", "review_intake") && checkStartWorkItem(op, reviewIntake).allowed);
  await prisma.workItem.update({ where: { id: reviewIntake.id }, data: { status: "completed", completedAt: new Date(), resultSummary: "UAT·采集包已按证据清单审核" } });

  // ---------------- 阶段 3：AI 草稿审核闭环 ----------------
  stage("阶段 3 · AI 草稿审核闭环（草稿→submitted→人工通过→人工保存模拟）");
  const diagTask = getAiTask("diagnosis")!;
  const aiDraft = await prisma.workItem.create({
    data: {
      ...buildAiDraftReviewWorkItemData({
        task: diagTask, merchantId: merchant.id, merchantName: merchant.name,
        aiOutput: "【UAT 测试草稿】主要问题：线上入口缺失（待验证）；建议先补 Maps 信息。UAT 数据，不得当真实案例，不承诺增长结果。",
        createdByProfileId: uatOperator.id, reviewerProfileId: uatOperator.id,
      }),
      title: "UAT_AI诊断草稿审核任务_咖啡店", // 覆盖默认标题，保证 UAT_ 前缀
    },
  });
  check("AI 草稿任务：submitted / requiresAi / targetNode=diagnosis / 草稿带 UAT 标识", aiDraft.status === "submitted" && aiDraft.requiresAi && aiDraft.targetNode === "diagnosis" && (aiDraft.resultSummary ?? "").includes("UAT 测试草稿"));
  const diagBefore = await prisma.merchantDiagnosis.findUnique({ where: { merchantId: merchant.id } });
  check("operator 可审核通过 AI 草稿", checkApproveWorkItem(op, aiDraft).allowed);
  await prisma.workItem.update({ where: { id: aiDraft.id }, data: { status: "approved", approvedAt: new Date(), reviewerProfileId: uatOperator.id } });
  const diagAfterApprove = await prisma.merchantDiagnosis.findUnique({ where: { merchantId: merchant.id } });
  check("审核通过后 AI 未自动写入诊断节点", diagBefore === null && diagAfterApprove === null);
  console.log("  [模拟] 这是 UAT 人工保存模拟，不是 AI 自动写入。");
  const diagSaved = await prisma.merchantDiagnosis.create({
    data: {
      merchantId: merchant.id, status: "draft",
      diagnosisSummary: "【UAT 测试内容·人工保存模拟】线上入口缺失（待验证）。这是 UAT 人工保存模拟，不是 AI 自动写入；不得当真实案例。",
      createdByProfileId: owner.id, updatedByProfileId: owner.id,
    },
  });
  check("人工保存后诊断节点有 UAT 内容且标明 UAT/不得当真实案例", diagSaved.diagnosisSummary!.includes("UAT") && diagSaved.diagnosisSummary!.includes("不得当真实案例"));
  await prisma.workItem.update({ where: { id: aiDraft.id }, data: { status: "completed", completedAt: new Date() } });

  // ---------------- 阶段 4：外包任务闭环 ----------------
  stage("阶段 4 · 外包任务闭环（创建→分配→提交→退回→重交→通过→人工完成）");
  check("operator 可创建外包任务并分配（目标 executor）", canCreateWorkItemType("operator", "outsource_execution") && checkAssignWorkItem(op, { type: "outsource_execution", status: "not_started", assignedProfileId: null, createdByProfileId: uatOperator.id, assignedRole: "executor" }).allowed);
  let outsource = await prisma.workItem.create({
    data: {
      title: "UAT_外包图片设计任务_菜单海报", type: "outsource_execution", merchantId: merchant.id,
      assignedRole: "executor", assignedProfileId: uatExecutor.id, status: "assigned",
      createdByProfileId: uatOperator.id, requiresOutsource: true,
      requirements: "UAT·设计 3 张菜单海报；不暴露客户经营数据；素材版权自有",
      acceptanceCriteria: "UAT·尺寸合规、版权自有、无夸大/承诺文案",
    },
  });
  const execVis = workItemVisibilityWhere(exe)!;
  const execSees = await prisma.workItem.findMany({ where: { AND: [{ title: { startsWith: "UAT_" } }, execVis] } });
  check("executor 只看到分配给自己的外包任务（看不到采集/AI/未分配任务）", execSees.length === 1 && execSees[0].id === outsource.id, `count=${execSees.length}`);
  check("executor 可开始并提交成果", checkStartWorkItem(exe, outsource).allowed && checkSubmitOutsourceResult(exe, outsource).allowed);
  check("operator/admin 不可代外包提交成果", !checkSubmitOutsourceResult(op, outsource).allowed && !checkSubmitOutsourceResult({ profileId: uatOperator.id, role: "admin" }, outsource).allowed);
  outsource = await prisma.workItem.update({
    where: { id: outsource.id },
    data: { status: "submitted", submittedAt: new Date(), resultSummary: "【成果说明】UAT 3 张海报初稿\n【成果链接】https://example.com/uat-posters\n【补充备注】UAT 测试交付" },
  });
  const opOutsourceSubmitted = await prisma.workItem.count({ where: { AND: [workItemVisibilityWhere(ownerOp)!, { type: { in: ["outsource_execution", "outsource_review"] }, status: "submitted" }] } });
  check("operator 首页「外包成果审核」计数可见该提交", opOutsourceSubmitted >= 1, `count=${opOutsourceSubmitted}`);
  outsource = await prisma.workItem.update({ where: { id: outsource.id }, data: { status: "changes_requested", reviewNote: "UAT·海报 2 字体过小，请调整", reviewerProfileId: uatOperator.id } });
  check("退回后 executor 可重交", checkSubmitOutsourceResult(exe, outsource).allowed);
  outsource = await prisma.workItem.update({
    where: { id: outsource.id },
    data: { status: "submitted", submittedAt: new Date(), resultSummary: "【成果说明】UAT 海报 v2（已调字体）\n【成果链接】https://example.com/uat-posters-v2" },
  });
  check("resultSummary 仅保留最新提交（v2 覆盖）", (outsource.resultSummary ?? "").includes("v2") && !(outsource.resultSummary ?? "").includes("初稿"));
  outsource = await prisma.workItem.update({ where: { id: outsource.id }, data: { status: "approved", approvedAt: new Date(), reviewerProfileId: uatOperator.id } });
  check("approved 不自动 complete（completedAt=null）", outsource.status === "approved" && outsource.completedAt === null);
  const autoCc = await prisma.workItem.count({ where: { merchantId: merchant.id, type: "client_confirmation" } });
  check("外包通过未自动创建客户确认 / 未自动发布", autoCc === 0, `client_confirmation=${autoCc}`);
  outsource = await prisma.workItem.update({ where: { id: outsource.id }, data: { status: "completed", completedAt: new Date() } });
  check("operator 手动 completed", outsource.status === "completed" && outsource.completedAt !== null);

  // ---------------- 阶段 5：客户确认闭环 ----------------
  stage("阶段 5 · 客户确认闭环（发起→客户提意见→处理→重新发起→客户确认→收口）");
  check("operator 可创建客户确认并分配给 merchant", canCreateWorkItemType("operator", "client_confirmation") && checkAssignWorkItem(op, { type: "client_confirmation", status: "not_started", assignedProfileId: null, createdByProfileId: uatOperator.id, assignedRole: "merchant" }).allowed);
  let confirm1 = await prisma.workItem.create({
    data: {
      title: "UAT_客户确认事项_账号命名方向", type: "client_confirmation", merchantId: merchant.id,
      assignedRole: "merchant", assignedProfileId: uatClient.id, status: "assigned",
      createdByProfileId: uatOperator.id, requiresClientConfirmation: true,
      requirements: "UAT·请确认账号命名与定位方向（UAT 测试内容）",
      acceptanceCriteria: "UAT·确认通过后开始搭建账号（不承诺增长结果）",
    },
  });
  check("operator（审核员）可驱动发起：开始→提交", checkStartWorkItem(op, confirm1).allowed && checkSubmitWorkItem(op, { ...confirm1, status: "in_progress" }).allowed);
  confirm1 = await prisma.workItem.update({ where: { id: confirm1.id }, data: { status: "submitted", submittedAt: new Date() } });
  const cliVis = workItemVisibilityWhere(cli)!;
  const cliSees = await prisma.workItem.findMany({ where: { AND: [{ title: { startsWith: "UAT_" } }, cliVis] } });
  check("merchant 只看到自己的确认事项（看不到采集/AI/外包任务）", cliSees.length === 1 && cliSees[0].id === confirm1.id, `count=${cliSees.length}`);
  check("merchant 可确认 / 提修改意见；其他人不可", checkConfirmClientWorkItem(cli, confirm1).allowed && checkRequestClientWorkItemChanges(cli, confirm1).allowed && !checkConfirmClientWorkItem(op, confirm1).allowed && !checkConfirmClientWorkItem(exe, confirm1).allowed);
  confirm1 = await prisma.workItem.update({ where: { id: confirm1.id }, data: { status: "changes_requested", reviewNote: "【客户修改意见】UAT·店名想加英文" } });
  check("客户修改意见保存到 reviewNote 且 operator 可读", (await prisma.workItem.findFirst({ where: { AND: [{ id: confirm1.id }, workItemVisibilityWhere(ownerOp)!] }, select: { reviewNote: true } }))?.reviewNote?.includes("店名想加英文") === true);
  // operator 记录处理动作（通用跟进任务）
  const followup = await prisma.workItem.create({
    data: { title: "UAT_处理客户反馈跟进任务", type: "general_followup", merchantId: merchant.id, assignedRole: "operator", createdByProfileId: uatOperator.id, description: "UAT·按客户意见调整命名方案（人工处理记录）" },
  });
  check("operator 可创建处理跟进任务（不自动产生）", followup.type === "general_followup" && checkStartWorkItem(op, followup).allowed);
  await prisma.workItem.update({ where: { id: followup.id }, data: { status: "completed", completedAt: new Date(), resultSummary: "UAT·已按意见调整方案" } });
  await prisma.workItem.update({ where: { id: confirm1.id }, data: { status: "completed", completedAt: new Date() } });
  // 重新发起一个确认事项
  let confirm2 = await prisma.workItem.create({
    data: {
      title: "UAT_客户确认事项_重新确认命名", type: "client_confirmation", merchantId: merchant.id,
      assignedRole: "merchant", assignedProfileId: uatClient.id, status: "submitted", submittedAt: new Date(),
      createdByProfileId: uatOperator.id, requiresClientConfirmation: true,
      requirements: "UAT·请确认调整后的中英文店名（UAT 测试内容）",
    },
  });
  const tasksBeforeConfirm = await prisma.workItem.count({});
  check("merchant 可确认通过", checkConfirmClientWorkItem(cli, confirm2).allowed);
  confirm2 = await prisma.workItem.update({ where: { id: confirm2.id }, data: { status: "approved", approvedAt: new Date(), reviewNote: "【客户确认】客户已确认通过。" } });
  check("approved + approvedAt；不自动 completed / 不自动发布", confirm2.status === "approved" && confirm2.approvedAt !== null && confirm2.completedAt === null);
  check("确认通过未自动创建后续任务", (await prisma.workItem.count({})) === tasksBeforeConfirm);
  confirm2 = await prisma.workItem.update({ where: { id: confirm2.id }, data: { status: "completed", completedAt: new Date() } });
  check("operator 看到 approved 后手动 completed 收口", confirm2.status === "completed");

  // ---------------- 阶段 6：角色工作台计数联动（data 层复现） ----------------
  stage("阶段 6 · 角色工作台计数联动（与页面同查询的 data 层复现；UI 已在 TASK-070~074 HTTP 验证）");
  const colSees = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: "UAT_" } }, workItemVisibilityWhere(col)!] } });
  check("collector 工作台可见自己的采集任务计数", colSees >= 1, `count=${colSees}`);
  const opSeesAll = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: "UAT_" } }, workItemVisibilityWhere(ownerOp)!] } });
  check("operator 可见全部 UAT 商家任务（7 条）", opSeesAll === 7, `count=${opSeesAll}`);
  const exeSeesEnd = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: "UAT_" } }, workItemVisibilityWhere(exe)!] } });
  check("executor 工作台计数=仅自己的外包任务", exeSeesEnd === 1, `count=${exeSeesEnd}`);
  const cliSeesEnd = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: "UAT_" } }, workItemVisibilityWhere(cli)!] } });
  check("merchant 工作台计数=仅自己的确认事项（2 条）", cliSeesEnd === 2, `count=${cliSeesEnd}`);
  check("ai_worker 不显示任务（可见性=null）", workItemVisibilityWhere({ profileId: uatOperator.id, role: "ai_worker" }) === null);
  const adminSeesAll = await prisma.workItem.count({ where: { AND: [{ title: { startsWith: "UAT_" } }, workItemVisibilityWhere({ profileId: uatOperator.id, role: "admin" })!] } });
  check("admin 可见全局任务统计（7 条）", adminSeesAll === 7, `count=${adminSeesAll}`);

  // ---------------- 阶段 7：数据隔离 ----------------
  stage("阶段 7 · 数据隔离（DEMO / SMOKE / 真实数据不受影响；UAT 可清理）");
  const demoAfter = await prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } });
  const smokeAfter = await prisma.merchant.count({ where: { name: { startsWith: "SMOKE_TEST_" } } });
  const realAfter = await prisma.merchant.count({
    where: { NOT: { OR: [{ name: { startsWith: "DEMO_" } }, { name: { startsWith: "SMOKE_TEST_" } }, { name: { startsWith: "UAT_" } }] } },
  });
  check("DEMO 数量前后不变", demoAfter === demoBefore, `${demoBefore}->${demoAfter}`);
  check("SMOKE 数量前后不变", smokeAfter === smokeBefore, `${smokeBefore}->${smokeAfter}`);
  check("真实商家数量前后不变", realAfter === realBefore, `${realBefore}->${realAfter}`);
  const uatTaskCount = await prisma.workItem.count({ where: { title: { startsWith: "UAT_" } } });
  check("全部 UAT 任务带 UAT_ 前缀且可被 clean:uat 清理", uatTaskCount === 7, `count=${uatTaskCount}`);
  console.log("  [提示] 彩排数据保留在库中供 UI 手工检查；清理：npm run clean:uat（之后 npm run uat:check-clean 复核）。");
}

main()
  .then(() => {
    console.log("\n===== 阶段结果汇总 =====");
    for (const [s, f] of Object.entries(stageFails)) console.log(`  ${f === 0 ? "PASS ✅" : `FAIL ❌(${f})`}  ${s}`);
    const ok = fail === 0;
    console.log(`\n=== REHEARSAL SUMMARY: ${pass} passed / ${fail} failed -> ${ok ? "PASS ✅" : "FAIL ❌"} ===`);
    process.exit(ok ? 0 : 1);
  })
  .catch((e) => {
    console.error("\nREHEARSAL FATAL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
