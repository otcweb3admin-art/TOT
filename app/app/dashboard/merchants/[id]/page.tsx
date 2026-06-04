import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getMerchantById } from "@/lib/merchants/data";
import { StatusBadge } from "@/components/merchants/status-badge";
import {
  AssetSummaryGrid,
  type SummaryRow,
} from "@/components/merchants/asset-summary-grid";
import { MerchantAssetSection } from "@/components/merchants/merchant-asset-section";
import { formatDateTime, referenceLabel } from "@/components/merchants/format";
import {
  isDemoMerchant,
  DemoDataBadge,
} from "@/components/merchants/demo-data-badge";

export const dynamic = "force-dynamic";

// Placeholder only — these modules are NOT implemented yet.
const FUTURE_MODULES = ["增长诊断", "策略", "计划", "执行", "监控", "复盘"];

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(); // guard: unauthenticated -> /login
  const { id } = await params; // Next 16: params is async
  const merchant = await getMerchantById(id, user);
  if (!merchant) notFound();

  const base = `/dashboard/merchants/${merchant.id}`;

  // Per-asset summary rows (only built/read when the asset exists). Values & labels are
  // preserved verbatim from the prior inline sections; status -> unified StatusBadge.
  const profileRows = (p: NonNullable<typeof merchant.profile>): SummaryRow[] => [
    { label: "行业细分", value: p.industryDetail },
    { label: "目标客群", value: p.targetCustomerSummary },
    { label: "核心卖点", value: p.coreOfferSummary },
    { label: "当前获客", value: p.currentAcquisitionSummary },
    { label: "线上情况", value: p.onlinePresenceSummary },
    { label: "增长目标", value: p.growthGoalSummary },
    { label: "执行限制", value: p.executionLimitSummary },
    { label: "基准数据", value: p.baselineDataSummary },
    { label: "备注", value: p.notes },
    { label: "更新时间", value: formatDateTime(p.updatedAt) },
    { label: "更新人", value: p.updatedBy?.email },
  ];

  const baselineRows = (
    b: NonNullable<typeof merchant.baseline>,
  ): SummaryRow[] => [
    { label: "统计周期", value: b.periodLabel },
    { label: "月营业额", value: b.monthlyRevenue?.toString() },
    { label: "月客户数", value: b.monthlyCustomerCount?.toString() },
    { label: "月咨询数", value: b.monthlyLeadCount?.toString() },
    { label: "月成交数", value: b.monthlyConversionCount?.toString() },
    { label: "客单价", value: b.averageOrderValue?.toString() },
    { label: "复购率", value: b.repeatCustomerRate?.toString() },
    { label: "粉丝数", value: b.followerCount?.toString() },
    { label: "评论数", value: b.reviewCount?.toString() },
    { label: "平均评分", value: b.averageRating?.toString() },
    { label: "数据来源", value: b.sourceNote },
    { label: "数据可信度", value: b.dataConfidence },
    { label: "备注", value: b.notes },
    { label: "更新时间", value: formatDateTime(b.updatedAt) },
    { label: "更新人", value: b.updatedBy?.email },
  ];

  const diagnosisRows = (
    d: NonNullable<typeof merchant.diagnosis>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={d.status} /> },
    { label: "诊断摘要", value: d.diagnosisSummary },
    { label: "增长问题", value: d.growthProblemSummary },
    { label: "机会点", value: d.opportunitySummary },
    { label: "风险", value: d.riskSummary },
    { label: "建议下一步", value: d.recommendedNextStep },
    { label: "引用画像", value: referenceLabel(d.sourceProfileId, "画像") },
    { label: "引用基准", value: referenceLabel(d.sourceBaselineMetricId, "基准") },
    { label: "更新时间", value: formatDateTime(d.updatedAt) },
    { label: "更新人", value: d.updatedBy?.email },
  ];

  const accountSetupRows = (
    a: NonNullable<typeof merchant.accountSetup>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={a.status} /> },
    { label: "平台计划", value: a.platformPlanSummary },
    { label: "账号定位", value: a.accountPositioningSummary },
    { label: "命名方向", value: a.namingDirection },
    { label: "Bio 方向", value: a.bioDirection },
    { label: "视觉方向", value: a.visualDirectionSummary },
    { label: "人设方向", value: a.personaDirectionSummary },
    { label: "Google Maps 方向", value: a.googleMapsDirectionSummary },
    { label: "联系方式 / 私域", value: a.contactChannelSummary },
    { label: "风险", value: a.setupRiskSummary },
    { label: "备注", value: a.notes },
    {
      label: "引用 TB-001 诊断",
      value: referenceLabel(a.sourceDiagnosisId, "诊断"),
    },
    { label: "更新时间", value: formatDateTime(a.updatedAt) },
    { label: "更新人", value: a.updatedBy?.email },
  ];

  const materialRows = (
    m: NonNullable<typeof merchant.materialCollection>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={m.status} /> },
    { label: "素材分类", value: m.materialCategorySummary },
    { label: "素材缺口", value: m.materialGapSummary },
    { label: "拍摄场景", value: m.shootingSceneSummary },
    { label: "人物素材", value: m.peopleMaterialSummary },
    { label: "产品 / 服务素材", value: m.productServiceMaterialSummary },
    { label: "信任素材", value: m.trustMaterialSummary },
    { label: "品牌故事素材", value: m.brandStoryMaterialSummary },
    { label: "采集优先级", value: m.collectionPrioritySummary },
    { label: "风险", value: m.collectionRiskSummary },
    { label: "备注", value: m.notes },
    {
      label: "引用 TB-002 账号搭建",
      value: referenceLabel(m.sourceAccountSetupId, "账号搭建"),
    },
    { label: "更新时间", value: formatDateTime(m.updatedAt) },
    { label: "更新人", value: m.updatedBy?.email },
  ];

  const contentOperationRows = (
    co: NonNullable<typeof merchant.contentOperation>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={co.status} /> },
    { label: "内容定位", value: co.contentPositioningSummary },
    { label: "栏目方向", value: co.contentPillarSummary },
    { label: "内容比例", value: co.contentRatioSummary },
    { label: "发布频率", value: co.publishingFrequencySummary },
    { label: "风格调性", value: co.toneStyleSummary },
    { label: "内容禁区", value: co.contentBoundarySummary },
    { label: "前 30 天计划", value: co.first30DayPlanSummary },
    { label: "内容风险", value: co.contentRiskSummary },
    { label: "备注", value: co.notes },
    {
      label: "引用 TB-003 素材采集",
      value: referenceLabel(co.sourceMaterialCollectionId, "素材采集"),
    },
    { label: "更新时间", value: formatDateTime(co.updatedAt) },
    { label: "更新人", value: co.updatedBy?.email },
  ];

  const livePlanningRows = (
    lp: NonNullable<typeof merchant.livePlanning>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={lp.status} /> },
    { label: "直播可行性", value: lp.feasibilitySummary },
    { label: "直播平台", value: lp.platformSummary },
    { label: "直播目标", value: lp.liveGoalSummary },
    { label: "直播形式", value: lp.liveFormatSummary },
    { label: "直播主题", value: lp.liveTopicSummary },
    { label: "直播频率", value: lp.liveFrequencySummary },
    { label: "出镜 / 人员要求", value: lp.hostPeopleRequirementSummary },
    { label: "执行准备度", value: lp.readinessSummary },
    { label: "直播风险", value: lp.liveRiskSummary },
    { label: "备注", value: lp.notes },
    {
      label: "引用 TB-004 内容运营",
      value: referenceLabel(lp.sourceContentOperationId, "内容运营"),
    },
    { label: "更新时间", value: formatDateTime(lp.updatedAt) },
    { label: "更新人", value: lp.updatedBy?.email },
  ];

  const leadConversionRows = (
    lc: NonNullable<typeof merchant.leadConversion>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={lc.status} /> },
    { label: "引流路径", value: lc.trafficPathSummary },
    { label: "转化路径", value: lc.conversionPathSummary },
    { label: "私域承接", value: lc.privateDomainSummary },
    { label: "活动想法", value: lc.campaignIdeaSummary },
    { label: "Google Maps 动作", value: lc.googleMapsActionSummary },
    { label: "投流测试方向", value: lc.paidTrafficTestSummary },
    { label: "P-001 准备度", value: lc.p001ReadinessSummary },
    { label: "30 天动作", value: lc.thirtyDayActionSummary },
    { label: "归因方式", value: lc.attributionMethodSummary },
    { label: "转化风险", value: lc.conversionRiskSummary },
    { label: "备注", value: lc.notes },
    {
      label: "引用 TB-004 内容运营",
      value: referenceLabel(lc.sourceContentOperationId, "内容运营"),
    },
    {
      label: "引用 TB-005 直播规划",
      value: referenceLabel(lc.sourceLivePlanningId, "直播规划"),
    },
    { label: "更新时间", value: formatDateTime(lc.updatedAt) },
    { label: "更新人", value: lc.updatedBy?.email },
  ];

  const dataReviewRows = (
    dr: NonNullable<typeof merchant.dataReview>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={dr.status} /> },
    { label: "复盘周期", value: dr.reviewPeriodLabel },
    { label: "目标完成度", value: dr.goalCompletionSummary },
    { label: "内容效果", value: dr.contentEffectSummary },
    { label: "直播效果", value: dr.liveEffectSummary },
    { label: "引流转化效果", value: dr.leadConversionEffectSummary },
    { label: "真实经营数据", value: dr.realBusinessDataSummary },
    { label: "问题诊断", value: dr.problemDiagnosisSummary },
    { label: "优化建议", value: dr.optimizationSuggestionSummary },
    { label: "策略判断", value: dr.strategyJudgmentSummary },
    { label: "归因观察", value: dr.attributionObservationSummary },
    { label: "复盘风险", value: dr.reviewRiskSummary },
    { label: "备注", value: dr.notes },
    {
      label: "引用基准数据",
      value: referenceLabel(dr.sourceBaselineMetricId, "基准"),
    },
    {
      label: "引用 TB-004 内容运营",
      value: referenceLabel(dr.sourceContentOperationId, "内容运营"),
    },
    {
      label: "引用 TB-005 直播规划",
      value: referenceLabel(dr.sourceLivePlanningId, "直播规划"),
    },
    {
      label: "引用 TB-006 引流转化",
      value: referenceLabel(dr.sourceLeadConversionId, "引流转化"),
    },
    { label: "更新时间", value: formatDateTime(dr.updatedAt) },
    { label: "更新人", value: dr.updatedBy?.email },
  ];

  const growthPlanRows = (
    gp: NonNullable<typeof merchant.ninetyDayGrowthPlan>,
  ): SummaryRow[] => [
    { label: "状态", value: <StatusBadge status={gp.status} /> },
    { label: "计划周期", value: gp.planPeriodLabel },
    { label: "三阶段目标", value: gp.stageGoalSummary },
    { label: "90 天路线图", value: gp.roadmapSummary },
    { label: "平台优先级", value: gp.platformPrioritySummary },
    { label: "内容路线", value: gp.contentRouteSummary },
    { label: "引流路线", value: gp.leadConversionRouteSummary },
    { label: "KPI 摘要", value: gp.kpiSummary },
    { label: "风险摘要", value: gp.riskSummary },
    { label: "周期判断", value: gp.cycleJudgmentSummary },
    { label: "下一阶段方向", value: gp.nextStageDirectionSummary },
    { label: "备注", value: gp.notes },
    {
      label: "引用基准数据",
      value: referenceLabel(gp.sourceBaselineMetricId, "基准"),
    },
    {
      label: "引用 TB-001 诊断",
      value: referenceLabel(gp.sourceDiagnosisId, "诊断"),
    },
    {
      label: "引用 TB-006 引流转化",
      value: referenceLabel(gp.sourceLeadConversionId, "引流转化"),
    },
    {
      label: "引用 TB-007 数据复盘",
      value: referenceLabel(gp.sourceDataReviewId, "数据复盘"),
    },
    { label: "更新时间", value: formatDateTime(gp.updatedAt) },
    { label: "更新人", value: gp.updatedBy?.email },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{merchant.name}</h1>
          <p className="text-sm text-zinc-500">
            商家详情 · P2 Merchant Intake Foundation
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`${base}/workspace`}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-zinc-900"
          >
            打开工作台
          </Link>
          <Link
            href="/dashboard/merchants"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            ← 列表
          </Link>
        </div>
      </header>

      {isDemoMerchant(merchant.name) && <DemoDataBadge />}

      {/* 基础信息 — always present (no create/edit link), so a plain section. */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">基础信息</h2>
        <AssetSummaryGrid
          rows={[
            { label: "状态", value: <StatusBadge status={merchant.status} /> },
            { label: "行业", value: merchant.industry },
            { label: "城市", value: merchant.city },
            { label: "国家", value: merchant.country },
            { label: "联系人", value: merchant.contactName },
            { label: "联系电话", value: merchant.contactPhone },
            { label: "联系邮箱", value: merchant.contactEmail },
            { label: "负责人", value: merchant.owner?.email },
            { label: "创建人", value: merchant.createdBy?.email },
            { label: "创建时间", value: formatDateTime(merchant.createdAt) },
            { label: "备注", value: merchant.notes },
          ]}
        />
      </section>

      <MerchantAssetSection
        title="商家画像（Merchant Profile）"
        href={`${base}/profile`}
        exists={!!merchant.profile}
        editLabel="编辑画像"
        createLabel="创建画像"
        emptyText="暂无商家画像。点击「创建画像」录入摘要级画像信息（为后续 TB-001 / 诊断 / 策略提供输入）。"
      >
        {merchant.profile && <AssetSummaryGrid rows={profileRows(merchant.profile)} />}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="增长前基准数据（Baseline Metrics）"
        href={`${base}/baseline`}
        exists={!!merchant.baseline}
        editLabel="编辑基准"
        createLabel="创建基准"
        emptyText="暂无增长前基准数据。点击「创建基准」录入（为后续 TB-001 / MVS / 复盘 / 经验沉淀提供对照基线）。"
      >
        {merchant.baseline && <AssetSummaryGrid rows={baselineRows(merchant.baseline)} />}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-001 商家诊断（最小）"
        href={`${base}/diagnosis`}
        exists={!!merchant.diagnosis}
        editLabel="编辑诊断"
        createLabel="创建诊断"
        emptyText="暂无 TB-001 诊断。点击「创建诊断」录入最小诊断摘要（可引用当前画像 + 基准作为上游输入）。"
      >
        {merchant.diagnosis && (
          <AssetSummaryGrid rows={diagnosisRows(merchant.diagnosis)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-002 账号搭建（最小）"
        href={`${base}/account-setup`}
        exists={!!merchant.accountSetup}
        editLabel="编辑方案"
        createLabel="创建方案"
        emptyText="暂无账号搭建方案。点击「创建方案」录入 TB-002 最小账号搭建（可引用当前 TB-001 诊断作为上游输入）。"
      >
        {merchant.accountSetup && (
          <AssetSummaryGrid rows={accountSetupRows(merchant.accountSetup)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-003 素材采集（最小）"
        href={`${base}/materials`}
        exists={!!merchant.materialCollection}
        editLabel="编辑方案"
        createLabel="创建方案"
        emptyText="暂无素材采集方案。点击「创建方案」录入 TB-003 最小素材采集（可引用当前 TB-002 账号搭建作为上游输入）。"
      >
        {merchant.materialCollection && (
          <AssetSummaryGrid rows={materialRows(merchant.materialCollection)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-004 内容运营（最小）"
        href={`${base}/content-operation`}
        exists={!!merchant.contentOperation}
        editLabel="编辑方案"
        createLabel="创建方案"
        emptyText="暂无内容运营方案。点击「创建方案」录入 TB-004 最小内容运营（可引用当前 TB-003 素材采集作为上游输入）。"
      >
        {merchant.contentOperation && (
          <AssetSummaryGrid rows={contentOperationRows(merchant.contentOperation)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-005 直播规划（最小）"
        href={`${base}/live-planning`}
        exists={!!merchant.livePlanning}
        editLabel="编辑方案"
        createLabel="创建方案"
        emptyText="暂无直播规划方案。点击「创建方案」录入 TB-005 最小直播规划（可引用当前 TB-004 内容运营作为上游输入）。"
      >
        {merchant.livePlanning && (
          <AssetSummaryGrid rows={livePlanningRows(merchant.livePlanning)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-006 引流转化（最小）"
        href={`${base}/lead-conversion`}
        exists={!!merchant.leadConversion}
        editLabel="编辑方案"
        createLabel="创建方案"
        emptyText="暂无引流转化方案。点击「创建方案」录入 TB-006 最小引流转化（可引用当前 TB-004 内容运营 + TB-005 直播规划作为上游输入）。"
      >
        {merchant.leadConversion && (
          <AssetSummaryGrid rows={leadConversionRows(merchant.leadConversion)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-007 数据复盘（最小）"
        href={`${base}/data-review`}
        exists={!!merchant.dataReview}
        editLabel="编辑复盘"
        createLabel="创建复盘"
        emptyText="暂无数据复盘。点击「创建复盘」录入 TB-007 最小数据复盘（可引用当前基准 + TB-004/005/006 作为上游输入）。"
      >
        {merchant.dataReview && (
          <AssetSummaryGrid rows={dataReviewRows(merchant.dataReview)} />
        )}
      </MerchantAssetSection>

      <MerchantAssetSection
        title="TB-008 90天增长计划（最小）"
        href={`${base}/growth-plan`}
        exists={!!merchant.ninetyDayGrowthPlan}
        editLabel="编辑计划"
        createLabel="创建计划"
        emptyText="暂无 90 天增长计划。点击「创建计划」录入 TB-008 最小增长计划（可引用当前基准 + TB-001 诊断 + TB-006 引流转化 + TB-007 数据复盘作为上游输入）。"
      >
        {merchant.ninetyDayGrowthPlan && (
          <AssetSummaryGrid rows={growthPlanRows(merchant.ninetyDayGrowthPlan)} />
        )}
      </MerchantAssetSection>

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
