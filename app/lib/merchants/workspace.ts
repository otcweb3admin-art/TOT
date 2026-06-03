import type { getMerchantById } from "@/lib/merchants/data";

// ===== P2 Merchant Workspace / Node Overview (TASK-041) =====
// READ-ONLY data shaping ONLY. No DB queries here — operate on the already-included
// merchant from getMerchantById(id, user). No new model, no business logic, no AI: the
// "next step" is a deterministic RULE hint (first missing node), NOT a decision.

/** The fully-included merchant shape returned by getMerchantById. */
type MerchantFull = NonNullable<Awaited<ReturnType<typeof getMerchantById>>>;

export type NodeStatus = "missing" | "draft" | "completed" | "archived";

export type WorkspaceNode = {
  key: string;
  label: string;
  href: string; // the node's create/edit page (existing URL — unchanged behavior)
  status: NodeStatus;
  exists: boolean;
  hint: string; // short purpose description
  updatedAt: Date | null;
  /** null = this node has no upstream concept (Profile/Baseline); else whether any upstream id is recorded. */
  upstreamReferenced: boolean | null;
  actionLabel: string; // "创建" when missing, else "进入编辑"
};

/**
 * Derive a node's overview status from its asset:
 *   - absent            -> "missing"
 *   - has a status enum -> that lifecycle status (draft/completed/archived)
 *   - present, no enum  -> "completed" (Profile/Baseline carry no lifecycle status)
 */
export function getNodeStatus(
  asset: { status?: string } | null | undefined,
): NodeStatus {
  if (!asset) return "missing";
  if (typeof asset.status === "string") return asset.status as NodeStatus;
  return "completed";
}

/** First node (in chain order) that has not been created yet, or null when all exist. */
export function getFirstMissingNode(
  nodes: WorkspaceNode[],
): WorkspaceNode | null {
  return nodes.find((n) => n.status === "missing") ?? null;
}

type NextStep = { title: string; detail: string };

/**
 * RULE hint (not a decision): point at the first missing node, or note chain completeness.
 * Wording intentionally avoids "系统决定" — it is "建议优先补齐 / 可考虑下一步 / 不代表业务决策".
 */
function buildNextStep(firstMissing: WorkspaceNode | null): NextStep {
  if (firstMissing) {
    return {
      title: `建议优先补齐：${firstMissing.label}`,
      detail: `按资产链路顺序，第一个尚未创建的节点是「${firstMissing.label}」。可考虑下一步先补齐它，再继续后续节点。这是基于链路顺序的规则提示，不代表业务决策。`,
    };
  }
  return {
    title: "最小链路已完整",
    detail:
      "Profile / Baseline / TB-001~TB-008 均已创建。可考虑下一步：数据复盘迭代 / MVS 验证 / 真实试点准备。这是规则提示，不代表业务决策。",
  };
}

/**
 * Build the read-only workspace view model for a merchant: the full Profile → Baseline →
 * TB-001~TB-008 chain (status / quick-entry / updatedAt / upstream-presence) plus the
 * first-missing node and a rule-based next-step hint.
 */
export function buildMerchantWorkspace(m: MerchantFull) {
  const base = `/dashboard/merchants/${m.id}`;
  const make = (
    key: string,
    label: string,
    seg: string,
    hint: string,
    asset: { status?: string; updatedAt?: Date } | null | undefined,
    upstreamReferenced: boolean | null,
  ): WorkspaceNode => {
    const status = getNodeStatus(asset);
    return {
      key,
      label,
      href: `${base}/${seg}`,
      status,
      exists: status !== "missing",
      hint,
      updatedAt: asset?.updatedAt ?? null,
      upstreamReferenced,
      actionLabel: status === "missing" ? "创建" : "进入编辑",
    };
  };

  const nodes: WorkspaceNode[] = [
    make("profile", "商家画像 (Profile)", "profile", "摘要级商家画像，为诊断 / 策略提供输入。", m.profile, null),
    make("baseline", "增长前基准 (Baseline)", "baseline", "增长前的对照基线数据。", m.baseline, null),
    make(
      "diagnosis",
      "TB-001 商家诊断",
      "diagnosis",
      "最小人工诊断摘要。",
      m.diagnosis,
      m.diagnosis ? Boolean(m.diagnosis.sourceProfileId || m.diagnosis.sourceBaselineMetricId) : null,
    ),
    make(
      "accountSetup",
      "TB-002 账号搭建",
      "account-setup",
      "平台账号搭建方案。",
      m.accountSetup,
      m.accountSetup ? Boolean(m.accountSetup.sourceDiagnosisId) : null,
    ),
    make(
      "materialCollection",
      "TB-003 素材采集",
      "materials",
      "素材采集规划。",
      m.materialCollection,
      m.materialCollection ? Boolean(m.materialCollection.sourceAccountSetupId) : null,
    ),
    make(
      "contentOperation",
      "TB-004 内容运营",
      "content-operation",
      "内容运营方案。",
      m.contentOperation,
      m.contentOperation ? Boolean(m.contentOperation.sourceMaterialCollectionId) : null,
    ),
    make(
      "livePlanning",
      "TB-005 直播规划",
      "live-planning",
      "直播规划方案。",
      m.livePlanning,
      m.livePlanning ? Boolean(m.livePlanning.sourceContentOperationId) : null,
    ),
    make(
      "leadConversion",
      "TB-006 引流转化",
      "lead-conversion",
      "引流与转化路径。",
      m.leadConversion,
      m.leadConversion
        ? Boolean(m.leadConversion.sourceContentOperationId || m.leadConversion.sourceLivePlanningId)
        : null,
    ),
    make(
      "dataReview",
      "TB-007 数据复盘",
      "data-review",
      "周期数据复盘。",
      m.dataReview,
      m.dataReview
        ? Boolean(
            m.dataReview.sourceBaselineMetricId ||
              m.dataReview.sourceContentOperationId ||
              m.dataReview.sourceLivePlanningId ||
              m.dataReview.sourceLeadConversionId,
          )
        : null,
    ),
    make(
      "ninetyDayGrowthPlan",
      "TB-008 90天增长计划",
      "growth-plan",
      "90 天增长计划。",
      m.ninetyDayGrowthPlan,
      m.ninetyDayGrowthPlan
        ? Boolean(
            m.ninetyDayGrowthPlan.sourceBaselineMetricId ||
              m.ninetyDayGrowthPlan.sourceDiagnosisId ||
              m.ninetyDayGrowthPlan.sourceLeadConversionId ||
              m.ninetyDayGrowthPlan.sourceDataReviewId,
          )
        : null,
    ),
  ];

  const firstMissing = getFirstMissingNode(nodes);
  const completedCount = nodes.filter((n) => n.status !== "missing").length;

  return {
    merchant: m,
    nodes,
    firstMissing,
    completedCount,
    totalCount: nodes.length,
    nextStep: buildNextStep(firstMissing),
  };
}
