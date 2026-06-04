import type { getMerchantById } from "@/lib/merchants/data";

// ===== Operating Health Workspace Snapshot (TASK-044) =====
// READ-ONLY, RULE-BASED mapping of EXISTING merchant data to the five operating organs
// (see docs/project/merchant-operating-health-check-architecture-v1.md). This is NOT a
// diagnosis, NOT an AI judgment, NOT a score, NOT a business decision — it only surfaces
// which organ has a signal / a risk direction / a data gap, to help operators see where to
// look. No DB query here: operate on the already-included getMerchantById result.

type MerchantFull = NonNullable<Awaited<ReturnType<typeof getMerchantById>>>;

/** Organ display status. signal = has info · attention = info + risk gap · missing = no info · unknown = insufficient/no dedicated data. */
export type OrganStatus = "signal" | "attention" | "missing" | "unknown";

export type OperatingOrgan = {
  key: "channel" | "offer" | "fulfillment" | "cashflow" | "organization";
  label: string; // 渠道器官 (Channel)
  cart: string; // 小吃车类比 (摊位)
  status: OrganStatus;
  observation: string; // 关键观察
  sources: string[]; // 数据来源（哪些已有字段提供了信号）
  gaps: string[]; // 数据缺口
  nextStep: string; // 非决策型下一步建议（建议补充 / 建议关注 / 可在诊断中进一步确认）
  /** true for organs with no dedicated model yet (Fulfillment / Organization) — weak signals only. */
  weakSignalOnly: boolean;
};

export type OperatingHealthSnapshot = {
  organs: OperatingOrgan[];
  firstAttentionOrgan: OperatingOrgan | null;
  /** organs whose status is missing or unknown (display-only data-gap count). */
  missingEvidenceCount: number;
  /** any organ flagged "attention" — DISPLAY-ONLY risk hint, never a decision input. */
  hasCriticalAttention: boolean;
};

/** Non-empty string presence. */
function has(v: unknown): boolean {
  return typeof v === "string" && v.trim() !== "";
}
/** Non-null presence (numbers / Decimal / enums). */
function present(v: unknown): boolean {
  return v !== null && v !== undefined && (typeof v !== "string" || v.trim() !== "");
}

const WEAK_NOTE = "当前仅为弱信号，后续需要专门采集";

