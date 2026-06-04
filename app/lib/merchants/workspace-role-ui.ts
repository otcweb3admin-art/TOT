// ===== Role-Based Workspace UI · Phase A (TASK-055) =====
// READ-ONLY UI meta for the workspace node cards — implements Phase A of
// role-based-ui-and-stage-handoff-architecture-v1.md: unified DISPLAY only.
// NO Handoff/Review records, NO submit/approve flow, NO auto-transition, NO permission
// change. Role labels use ONLY the real Role enum (merchant/collector/operator/executor/
// admin/ai_worker). Copy is non-decisional ("建议由…处理 / 需人工确认 / 不代表系统决策").

/** Per-node read-only UI meta (suggested, for display). */
export type NodeRoleUI = {
  nodeCode: string; // e.g. PROFILE / BASELINE / TB-001
  ownerRoleLabel: string; // 建议负责角色（真实 enum + 业务解释）
  upstreamLabel: string; // 上游输入
  evidenceHint: string; // 证据 / 依据提示
  handoffHint: string; // 交接提示（完成后交给…）
  humanReviewHint: string; // 人工确认提示
};

const NODE_ROLE_UI: Record<string, NodeRoleUI> = {
  profile: {
    nodeCode: "PROFILE",
    ownerRoleLabel: "collector（资料采集 / 录入）",
    upstreamLabel: "Merchant",
    evidenceHint: "需商家事实（客群 / 卖点 / 获客）；不知道写待补充，不编",
    handoffHint: "完成后供 Baseline / Operating Capacity / TB-001 使用",
    humanReviewHint: "是否进入下一环节由项目负责人确认",
  },
  baseline: {
    nodeCode: "BASELINE",
    ownerRoleLabel: "collector（资料采集 / 录入）",
    upstreamLabel: "Merchant / Profile",
    evidenceHint: "需基线数据并标可信度（口述不可写 high）",
    handoffHint: "完成后供 TB-001 诊断 / 后续 MVS 对照",
    humanReviewHint: "是否进入下一环节由项目负责人确认",
  },
  diagnosis: {
    nodeCode: "TB-001",
    ownerRoleLabel: "operator · ai_worker（运营协调 / AI 辅助）",
    upstreamLabel: "Profile + Baseline + Operating Capacity",
    evidenceHint: "需上游事实；缺证据写待验证，不写确定结论",
    handoffHint: "完成后交给 TB-002 ~ TB-006 方案",
    humanReviewHint: "诊断结论需人工确认，不代表 AI / 系统决策",
  },
  accountSetup: {
    nodeCode: "TB-002",
    ownerRoleLabel: "executor · ai_worker（方案执行 / AI 辅助）",
    upstreamLabel: "TB-001 诊断",
    evidenceHint: "需上游诊断；不可无上游凭空写",
    handoffHint: "完成后交给 TB-003 素材 / TB-004 内容",
    humanReviewHint: "建议提交给项目负责人 / 审核确认",
  },
  materialCollection: {
    nodeCode: "TB-003",
    ownerRoleLabel: "collector · executor（采集 / 方案执行）",
    upstreamLabel: "TB-002 账号搭建",
    evidenceHint: "缺素材标缺口，不编",
    handoffHint: "完成后交给 TB-004 内容运营",
    humanReviewHint: "建议提交给项目负责人 / 审核确认",
  },
  contentOperation: {
    nodeCode: "TB-004",
    ownerRoleLabel: "executor · ai_worker（方案执行 / AI 辅助）",
    upstreamLabel: "TB-003 素材采集",
    evidenceHint: "需上游素材；禁区 / 频率如实",
    handoffHint: "完成后交给 TB-005 直播 / TB-006 引流",
    humanReviewHint: "建议提交给项目负责人 / 审核确认",
  },
  livePlanning: {
    nodeCode: "TB-005",
    ownerRoleLabel: "executor · ai_worker（方案执行 / AI 辅助）",
    upstreamLabel: "TB-004 内容运营",
    evidenceHint: "准备度如实，不夸大可行性",
    handoffHint: "完成后交给 TB-006 引流转化",
    humanReviewHint: "建议提交给项目负责人 / 审核确认",
  },
  leadConversion: {
    nodeCode: "TB-006",
    ownerRoleLabel: "executor · operator（方案执行 / 运营协调）",
    upstreamLabel: "TB-004 + TB-005",
    evidenceHint: "需归因方式；无归因不投流",
    handoffHint: "完成后交给 TB-007 数据复盘",
    humanReviewHint: "是否放量由项目负责人确认，不代表系统决策",
  },
  dataReview: {
    nodeCode: "TB-007",
    ownerRoleLabel: "operator · ai_worker（运营协调 / AI 辅助）",
    upstreamLabel: "Baseline + TB-004 + TB-005 + TB-006",
    evidenceHint: "需真实执行结果；无结果勿强行 completed",
    handoffHint: "完成后交给 TB-008（经验候选为后续）",
    humanReviewHint: "复盘结论仅经验候选，需人工审定",
  },
  ninetyDayGrowthPlan: {
    nodeCode: "TB-008",
    ownerRoleLabel: "operator · admin（运营协调 / 管理）",
    upstreamLabel: "Baseline + TB-001 + TB-006 + TB-007",
    evidenceHint: "需复盘依据；无依据只 draft",
    handoffHint: "完成后进入下一轮 / 执行准备",
    humanReviewHint: "进入下一轮由项目负责人确认",
  },
};

export function getNodeRoleUI(key: string): NodeRoleUI | null {
  return NODE_ROLE_UI[key] ?? null;
}

/** Non-decisional next-action label derived from the node's display status. */
export function nextActionLabel(status: string): string {
  switch (status) {
    case "missing":
      return "建议创建";
    case "draft":
      return "建议编辑 / 补证据";
    case "completed":
      return "可编辑 · 待人工确认进入下一环节";
    case "archived":
      return "已归档（只读参考）";
    default:
      return "查看";
  }
}
