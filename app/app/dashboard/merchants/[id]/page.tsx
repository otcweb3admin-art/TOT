import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";

export const dynamic = "force-dynamic";

// Placeholder only — these modules are NOT implemented yet.
const FUTURE_MODULES = [
  "增长诊断",
  "策略",
  "计划",
  "执行",
  "监控",
  "复盘",
];

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params; // Next 16: params is async
  const merchant = await getMerchantById(id);
  if (!merchant) notFound();

  const row = (label: string, value: ReactNode) => (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{merchant.name}</h1>
          <p className="text-sm text-zinc-500">
            商家详情 · P2 Merchant Intake Foundation
          </p>
        </div>
        <Link
          href="/dashboard/merchants"
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 列表
        </Link>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">基础信息</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {row("状态", merchant.status)}
          {row("行业", merchant.industry)}
          {row("城市", merchant.city)}
          {row("国家", merchant.country)}
          {row("联系人", merchant.contactName)}
          {row("联系电话", merchant.contactPhone)}
          {row("联系邮箱", merchant.contactEmail)}
          {row("负责人", merchant.owner?.email)}
          {row("创建人", merchant.createdBy?.email)}
          {row(
            "创建时间",
            merchant.createdAt.toISOString().slice(0, 19).replace("T", " "),
          )}
          {row("备注", merchant.notes)}
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            商家画像（Merchant Profile）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/profile`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.profile ? "编辑画像" : "创建画像"}
          </Link>
        </div>
        {merchant.profile ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("行业细分", merchant.profile.industryDetail)}
            {row("目标客群", merchant.profile.targetCustomerSummary)}
            {row("核心卖点", merchant.profile.coreOfferSummary)}
            {row("当前获客", merchant.profile.currentAcquisitionSummary)}
            {row("线上情况", merchant.profile.onlinePresenceSummary)}
            {row("增长目标", merchant.profile.growthGoalSummary)}
            {row("执行限制", merchant.profile.executionLimitSummary)}
            {row("基准数据", merchant.profile.baselineDataSummary)}
            {row("备注", merchant.profile.notes)}
            {row(
              "更新时间",
              merchant.profile.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.profile.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无商家画像。点击「创建画像」录入摘要级画像信息（为后续 TB-001 / 诊断 / 策略提供输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            增长前基准数据（Baseline Metrics）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/baseline`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.baseline ? "编辑基准" : "创建基准"}
          </Link>
        </div>
        {merchant.baseline ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("统计周期", merchant.baseline.periodLabel)}
            {row("月营业额", merchant.baseline.monthlyRevenue?.toString())}
            {row("月客户数", merchant.baseline.monthlyCustomerCount?.toString())}
            {row("月咨询数", merchant.baseline.monthlyLeadCount?.toString())}
            {row("月成交数", merchant.baseline.monthlyConversionCount?.toString())}
            {row("客单价", merchant.baseline.averageOrderValue?.toString())}
            {row("复购率", merchant.baseline.repeatCustomerRate?.toString())}
            {row("粉丝数", merchant.baseline.followerCount?.toString())}
            {row("评论数", merchant.baseline.reviewCount?.toString())}
            {row("平均评分", merchant.baseline.averageRating?.toString())}
            {row("数据来源", merchant.baseline.sourceNote)}
            {row("数据可信度", merchant.baseline.dataConfidence)}
            {row("备注", merchant.baseline.notes)}
            {row(
              "更新时间",
              merchant.baseline.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.baseline.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无增长前基准数据。点击「创建基准」录入（为后续 TB-001 / MVS / 复盘 / 经验沉淀提供对照基线）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-001 商家诊断（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/diagnosis`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.diagnosis ? "编辑诊断" : "创建诊断"}
          </Link>
        </div>
        {merchant.diagnosis ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.diagnosis.status)}
            {row("诊断摘要", merchant.diagnosis.diagnosisSummary)}
            {row("增长问题", merchant.diagnosis.growthProblemSummary)}
            {row("机会点", merchant.diagnosis.opportunitySummary)}
            {row("风险", merchant.diagnosis.riskSummary)}
            {row("建议下一步", merchant.diagnosis.recommendedNextStep)}
            {row(
              "引用画像",
              merchant.diagnosis.sourceProfileId ? "已引用当前画像" : "未引用",
            )}
            {row(
              "引用基准",
              merchant.diagnosis.sourceBaselineMetricId
                ? "已引用当前基准"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.diagnosis.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.diagnosis.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无 TB-001 诊断。点击「创建诊断」录入最小诊断摘要（可引用当前画像 + 基准作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-002 账号搭建（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/account-setup`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.accountSetup ? "编辑方案" : "创建方案"}
          </Link>
        </div>
        {merchant.accountSetup ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.accountSetup.status)}
            {row("平台计划", merchant.accountSetup.platformPlanSummary)}
            {row("账号定位", merchant.accountSetup.accountPositioningSummary)}
            {row("命名方向", merchant.accountSetup.namingDirection)}
            {row("Bio 方向", merchant.accountSetup.bioDirection)}
            {row("视觉方向", merchant.accountSetup.visualDirectionSummary)}
            {row("人设方向", merchant.accountSetup.personaDirectionSummary)}
            {row(
              "Google Maps 方向",
              merchant.accountSetup.googleMapsDirectionSummary,
            )}
            {row("联系方式 / 私域", merchant.accountSetup.contactChannelSummary)}
            {row("风险", merchant.accountSetup.setupRiskSummary)}
            {row("备注", merchant.accountSetup.notes)}
            {row(
              "引用 TB-001 诊断",
              merchant.accountSetup.sourceDiagnosisId
                ? "已引用当前诊断"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.accountSetup.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.accountSetup.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无账号搭建方案。点击「创建方案」录入 TB-002 最小账号搭建（可引用当前 TB-001 诊断作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-003 素材采集（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/materials`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.materialCollection ? "编辑方案" : "创建方案"}
          </Link>
        </div>
        {merchant.materialCollection ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.materialCollection.status)}
            {row("素材分类", merchant.materialCollection.materialCategorySummary)}
            {row("素材缺口", merchant.materialCollection.materialGapSummary)}
            {row("拍摄场景", merchant.materialCollection.shootingSceneSummary)}
            {row("人物素材", merchant.materialCollection.peopleMaterialSummary)}
            {row(
              "产品 / 服务素材",
              merchant.materialCollection.productServiceMaterialSummary,
            )}
            {row("信任素材", merchant.materialCollection.trustMaterialSummary)}
            {row(
              "品牌故事素材",
              merchant.materialCollection.brandStoryMaterialSummary,
            )}
            {row(
              "采集优先级",
              merchant.materialCollection.collectionPrioritySummary,
            )}
            {row("风险", merchant.materialCollection.collectionRiskSummary)}
            {row("备注", merchant.materialCollection.notes)}
            {row(
              "引用 TB-002 账号搭建",
              merchant.materialCollection.sourceAccountSetupId
                ? "已引用当前账号搭建"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.materialCollection.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.materialCollection.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无素材采集方案。点击「创建方案」录入 TB-003 最小素材采集（可引用当前 TB-002 账号搭建作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-004 内容运营（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/content-operation`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.contentOperation ? "编辑方案" : "创建方案"}
          </Link>
        </div>
        {merchant.contentOperation ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.contentOperation.status)}
            {row("内容定位", merchant.contentOperation.contentPositioningSummary)}
            {row("栏目方向", merchant.contentOperation.contentPillarSummary)}
            {row("内容比例", merchant.contentOperation.contentRatioSummary)}
            {row(
              "发布频率",
              merchant.contentOperation.publishingFrequencySummary,
            )}
            {row("风格调性", merchant.contentOperation.toneStyleSummary)}
            {row("内容禁区", merchant.contentOperation.contentBoundarySummary)}
            {row(
              "前 30 天计划",
              merchant.contentOperation.first30DayPlanSummary,
            )}
            {row("内容风险", merchant.contentOperation.contentRiskSummary)}
            {row("备注", merchant.contentOperation.notes)}
            {row(
              "引用 TB-003 素材采集",
              merchant.contentOperation.sourceMaterialCollectionId
                ? "已引用当前素材采集"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.contentOperation.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.contentOperation.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无内容运营方案。点击「创建方案」录入 TB-004 最小内容运营（可引用当前 TB-003 素材采集作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-005 直播规划（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/live-planning`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.livePlanning ? "编辑方案" : "创建方案"}
          </Link>
        </div>
        {merchant.livePlanning ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.livePlanning.status)}
            {row("直播可行性", merchant.livePlanning.feasibilitySummary)}
            {row("直播平台", merchant.livePlanning.platformSummary)}
            {row("直播目标", merchant.livePlanning.liveGoalSummary)}
            {row("直播形式", merchant.livePlanning.liveFormatSummary)}
            {row("直播主题", merchant.livePlanning.liveTopicSummary)}
            {row("直播频率", merchant.livePlanning.liveFrequencySummary)}
            {row(
              "出镜 / 人员要求",
              merchant.livePlanning.hostPeopleRequirementSummary,
            )}
            {row("执行准备度", merchant.livePlanning.readinessSummary)}
            {row("直播风险", merchant.livePlanning.liveRiskSummary)}
            {row("备注", merchant.livePlanning.notes)}
            {row(
              "引用 TB-004 内容运营",
              merchant.livePlanning.sourceContentOperationId
                ? "已引用当前内容运营"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.livePlanning.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.livePlanning.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无直播规划方案。点击「创建方案」录入 TB-005 最小直播规划（可引用当前 TB-004 内容运营作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-006 引流转化（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/lead-conversion`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.leadConversion ? "编辑方案" : "创建方案"}
          </Link>
        </div>
        {merchant.leadConversion ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.leadConversion.status)}
            {row("引流路径", merchant.leadConversion.trafficPathSummary)}
            {row("转化路径", merchant.leadConversion.conversionPathSummary)}
            {row("私域承接", merchant.leadConversion.privateDomainSummary)}
            {row("活动想法", merchant.leadConversion.campaignIdeaSummary)}
            {row(
              "Google Maps 动作",
              merchant.leadConversion.googleMapsActionSummary,
            )}
            {row("投流测试方向", merchant.leadConversion.paidTrafficTestSummary)}
            {row("P-001 准备度", merchant.leadConversion.p001ReadinessSummary)}
            {row("30 天动作", merchant.leadConversion.thirtyDayActionSummary)}
            {row("归因方式", merchant.leadConversion.attributionMethodSummary)}
            {row("转化风险", merchant.leadConversion.conversionRiskSummary)}
            {row("备注", merchant.leadConversion.notes)}
            {row(
              "引用 TB-004 内容运营",
              merchant.leadConversion.sourceContentOperationId
                ? "已引用当前内容运营"
                : "未引用",
            )}
            {row(
              "引用 TB-005 直播规划",
              merchant.leadConversion.sourceLivePlanningId
                ? "已引用当前直播规划"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.leadConversion.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.leadConversion.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无引流转化方案。点击「创建方案」录入 TB-006 最小引流转化（可引用当前 TB-004 内容运营 + TB-005 直播规划作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-007 数据复盘（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/data-review`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.dataReview ? "编辑复盘" : "创建复盘"}
          </Link>
        </div>
        {merchant.dataReview ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.dataReview.status)}
            {row("复盘周期", merchant.dataReview.reviewPeriodLabel)}
            {row("目标完成度", merchant.dataReview.goalCompletionSummary)}
            {row("内容效果", merchant.dataReview.contentEffectSummary)}
            {row("直播效果", merchant.dataReview.liveEffectSummary)}
            {row(
              "引流转化效果",
              merchant.dataReview.leadConversionEffectSummary,
            )}
            {row("真实经营数据", merchant.dataReview.realBusinessDataSummary)}
            {row("问题诊断", merchant.dataReview.problemDiagnosisSummary)}
            {row("优化建议", merchant.dataReview.optimizationSuggestionSummary)}
            {row("策略判断", merchant.dataReview.strategyJudgmentSummary)}
            {row("归因观察", merchant.dataReview.attributionObservationSummary)}
            {row("复盘风险", merchant.dataReview.reviewRiskSummary)}
            {row("备注", merchant.dataReview.notes)}
            {row(
              "引用基准数据",
              merchant.dataReview.sourceBaselineMetricId ? "已引用当前基准" : "未引用",
            )}
            {row(
              "引用 TB-004 内容运营",
              merchant.dataReview.sourceContentOperationId
                ? "已引用当前内容运营"
                : "未引用",
            )}
            {row(
              "引用 TB-005 直播规划",
              merchant.dataReview.sourceLivePlanningId
                ? "已引用当前直播规划"
                : "未引用",
            )}
            {row(
              "引用 TB-006 引流转化",
              merchant.dataReview.sourceLeadConversionId
                ? "已引用当前引流转化"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.dataReview.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.dataReview.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无数据复盘。点击「创建复盘」录入 TB-007 最小数据复盘（可引用当前基准 + TB-004/005/006 作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            TB-008 90天增长计划（最小）
          </h2>
          <Link
            href={`/dashboard/merchants/${merchant.id}/growth-plan`}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
          >
            {merchant.ninetyDayGrowthPlan ? "编辑计划" : "创建计划"}
          </Link>
        </div>
        {merchant.ninetyDayGrowthPlan ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {row("状态", merchant.ninetyDayGrowthPlan.status)}
            {row("计划周期", merchant.ninetyDayGrowthPlan.planPeriodLabel)}
            {row("三阶段目标", merchant.ninetyDayGrowthPlan.stageGoalSummary)}
            {row("90 天路线图", merchant.ninetyDayGrowthPlan.roadmapSummary)}
            {row("平台优先级", merchant.ninetyDayGrowthPlan.platformPrioritySummary)}
            {row("内容路线", merchant.ninetyDayGrowthPlan.contentRouteSummary)}
            {row("引流路线", merchant.ninetyDayGrowthPlan.leadConversionRouteSummary)}
            {row("KPI 摘要", merchant.ninetyDayGrowthPlan.kpiSummary)}
            {row("风险摘要", merchant.ninetyDayGrowthPlan.riskSummary)}
            {row("周期判断", merchant.ninetyDayGrowthPlan.cycleJudgmentSummary)}
            {row(
              "下一阶段方向",
              merchant.ninetyDayGrowthPlan.nextStageDirectionSummary,
            )}
            {row("备注", merchant.ninetyDayGrowthPlan.notes)}
            {row(
              "引用基准数据",
              merchant.ninetyDayGrowthPlan.sourceBaselineMetricId
                ? "已引用当前基准"
                : "未引用",
            )}
            {row(
              "引用 TB-001 诊断",
              merchant.ninetyDayGrowthPlan.sourceDiagnosisId
                ? "已引用当前诊断"
                : "未引用",
            )}
            {row(
              "引用 TB-006 引流转化",
              merchant.ninetyDayGrowthPlan.sourceLeadConversionId
                ? "已引用当前引流转化"
                : "未引用",
            )}
            {row(
              "引用 TB-007 数据复盘",
              merchant.ninetyDayGrowthPlan.sourceDataReviewId
                ? "已引用当前数据复盘"
                : "未引用",
            )}
            {row(
              "更新时间",
              merchant.ninetyDayGrowthPlan.updatedAt
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            )}
            {row("更新人", merchant.ninetyDayGrowthPlan.updatedBy?.email)}
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">
            暂无 90 天增长计划。点击「创建计划」录入 TB-008 最小增长计划（可引用当前基准 + TB-001 诊断 + TB-006 引流转化 + TB-007 数据复盘作为上游输入）。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          后续模块（占位，本阶段不实现）
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {FUTURE_MODULES.map((m) => (
            <li key={m} className="flex items-center justify-between">
              <span>{m}</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                未开始
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
