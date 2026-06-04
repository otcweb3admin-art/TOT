/**
 * DEMO merchant seed (TASK-050) — a repeatable, cleanable, clearly-marked DEMO sample for
 * internal demo / training / UX validation. NOT a real merchant.
 *
 * RULES: every row is prefixed/marked DEMO_; the merchant name + every notes field carry an
 * explicit DEMO disclaimer. DEMO data must NEVER be used for MVS / experience base / ROI /
 * attribution / real cases. Clean deletes ONLY merchants whose name startsWith "DEMO_"
 * (assets cascade) — it never touches real or SMOKE_TEST_ data.
 *
 *   npm run seed:demo        -> create (idempotent: clears existing DEMO_ first)
 *   npm run seed:demo:clean  -> remove all DEMO_ merchants
 */
import { prisma } from "@/lib/db";

const PREFIX = "DEMO_";
const NAME = "DEMO_小吃车增长样例";
const NOTE = "【演示数据】这是演示数据，不是真实商家，不得用于 MVS / 经验库 / ROI / 归因 / 真实案例。";

async function cleanDemo(): Promise<number> {
  // Merchant delete cascades to its 1-1 assets (onDelete: Cascade). STRICT DEMO_ filter.
  const del = await prisma.merchant.deleteMany({ where: { name: { startsWith: PREFIX } } });
  return del.count;
}

