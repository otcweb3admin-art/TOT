import type { MerchantStageNode, Prisma } from "@prisma/client";
import { AI_TASKS, type AiTask, type AiTaskKey } from "@/lib/ai-workbench/tasks";

// ===== AI Draft -> ai_draft_review WorkItem builder (TASK-072) =====
// Pure data + builder (no "server-only" so the smoke script can import it). Maps each AI
// workbench task to its MerchantStageNode target and assembles the WorkItem payload the
// submit action persists. REUSES WorkItem — no AIDraft model. The draft enters the HUMAN
// review queue as status=submitted; approval never auto-saves to a business node.

/** AI workbench task -> target MerchantStageNode (the node the reviewed draft belongs to). */
export const AI_TASK_TARGET_NODE: Record<AiTaskKey, MerchantStageNode> = {
  diagnosis: "diagnosis",
  account_setup: "account_setup",
  materials: "material_collection",
  content_operation: "content_operation",
  lead_conversion: "lead_conversion",
  data_review: "data_review",
  growth_plan: "growth_plan",
};

/** Reverse lookup: which AI task produced a draft for this target node (detail page links). */
export function aiTaskForTargetNode(node: MerchantStageNode | null): AiTask | null {
  if (!node) return null;
  const key = (Object.keys(AI_TASK_TARGET_NODE) as AiTaskKey[]).find(
    (k) => AI_TASK_TARGET_NODE[k] === node,
  );
  return key ? (AI_TASKS.find((t) => t.key === key) ?? null) : null;
}

/** 审核任务的固定要求文案（证据纪律 / 不承诺增长 / 人工保存）。 */
export const AI_DRAFT_REVIEW_REQUIREMENTS = [
  "AI 输出不是事实：逐条人工核对，删除编造数据。",
  "没有证据支撑的内容必须标「待验证」，不得保留为事实。",
  "不得包含承诺增长结果的表述。",
  "审核通过后系统不会自动写入业务节点——仍需人工到目标节点编辑页保存。",
].join("\n");

export function buildAiDraftReviewWorkItemData(args: {
  task: AiTask;
  merchantId: string;
  merchantName: string;
  aiOutput: string;
  createdByProfileId: string;
  /** 当前用户是 operator 时为其 profileId，否则 null（由任意 operator 认领审核）。 */
  reviewerProfileId: string | null;
}): Prisma.WorkItemUncheckedCreateInput {
  const { task } = args;
  return {
    type: "ai_draft_review",
    status: "submitted",
    priority: "normal",
    merchantId: args.merchantId,
    sourceNode: "workspace", // 上下文由商家工作台全链组装而来
    targetNode: AI_TASK_TARGET_NODE[task.key],
    title: `审核 AI 草稿：${task.label} - ${args.merchantName}`,
    description: `AI 任务类型：${task.label}（${task.key}）→ 目标节点：${task.nodeLabel}。${task.purpose}`,
    requirements: AI_DRAFT_REVIEW_REQUIREMENTS,
    acceptanceCriteria: `按任务输出结构逐项检查（${task.outputStructure.join(" / ")}）；事实有依据、缺口标「待补充」、无编造数据、无增长承诺，才可通过。`,
    resultSummary: args.aiOutput,
    requiresAi: true,
    requiresOutsource: false,
    requiresClientConfirmation: false,
    assignedRole: "operator",
    createdByProfileId: args.createdByProfileId,
    reviewerProfileId: args.reviewerProfileId,
    submittedAt: new Date(),
  };
}
