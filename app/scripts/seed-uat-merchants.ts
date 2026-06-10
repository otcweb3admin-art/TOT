/**
 * UAT virtual-merchant seed (TASK-068) — a repeatable, cleanable full-flow test sandbox.
 * UAT ≠ DEMO ≠ SMOKE ≠ 真实商家：every row is prefixed UAT_ and marked in notes; cleanup
 * deletes ONLY merchants whose name startsWith "UAT_" (assets cascade) — DEMO / SMOKE /
 * real data are never touched. UAT data must never be treated as real cases, never enter
 * the experience base, never be used for growth promises.
 *
 *   npm run seed:uat        -> create 3 scenario merchants (idempotent: clears UAT_ first)
 *   npm run seed:uat:clean  -> remove all UAT_ merchants
 */
import { prisma } from "@/lib/db";

const PREFIX = "UAT_";
const NOTE =
  "【UAT 虚拟测试数据】仅用于系统全流程测试，不是真实商家，不得当真实案例 / 不得对外引用 / 不得用于增长承诺 / 不得进入经验库。";

async function cleanUat(): Promise<number> {
  const del = await prisma.merchant.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
  return del.count;
}

async function seedUat(): Promise<void> {
  const owner = await prisma.userProfile.findFirst({ where: { email: "admin@tot.local" } });
  if (!owner) {
    console.error("[seed:uat] No UserProfile for admin@tot.local — log in once first. Will NOT create auth users.");
    process.exit(1);
  }
  const removed = await cleanUat();
  if (removed) console.log(`[seed:uat] cleared ${removed} existing UAT_ merchant(s) first.`);

  const audit = { createdByProfileId: owner.id, updatedByProfileId: owner.id };
  const own = { ownerProfileId: owner.id, createdByProfileId: owner.id };

  // ---------- 场景 A：完整资料型 ----------
  const a = await prisma.merchant.create({
    data: {
      name: "UAT_河内咖啡店完整链路", industry: "UAT·咖啡 / 餐饮", city: "Hanoi", country: "Vietnam",
      contactName: "UAT 联系人A", status: "active", notes: NOTE, ...own,
    },
  });
  const aProfile = await prisma.merchantProfile.create({
    data: {
      merchantId: a.id,
      industryDetail: "UAT·社区精品咖啡店（堂食+外带）",
      targetCustomerSummary: "UAT·周边上班族 + 学生",
      coreOfferSummary: "UAT·3 秒可懂：越南滴漏咖啡套餐 39k",
      currentAcquisitionSummary: "UAT·门口自然客流 + Google Maps + 熟客转介绍",
      onlinePresenceSummary: "UAT·有 Maps + TikTok 账号（更新中）",
      growthGoalSummary: "UAT·月客流 +25%，建立线上点单入口",
      executionLimitSummary: "UAT·店长可配合拍摄，每周 2 次",
      baselineDataSummary: "UAT·有 POS 月报",
      notes: NOTE, ...audit,
    },
  });
  const aBaseline = await prisma.merchantBaselineMetric.create({
    data: {
      merchantId: a.id, periodLabel: "UAT 2026-05",
      monthlyRevenue: 86000, monthlyCustomerCount: 2400, monthlyLeadCount: 350, monthlyConversionCount: 300,
      averageOrderValue: 36, repeatCustomerRate: 38, followerCount: 1200, reviewCount: 96, averageRating: 4.6,
      sourceNote: "UAT·POS 月报 + Maps 后台截图", dataConfidence: "high", notes: NOTE, ...audit,
    },
  });
  await prisma.merchantOperatingCapacity.create({
    data: {
      merchantId: a.id, status: "completed",
      responseProcessSummary: "UAT·店长 + 2 名店员轮班接待",
      responseTimeSummary: "UAT·堂食即时；线上消息 30 分钟内回复",
      bookingProcessSummary: "UAT·无需预约，外带可电话提前点",
      serviceCapacitySummary: "UAT·高峰每小时 60 杯，尚有余量",
      peakHourHandlingSummary: "UAT·早高峰双人出杯，基本稳定",
      ownerDependencySummary: "UAT·店长可独立运营，老板每周到店 2 次",
      staffRoleSummary: "UAT·店长 1 + 店员 2，分工明确",
      delegationReadinessSummary: "UAT·常规运营可完全委派",
      standardProcessSummary: "UAT·有出品 SOP 与开闭店清单",
      trainingReadinessSummary: "UAT·新人 3 天可上岗",
      operatingConstraintSummary: "UAT·雨季客流波动",
      notes: NOTE, ...audit,
    },
  });
  const aDiag = await prisma.merchantDiagnosis.create({
    data: {
      merchantId: a.id, status: "completed",
      diagnosisSummary: "UAT·基础扎实：承接良好、数据可信，主要短板是线上获客入口未打通",
      growthProblemSummary: "UAT·线上内容少、点单入口缺失",
      opportunitySummary: "UAT·用招牌滴漏咖啡做短视频 + Maps 点单链路",
      riskSummary: "UAT·雨季波动；内容更新依赖店长时间",
      recommendedNextStep: "UAT·先补内容与点单入口，再小步引流（演示判断，需人工确认）",
      sourceProfileId: aProfile.id, sourceBaselineMetricId: aBaseline.id, ...audit,
    },
  });
  const aSetup = await prisma.merchantAccountSetup.create({
    data: {
      merchantId: a.id, status: "completed",
      platformPlanSummary: "UAT·TikTok + Google Maps 为主，IG 备用",
      accountPositioningSummary: "UAT·社区精品越式咖啡",
      googleMapsDirectionSummary: "UAT·补菜单照 + 点单链接",
      contactChannelSummary: "UAT·统一 Zalo",
      notes: NOTE, sourceDiagnosisId: aDiag.id, ...audit,
    },
  });
  const aMat = await prisma.merchantMaterialCollection.create({
    data: {
      merchantId: a.id, status: "draft",
      materialCategorySummary: "UAT·出杯过程 / 店内环境 / 招牌套餐",
      materialGapSummary: "UAT·缺顾客好评视频",
      shootingSceneSummary: "UAT·吧台 + 靠窗位",
      notes: NOTE, sourceAccountSetupId: aSetup.id, ...audit,
    },
  });
  const aContent = await prisma.merchantContentOperation.create({
    data: {
      merchantId: a.id, status: "draft",
      contentPositioningSummary: "UAT·滴漏咖啡制作美学 + 社区日常",
      contentPillarSummary: "UAT·出杯过程 / 套餐介绍 / 熟客故事",
      publishingFrequencySummary: "UAT·每周 3 条",
      notes: NOTE, sourceMaterialCollectionId: aMat.id, ...audit,
    },
  });
  const aLive = await prisma.merchantLivePlanning.create({
    data: {
      merchantId: a.id, status: "draft",
      feasibilitySummary: "UAT·可行性中等，店长可出镜",
      platformSummary: "UAT·TikTok",
      notes: NOTE, sourceContentOperationId: aContent.id, ...audit,
    },
  });
  await prisma.merchantLeadConversion.create({
    data: {
      merchantId: a.id, status: "draft",
      trafficPathSummary: "UAT·短视频/Maps → 到店/外带",
      conversionPathSummary: "UAT·到店即买 + Zalo 提前点单",
      privateDomainSummary: "UAT·Zalo 熟客群",
      attributionMethodSummary: "UAT·到店口令 + Maps 来源问询",
      notes: NOTE, sourceContentOperationId: aContent.id, sourceLivePlanningId: aLive.id, ...audit,
    },
  });
  console.log(`[seed:uat] A 完整资料型: ${a.name}`);

  // ---------- 场景 B：资料缺失型 ----------
  const b = await prisma.merchant.create({
    data: {
      name: "UAT_美甲店资料缺失场景", industry: "UAT·美甲 / 美容",
      status: "lead", notes: NOTE, ...own, // 城市/联系人故意缺失
    },
  });
  await prisma.merchantProfile.create({
    data: {
      merchantId: b.id,
      targetCustomerSummary: "UAT·年轻女性（待细化）",
      coreOfferSummary: "UAT·日式美甲（价格带未确认）",
      // 其余字段故意留空 → 应大量「待补充」
      notes: NOTE, ...audit,
    },
  });
  await prisma.merchantBaselineMetric.create({
    data: {
      merchantId: b.id, periodLabel: "UAT 待补充",
      // 全部数字故意留空；可信度 unknown
      sourceNote: "UAT·商家暂未提供任何经营数据",
      dataConfidence: "unknown", notes: NOTE, ...audit,
    },
  });
  await prisma.merchantOperatingCapacity.create({
    data: {
      merchantId: b.id, status: "draft",
      responseProcessSummary: "UAT·老板娘自己回消息（时效未知）",
      // 其余履约/组织字段故意留空
      notes: NOTE, ...audit,
    },
  });
  await prisma.merchantDiagnosis.create({
    data: {
      merchantId: b.id, status: "draft",
      diagnosisSummary: "UAT·关键资料大量缺失，暂无法下判断；以下均为待验证",
      growthProblemSummary: "UAT·待补充（无基线/无承接数据）",
      riskSummary: "UAT·数据缺口本身即最大风险",
      recommendedNextStep: "UAT·先回 Field Pack 补采基线与承接信息，不要急于出方案",
      ...audit,
    },
  });
  console.log(`[seed:uat] B 资料缺失型: ${b.name}`);

  // ---------- 场景 C：承接能力不足型 ----------
  const c = await prisma.merchant.create({
    data: {
      name: "UAT_小吃车承接能力不足场景", industry: "UAT·小吃 / 餐饮", city: "UAT City",
      contactName: "UAT 老板C", status: "lead", notes: NOTE, ...own,
    },
  });
  const cProfile = await prisma.merchantProfile.create({
    data: {
      merchantId: c.id,
      targetCustomerSummary: "UAT·夜市客流",
      coreOfferSummary: "UAT·招牌烤串拼盘",
      currentAcquisitionSummary: "UAT·夜市自然客流",
      executionLimitSummary: "UAT·老板一人主理，几乎无可支配时间",
      notes: NOTE, ...audit,
    },
  });
  const cBaseline = await prisma.merchantBaselineMetric.create({
    data: {
      merchantId: c.id, periodLabel: "UAT 2026-05",
      monthlyRevenue: 28000, monthlyCustomerCount: 900,
      sourceNote: "UAT·老板口头估计", dataConfidence: "low", notes: NOTE, ...audit,
    },
  });
  await prisma.merchantOperatingCapacity.create({
    data: {
      merchantId: c.id, status: "completed",
      responseProcessSummary: "UAT·只有老板一人接单",
      responseTimeSummary: "UAT·高峰时基本无暇回复线上消息",
      serviceCapacitySummary: "UAT·高峰每小时约 25 单已到顶",
      peakHourHandlingSummary: "UAT·高峰排长队，经常漏单",
      fulfillmentRiskSummary: "UAT·响应慢 + 高峰承接弱，引流进来接不住",
      customerExperienceRiskSummary: "UAT·等待过久差评风险高",
      ownerDependencySummary: "UAT·老板严重单点，离开摊位即停业",
      staffRoleSummary: "UAT·无固定帮工",
      delegationReadinessSummary: "UAT·暂无可委派对象",
      organizationRiskSummary: "UAT·单点风险：老板生病=停业",
      operatingConstraintSummary: "UAT·承接上限=老板体力上限",
      notes: NOTE, ...audit,
    },
  });
  await prisma.merchantDiagnosis.create({
    data: {
      merchantId: c.id, status: "completed",
      diagnosisSummary: "UAT·产品与客流有基础，但承接能力明显不足",
      growthProblemSummary: "UAT·瓶颈不在获客，在履约与组织（接不住）",
      riskSummary: "UAT·不适合马上放量：先补承接（帮工/流程），否则引流=放大差评",
      recommendedNextStep: "UAT·先补承接能力，不建议直接投流（演示判断，需人工确认）",
      sourceProfileId: cProfile.id, sourceBaselineMetricId: cBaseline.id, ...audit,
    },
  });
  console.log(`[seed:uat] C 承接不足型: ${c.name}`);

  console.log(`[seed:uat] done — 3 UAT merchants created. ${NOTE}`);
}

const isClean = process.argv.includes("--clean");
(async () => {
  if (isClean) {
    const n = await cleanUat();
    const demoLeft = await prisma.merchant.count({ where: { name: { startsWith: "DEMO_" } } });
    console.log(`[seed:uat:clean] deleted UAT_ merchants=${n} (assets cascade). DEMO remaining=${demoLeft}; real/SMOKE data untouched.`);
  } else {
    await seedUat();
  }
})()
  .catch((e) => {
    console.error("[seed:uat] error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