async function seedDemo(): Promise<void> {
  // Owner = the existing test account's profile. Do NOT create auth users.
  const owner = await prisma.userProfile.findFirst({ where: { email: "admin@tot.local" } });
  if (!owner) {
    console.error(
      "[seed] No UserProfile for admin@tot.local. Log in once to JIT-provision it, then re-run. (Will NOT create auth users / real data.)",
    );
    process.exit(1);
  }

  // Idempotent: clear any existing DEMO_ first.
  const removed = await cleanDemo();
  if (removed) console.log(`[seed] cleared ${removed} existing DEMO_ merchant(s) first.`);

  const audit = { createdByProfileId: owner.id, updatedByProfileId: owner.id };

  const m = await prisma.merchant.create({
    data: {
      name: NAME,
      industry: "DEMO·本地小吃 / 餐饮",
      city: "DEMO City",
      country: "DEMO",
      contactName: "DEMO 联系人",
      contactPhone: "000-DEMO",
      contactEmail: "demo@example.invalid",
      status: "active",
      notes: NOTE,
      ownerProfileId: owner.id,
      createdByProfileId: owner.id,
    },
  });

  const profile = await prisma.merchantProfile.create({
    data: {
      merchantId: m.id,
      industryDetail: "DEMO·社区小吃车（招牌炸串 / 小吃）",
      targetCustomerSummary: "DEMO·周边居民 + 路口通勤客流",
      coreOfferSummary: "DEMO·3 秒可懂：招牌炸串套餐 9.9",
      currentAcquisitionSummary: "DEMO·社区路口自然客流 + Google Maps",
      onlinePresenceSummary: "DEMO·已有 Google Maps + 短视频账号（粉丝少）",
      growthGoalSummary: "DEMO·月客流 +30%，建立线上引流路径",
      executionLimitSummary: "DEMO·老板一人主理，可投入时间有限",
      baselineDataSummary: "DEMO·营业额为老板口头估计（低可信）",
      notes: NOTE,
      ...audit,
    },
  });

  const baseline = await prisma.merchantBaselineMetric.create({
    data: {
      merchantId: m.id,
      periodLabel: "DEMO 2026-05",
      monthlyRevenue: 30000,
      monthlyCustomerCount: 1200,
      monthlyLeadCount: 200,
      monthlyConversionCount: 150,
      averageOrderValue: 25,
      repeatCustomerRate: 20,
      followerCount: 300,
      reviewCount: 45,
      averageRating: 4.5,
      sourceNote: "DEMO·老板口头估计，无完整台账",
      dataConfidence: "low",
      notes: NOTE,
      ...audit,
    },
  });

  await prisma.merchantOperatingCapacity.create({
    data: {
      merchantId: m.id,
      status: "completed",
      // 履约（demo：有承接但高峰有风险 -> attention）
      responseProcessSummary: "DEMO·老板亲自接单收银",
      responseTimeSummary: "DEMO·现场即时；线上消息常漏看",
      bookingProcessSummary: "DEMO·现场排队，无预约",
      serviceCapacitySummary: "DEMO·高峰每小时约 30 单到顶",
      peakHourHandlingSummary: "DEMO·午晚高峰排队，出餐变慢",
      fulfillmentRiskSummary: "DEMO·高峰期出餐压力大，易掉单",
      customerExperienceRiskSummary: "DEMO·等待过久影响体验",
      // 组织（demo：老板单点 -> attention）
      ownerDependencySummary: "DEMO·几乎所有事老板亲自做",
      staffRoleSummary: "DEMO·1 名兼职帮工",
      delegationReadinessSummary: "DEMO·收银/备料可部分交接",
      standardProcessSummary: "DEMO·无成文 SOP",
      trainingReadinessSummary: "DEMO·新人需老板带 1 周",
      organizationRiskSummary: "DEMO·老板单点风险：离开一天基本停摆",
      operatingConstraintSummary: "DEMO·承接上限≈老板体力上限",
      notes: NOTE,
      ...audit,
    },
  });

  const diagnosis = await prisma.merchantDiagnosis.create({
    data: {
      merchantId: m.id,
      status: "completed",
      diagnosisSummary: "DEMO·有自然客流但无线上引流闭环，承接靠老板单点",
      growthProblemSummary: "DEMO·线上获客与承接能力是主要短板",
      opportunitySummary: "DEMO·用招牌单品做短视频引流 + Maps 优化",
      riskSummary: "DEMO·放量前需先解决高峰承接与老板单点",
      recommendedNextStep: "DEMO·先补承接能力，再做小范围引流（演示判断，非系统决策）",
      sourceProfileId: profile.id,
      sourceBaselineMetricId: baseline.id,
      ...audit,
    },
  });

  const accountSetup = await prisma.merchantAccountSetup.create({
    data: {
      merchantId: m.id,
      status: "completed",
      platformPlanSummary: "DEMO·短视频(TikTok) + Google Maps 为主",
      accountPositioningSummary: "DEMO·社区招牌炸串·实惠快出餐",
      namingDirection: "DEMO·店名 + 招牌单品",
      bioDirection: "DEMO·一句话说清卖什么 + 位置",
      visualDirectionSummary: "DEMO·暖色 + 出餐特写",
      personaDirectionSummary: "DEMO·真实老板出镜",
      googleMapsDirectionSummary: "DEMO·补全营业时间/菜单/评价引导",
      contactChannelSummary: "DEMO·统一到 WhatsApp",
      setupRiskSummary: "DEMO·老板时间有限，更新频率风险",
      notes: NOTE,
      sourceDiagnosisId: diagnosis.id,
      ...audit,
    },
  });

  const material = await prisma.merchantMaterialCollection.create({
    data: {
      merchantId: m.id,
      status: "completed",
      materialCategorySummary: "DEMO·出餐过程 / 招牌单品 / 排队人气",
      materialGapSummary: "DEMO·缺客户好评与故事素材",
      shootingSceneSummary: "DEMO·小吃车现场即可拍",
      peopleMaterialSummary: "DEMO·老板可出镜",
      productServiceMaterialSummary: "DEMO·招牌炸串特写",
      trustMaterialSummary: "DEMO·现有 45 条评价可截图",
      brandStoryMaterialSummary: "DEMO·摆摊创业故事（待补充）",
      collectionPrioritySummary: "DEMO·优先拍招牌单品 + 出餐",
      collectionRiskSummary: "DEMO·高峰无暇拍摄",
      notes: NOTE,
      sourceAccountSetupId: accountSetup.id,
      ...audit,
    },
  });

  const contentOperation = await prisma.merchantContentOperation.create({
    data: {
      merchantId: m.id,
      status: "completed",
      contentPositioningSummary: "DEMO·招牌单品 + 社区实惠",
      contentPillarSummary: "DEMO·出餐过程 / 单品介绍 / 客流人气",
      contentRatioSummary: "DEMO·出餐 5 : 单品 3 : 互动 2",
      publishingFrequencySummary: "DEMO·每周 3 条（受老板时间限制）",
      toneStyleSummary: "DEMO·真实接地气",
      contentBoundarySummary: "DEMO·不夸大、不虚构优惠",
      first30DayPlanSummary: "DEMO·前 30 天以招牌单品打透",
      contentRiskSummary: "DEMO·更新频率难稳定",
      notes: NOTE,
      sourceMaterialCollectionId: material.id,
      ...audit,
    },
  });

  const livePlanning = await prisma.merchantLivePlanning.create({
    data: {
      merchantId: m.id,
      status: "completed",
      feasibilitySummary: "DEMO·暂不适合直播（人手不足）",
      platformSummary: "DEMO·后续可考虑 TikTok",
      liveGoalSummary: "DEMO·暂缓",
      liveFormatSummary: "DEMO·出餐场景直播（远期）",
      liveTopicSummary: "DEMO·招牌单品",
      liveFrequencySummary: "DEMO·暂无",
      hostPeopleRequirementSummary: "DEMO·需额外出镜人手",
      readinessSummary: "DEMO·准备度低",
      liveRiskSummary: "DEMO·占用高峰出餐人力",
      notes: NOTE,
      sourceContentOperationId: contentOperation.id,
      ...audit,
    },
  });

  const leadConversion = await prisma.merchantLeadConversion.create({
    data: {
      merchantId: m.id,
      status: "completed",
      trafficPathSummary: "DEMO·短视频/Maps -> 到店 -> 排队",
      conversionPathSummary: "DEMO·到店即买；线上加 WhatsApp 复购",
      privateDomainSummary: "DEMO·WhatsApp 群（待建）",
      campaignIdeaSummary: "DEMO·到店出示视频享小赠品",
      googleMapsActionSummary: "DEMO·引导到店评价",
      paidTrafficTestSummary: "DEMO·暂不投流（仅演示思路，不执行）",
      p001ReadinessSummary: "DEMO·投流准备度低",
      thirtyDayActionSummary: "DEMO·先打自然流量 + Maps",
      attributionMethodSummary: "DEMO·到店问『从哪看到』+ 专属赠品码（演示归因思路）",
      conversionRiskSummary: "DEMO·高峰承接不足会流失转化",
      notes: NOTE,
      sourceContentOperationId: contentOperation.id,
      sourceLivePlanningId: livePlanning.id,
      ...audit,
    },
  });

  const dataReview = await prisma.merchantDataReview.create({
    data: {
      merchantId: m.id,
      status: "draft", // demo review — not a real result
      reviewPeriodLabel: "DEMO（演示复盘·非真实结果）",
      goalCompletionSummary: "DEMO·演示用，不得当真实结果",
      contentEffectSummary: "DEMO·示意",
      liveEffectSummary: "DEMO·N/A",
      leadConversionEffectSummary: "DEMO·示意",
      realBusinessDataSummary: "DEMO·演示用估计，非真实经营数据",
      problemDiagnosisSummary: "DEMO·承接 + 更新频率是瓶颈（示意）",
      optimizationSuggestionSummary: "DEMO·先补承接，再放量（示意）",
      strategyJudgmentSummary: "DEMO·示意",
      attributionObservationSummary: "DEMO·示意",
      reviewRiskSummary: "DEMO·此复盘为演示，不可用于经验库/案例",
      notes: NOTE,
      sourceBaselineMetricId: baseline.id,
      sourceContentOperationId: contentOperation.id,
      sourceLivePlanningId: livePlanning.id,
      sourceLeadConversionId: leadConversion.id,
      ...audit,
    },
  });

  await prisma.merchantNinetyDayGrowthPlan.create({
    data: {
      merchantId: m.id,
      status: "draft", // demo plan direction only
      planPeriodLabel: "DEMO 90 天（演示方向·非承诺）",
      stageGoalSummary: "DEMO·先补承接 -> 自然引流 -> 小步放量",
      roadmapSummary: "DEMO·示意路线",
      platformPrioritySummary: "DEMO·短视频 + Google Maps",
      contentRouteSummary: "DEMO·招牌单品打透",
      leadConversionRouteSummary: "DEMO·到店 + 私域复购",
      kpiSummary: "DEMO·示意 KPI（非承诺）",
      riskSummary: "DEMO·老板单点 + 高峰承接",
      cycleJudgmentSummary: "DEMO·示意",
      nextStageDirectionSummary: "DEMO·承接达标后再考虑投流",
      notes: NOTE,
      sourceBaselineMetricId: baseline.id,
      sourceDiagnosisId: diagnosis.id,
      sourceLeadConversionId: leadConversion.id,
      sourceDataReviewId: dataReview.id,
      ...audit,
    },
  });

  console.log(`[seed] created DEMO merchant "${NAME}" (id=${m.id}) + full 11-asset chain.`);
  console.log(`[seed] owner profile = admin@tot.local (${owner.id}); ${NOTE}`);
}

const isClean = process.argv.includes("--clean");
(async () => {
  if (isClean) {
    const n = await cleanDemo();
    console.log(`[clean] deleted DEMO_ merchants=${n} (assets cascade). Real / SMOKE_TEST_ data untouched.`);
  } else {
    await seedDemo();
  }
})()
  .catch((e) => {
    console.error("[seed-demo] error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