export function buildOperatingHealthSnapshot(
  m: MerchantFull,
): OperatingHealthSnapshot {
  const p = m.profile;
  const b = m.baseline;
  const d = m.diagnosis;
  const acc = m.accountSetup;
  const co = m.contentOperation;
  const lp = m.livePlanning;
  const lc = m.leadConversion;
  const dr = m.dataReview;
  const gp = m.ninetyDayGrowthPlan;
  const oc = m.operatingCapacity; // P2-016 dedicated Fulfillment + Organization intake

  // collect labelled sources for fields that actually carry data
  const src = (cond: boolean, label: string): string[] => (cond ? [label] : []);

  // ---- 1) Channel ----
  const chSources = [
    ...src(has(p?.currentAcquisitionSummary), "画像·当前获客"),
    ...src(has(p?.onlinePresenceSummary), "画像·线上情况"),
    ...src(has(acc?.platformPlanSummary), "TB-002·平台计划"),
    ...src(has(lc?.trafficPathSummary), "TB-006·引流路径"),
    ...src(has(lc?.googleMapsActionSummary), "TB-006·Google Maps 动作"),
  ];
  const trafficIntent = has(lc?.trafficPathSummary) || has(lc?.googleMapsActionSummary);
  const attributionKnown = has(lc?.attributionMethodSummary);
  const channel: OperatingOrgan = {
    key: "channel",
    label: "渠道器官 (Channel)",
    cart: "摊位",
    weakSignalOnly: false,
    status: chSources.length === 0 ? "missing" : trafficIntent && !attributionKnown ? "attention" : "signal",
    observation:
      chSources.length === 0
        ? "暂无任何渠道/获客信息。"
        : trafficIntent && !attributionKnown
          ? "已有引流想法，但缺归因方式，无法区分自然流量与投放。"
          : "已有渠道/获客相关信号。",
    sources: chSources,
    gaps: [
      ...src(!has(p?.currentAcquisitionSummary), "当前获客来源"),
      ...src(trafficIntent && !attributionKnown, "归因方式"),
    ],
    nextStep:
      chSources.length === 0
        ? "建议补充当前获客来源与线上阵地信息。"
        : trafficIntent && !attributionKnown
          ? "建议关注：补充归因方式，可在诊断中进一步确认渠道是否接近交易。"
          : "可在诊断中进一步确认渠道是否为交易入口（而非仅曝光）。",
  };

  // ---- 2) Offer ----
  const offSources = [
    ...src(has(p?.coreOfferSummary), "画像·核心卖点"),
    ...src(has(d?.opportunitySummary), "TB-001·机会点"),
    ...src(has(lc?.conversionPathSummary), "TB-006·转化路径"),
    ...src(has(gp?.stageGoalSummary), "TB-008·三阶段目标"),
  ];
  const offerKnown = has(p?.coreOfferSummary);
  const conversionKnown = has(lc?.conversionPathSummary);
  const offer: OperatingOrgan = {
    key: "offer",
    label: "Offer 器官 (Offer)",
    cart: "菜单",
    weakSignalOnly: false,
    status: offSources.length === 0 ? "missing" : offerKnown && !conversionKnown ? "attention" : "signal",
    observation:
      offSources.length === 0
        ? "暂无 Offer / 卖点信息。"
        : offerKnown && !conversionKnown
          ? "已有核心卖点，但缺明确的转化路径。"
          : "已有 Offer / 卖点 / 转化路径相关信号。",
    sources: offSources,
    gaps: [
      ...src(!has(p?.coreOfferSummary), "核心卖点"),
      ...src(!has(lc?.conversionPathSummary), "转化路径 / 首单入口"),
    ],
    nextStep:
      offSources.length === 0
        ? "建议补充核心卖点、目标客群与价格/首单信息。"
        : offerKnown && !conversionKnown
          ? "建议关注：补充转化路径与首单入口，可在诊断中进一步确认 Offer 是否 3 秒可懂。"
          : "可在诊断中进一步确认 Offer 清晰度与聚焦度。",
  };

  // ---- 3) Fulfillment (reads the dedicated operating-capacity asset; falls back to weak signals) ----
  const ocFfCapacity =
    has(oc?.responseProcessSummary) ||
    has(oc?.responseTimeSummary) ||
    has(oc?.bookingProcessSummary) ||
    has(oc?.serviceCapacitySummary) ||
    has(oc?.peakHourHandlingSummary);
  const ocFfRisk = has(oc?.fulfillmentRiskSummary) || has(oc?.customerExperienceRiskSummary);
  const ffDedicated = ocFfCapacity || ocFfRisk; // dedicated intake present?
  // scattered weak signals — used only when no dedicated capacity data
  const ffWeakRisk =
    has(p?.executionLimitSummary) ||
    has(d?.riskSummary) ||
    has(lc?.conversionRiskSummary) ||
    has(dr?.problemDiagnosisSummary) ||
    has(dr?.reviewRiskSummary);
  const ffWeakCapacity = has(lc?.privateDomainSummary);
  const ffSources = [
    ...src(ffDedicated, "经营承接能力采集"),
    ...src(has(lc?.privateDomainSummary), "TB-006·私域承接"),
    ...src(has(p?.executionLimitSummary), "画像·执行限制"),
    ...src(has(d?.riskSummary), "TB-001·风险"),
    ...src(has(lc?.conversionRiskSummary), "TB-006·转化风险"),
    ...src(has(dr?.problemDiagnosisSummary), "TB-007·问题诊断"),
    ...src(has(dr?.reviewRiskSummary), "TB-007·复盘风险"),
  ];
  const fulfillment: OperatingOrgan = {
    key: "fulfillment",
    label: "履约器官 (Fulfillment)",
    cart: "出餐",
    weakSignalOnly: !ffDedicated,
    status: ffDedicated
      ? ocFfRisk
        ? "attention"
        : "signal"
      : ffWeakRisk
        ? "attention"
        : ffWeakCapacity
          ? "signal"
          : "unknown",
    observation: ffDedicated
      ? ocFfRisk
        ? "已采集履约承接能力，且记录了履约 / 客户体验风险。"
        : "已采集履约承接能力信息。"
      : ffWeakRisk
        ? `出现执行限制 / 转化风险 / 复盘风险等承接相关信号。${WEAK_NOTE}（履约采集）。`
        : ffWeakCapacity
          ? `有私域承接相关说明。${WEAK_NOTE}（履约采集）。`
          : `当前缺少履约专项数据。${WEAK_NOTE}（履约采集）。`,
    sources: ffSources,
    gaps: ffDedicated ? [] : ["专门的履约/承接能力数据（响应时效、产能上限、忙时稳定性）"],
    nextStep: ffDedicated
      ? ocFfRisk
        ? "建议关注已记录的履约风险，可在诊断中进一步确认引流后是否接得住。"
        : "可在诊断中进一步确认承接能力是否匹配放量。"
      : ffWeakRisk
        ? "建议关注承接能力，可在诊断中进一步确认引流后是否接得住。"
        : "建议补充履约承接信息（点击「编辑经营承接能力」录入）。",
  };

  // ---- 4) Cashflow ----
  const baselineData =
    !!b && (present(b.monthlyRevenue) || present(b.averageOrderValue) || present(b.monthlyCustomerCount));
  const realData = has(dr?.realBusinessDataSummary);
  const cashData = baselineData || realData;
  const paidIntent = has(lc?.paidTrafficTestSummary);
  const cashAttribution = has(lc?.attributionMethodSummary);
  const cfSources = [
    ...src(baselineData, "基准·营业额/客单/客户数"),
    ...src(has(b?.dataConfidence) && b?.dataConfidence !== "unknown", "基准·数据可信度"),
    ...src(realData, "TB-007·真实经营数据"),
    ...src(paidIntent, "TB-006·投流测试"),
    ...src(cashAttribution, "TB-006·归因方式"),
  ];
  const cashflow: OperatingOrgan = {
    key: "cashflow",
    label: "现金流器官 (Cashflow)",
    cart: "账本",
    weakSignalOnly: false,
    status: !cashData ? "missing" : paidIntent && !cashAttribution ? "attention" : "signal",
    observation: !cashData
      ? "暂无基准/真实经营数据，无法判断单位经济是否为正。"
      : paidIntent && !cashAttribution
        ? "已有投流/增长动作，但缺归因方式，ROI 难以计算。"
        : "已有基线或真实经营数据。",
    sources: cfSources,
    gaps: [
      ...src(!baselineData, "增长前基准数据（营业额/客单价/客户数）"),
      ...src(paidIntent && !cashAttribution, "归因方式 / ROI 口径"),
      ...src(!!b && b.dataConfidence === "unknown", "数据可信度（当前 unknown）"),
    ],
    nextStep: !cashData
      ? "建议补充增长前基准数据（营业额、客单价、客户数）。"
      : paidIntent && !cashAttribution
        ? "建议关注：补充归因方式，可在 MVS / 诊断中进一步确认 ROI 是否算得清。"
        : "可在诊断中进一步确认单位经济与活动盈亏边界。",
  };

  // ---- 5) Organization (reads the dedicated operating-capacity asset; falls back to weak signals) ----
  const ocOrgCapacity =
    has(oc?.ownerDependencySummary) ||
    has(oc?.staffRoleSummary) ||
    has(oc?.delegationReadinessSummary) ||
    has(oc?.standardProcessSummary) ||
    has(oc?.trainingReadinessSummary);
  const ocOrgRisk = has(oc?.organizationRiskSummary);
  const orgDedicated = ocOrgCapacity || ocOrgRisk;
  const orgWeakRisk =
    has(p?.executionLimitSummary) ||
    has(d?.riskSummary) ||
    has(co?.contentRiskSummary) ||
    has(dr?.reviewRiskSummary);
  const orgWeakCapacity = has(lp?.hostPeopleRequirementSummary) || has(lp?.readinessSummary);
  const orgSources = [
    ...src(orgDedicated, "经营承接能力采集"),
    ...src(has(p?.executionLimitSummary), "画像·执行限制"),
    ...src(has(d?.riskSummary), "TB-001·风险"),
    ...src(has(co?.contentRiskSummary), "TB-004·内容风险"),
    ...src(has(lp?.hostPeopleRequirementSummary), "TB-005·出镜/人员要求"),
    ...src(has(lp?.readinessSummary), "TB-005·执行准备度"),
    ...src(has(dr?.reviewRiskSummary), "TB-007·复盘风险"),
  ];
  const organization: OperatingOrgan = {
    key: "organization",
    label: "组织器官 (Organization)",
    cart: "老板",
    weakSignalOnly: !orgDedicated,
    status: orgDedicated
      ? ocOrgRisk
        ? "attention"
        : "signal"
      : orgWeakRisk
        ? "attention"
        : orgWeakCapacity
          ? "signal"
          : "unknown",
    observation: orgDedicated
      ? ocOrgRisk
        ? "已采集组织承接能力，且记录了组织风险。"
        : "已采集组织承接能力信息。"
      : orgWeakRisk
        ? `出现执行限制 / 内容或复盘风险等组织相关信号。${WEAK_NOTE}（组织采集）。`
        : orgWeakCapacity
          ? `有人员 / 准备度相关说明。${WEAK_NOTE}（组织采集）。`
          : `当前缺少组织专项数据。${WEAK_NOTE}（组织采集）。`,
    sources: orgSources,
    gaps: orgDedicated ? [] : ["专门的组织/单点依赖数据（老板是否单点、可委派性、配合能力）"],
    nextStep: orgDedicated
      ? ocOrgRisk
        ? "建议关注已记录的组织风险，可在诊断中进一步确认是减负还是增负。"
        : "可在诊断中进一步确认老板单点依赖是否影响放量。"
      : orgWeakRisk
        ? "建议关注老板单点依赖，可在诊断中进一步确认 TOT 介入是减负还是增负。"
        : "建议补充组织信息（点击「编辑经营承接能力」录入）。",
  };

  const organs = [channel, offer, fulfillment, cashflow, organization];
  const firstAttentionOrgan = organs.find((o) => o.status === "attention") ?? null;
  const missingEvidenceCount = organs.filter(
    (o) => o.status === "missing" || o.status === "unknown",
  ).length;
  const hasCriticalAttention = organs.some((o) => o.status === "attention");

  return { organs, firstAttentionOrgan, missingEvidenceCount, hasCriticalAttention };
}
