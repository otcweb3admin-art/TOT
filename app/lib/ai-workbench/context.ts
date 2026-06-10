import type { getMerchantById } from "@/lib/merchants/data";
import { buildMerchantWorkspace } from "@/lib/merchants/workspace";
import { buildOperatingHealthSnapshot } from "@/lib/merchants/operating-health";

// ===== AI Workbench merchant context builder (TASK-065) =====
// READ-ONLY: shapes the already-loaded merchant (getMerchantById, permission-filtered) into
// a plain-text context for a copy-paste prompt. Missing fields are explicitly written as
// 「待补充」— empty data is NEVER dressed up as known fact. No DB access, no mutation.

type MerchantFull = NonNullable<Awaited<ReturnType<typeof getMerchantById>>>;

const MISSING = "（待补充）";

/** value or the explicit 待补充 marker. */
function v(x: string | null | undefined): string {
  const s = (x ?? "").trim();
  return s === "" ? MISSING : s;
}
function n(x: unknown): string {
  return x === null || x === undefined ? MISSING : String(x);
}

export type AiMerchantContext = {
  text: string; // 给 Prompt 用的纯文本上下文
  missing: string[]; // 明确缺失信息列表
  isDemo: boolean;
  isUat: boolean; // TASK-068: UAT 虚拟测试商家（仅压测，不得当真实案例/对外引用）
};

export function buildAiMerchantContext(m: MerchantFull): AiMerchantContext {
  const isDemo = m.name.startsWith("DEMO_");
  const isUat = m.name.startsWith("UAT_");
  const missing: string[] = [];
  const track = (label: string, val: string | null | undefined) => {
    const s = v(val);
    if (s === MISSING) missing.push(label);
    return s;
  };

  const p = m.profile;
  const b = m.baseline;
  const oc = m.operatingCapacity;

  const lines: string[] = [];
  lines.push(`【商家】${m.name}${isDemo ? "（DEMO 演示数据，非真实商家）" : ""}${isUat ? "（UAT 虚拟测试数据，仅用于系统测试，非真实商家）" : ""}`);
  lines.push(`行业：${track("行业", m.industry)} ｜ 城市/区域：${track("城市/区域", [m.city, m.country].filter(Boolean).join(" / ") || null)}`);

  lines.push("");
  lines.push("【商家画像】");
  if (p) {
    lines.push(`目标客群：${track("目标客群", p.targetCustomerSummary)}`);
    lines.push(`核心卖点：${track("核心卖点", p.coreOfferSummary)}`);
    lines.push(`当前获客方式：${track("当前获客方式", p.currentAcquisitionSummary)}`);
    lines.push(`线上基础：${track("线上基础", p.onlinePresenceSummary)}`);
    lines.push(`增长目标：${track("增长目标", p.growthGoalSummary)}`);
    lines.push(`执行限制：${track("执行限制", p.executionLimitSummary)}`);
  } else {
    lines.push("（整块待补充——画像未填写）");
    missing.push("商家画像（整块）");
  }

  lines.push("");
  lines.push("【基线数据（增长前基准）】");
  if (b) {
    lines.push(`统计周期：${track("基线统计周期", b.periodLabel)}`);
    lines.push(`月营业额：${n(b.monthlyRevenue)} ｜ 月客户数：${n(b.monthlyCustomerCount)} ｜ 月咨询：${n(b.monthlyLeadCount)} ｜ 月成交：${n(b.monthlyConversionCount)}`);
    lines.push(`客单价：${n(b.averageOrderValue)} ｜ 复购率：${n(b.repeatCustomerRate)} ｜ 粉丝：${n(b.followerCount)} ｜ 评论：${n(b.reviewCount)} ｜ 评分：${n(b.averageRating)}`);
    lines.push(`数据来源：${track("基线数据来源", b.sourceNote)} ｜ 可信度：${b.dataConfidence}`);
  } else {
    lines.push("（整块待补充——基线未填写；没有基线不要声称增长）");
    missing.push("基线数据（整块）");
  }

  lines.push("");
  lines.push("【履约与组织能力】");
  if (oc) {
    lines.push(`谁接咨询：${track("响应流程", oc.responseProcessSummary)} ｜ 响应时效：${track("响应时效", oc.responseTimeSummary)}`);
    lines.push(`产能上限：${track("产能上限", oc.serviceCapacitySummary)} ｜ 高峰应对：${track("高峰应对", oc.peakHourHandlingSummary)}`);
    lines.push(`履约风险：${v(oc.fulfillmentRiskSummary)} ｜ 体验风险：${v(oc.customerExperienceRiskSummary)}`);
    lines.push(`老板是否单点：${track("老板依赖", oc.ownerDependencySummary)} ｜ 人员分工：${v(oc.staffRoleSummary)} ｜ 组织风险：${v(oc.organizationRiskSummary)}`);
  } else {
    lines.push("（整块待补充——履约与组织能力未采集；这决定能否承接增长）");
    missing.push("履约与组织能力（整块）");
  }

  // 链路状态 + 五器官（复用现有只读 helper）
  const ws = buildMerchantWorkspace(m);
  lines.push("");
  lines.push("【节点链路状态】");
  lines.push(ws.nodes.map((node) => `${node.label}: ${node.status}`).join(" ｜ "));
  if (ws.firstMissing) lines.push(`第一个未创建节点：${ws.firstMissing.label}`);

  const ohs = buildOperatingHealthSnapshot(m);
  lines.push("");
  lines.push("【五器官经营健康观察（规则信号，非结论）】");
  for (const o of ohs.organs) {
    lines.push(`${o.label}: ${o.status} —— ${o.observation}`);
    if (o.gaps.length) missing.push(...o.gaps.map((g) => `${o.label}：${g}`));
  }

  if (missing.length) {
    lines.push("");
    lines.push("【明确缺失信息（待补充，不得编造）】");
    missing.forEach((x) => lines.push(`- ${x}`));
  }

  return { text: lines.join("\n"), missing, isDemo, isUat };
}
