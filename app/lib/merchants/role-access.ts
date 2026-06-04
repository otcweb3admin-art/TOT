import type { Role, MerchantStageNode } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth/dal";
import { assertMerchantWriteAccess } from "@/lib/merchants/permissions";

// ===== Role-Based Node Write Guard · Phase B (TASK-056) =====
// Minimal NODE-LEVEL role order on top of the existing MERCHANT-level permission
// (TASK-040). Uses ONLY the real Role enum (merchant/collector/operator/executor/admin/
// ai_worker). NO new role, NO schema/migration, NO Handoff/Review, NO review flow,
// NO submit/approve/lock states. WRITE is guarded; VIEW stays permissive (gated by
// merchant-level access). Copy is non-decisional.

export type MerchantNodeKey =
  | "merchant"
  | "profile"
  | "baseline"
  | "operating_capacity"
  | "diagnosis"
  | "account_setup"
  | "material_collection"
  | "content_operation"
  | "live_planning"
  | "lead_conversion"
  | "data_review"
  | "growth_plan";

/** Which nodes each role may EDIT. admin = all. Minimal division (Phase B), not full RBAC. */
const EDITABLE: Record<Role, MerchantNodeKey[] | "all"> = {
  admin: "all", // 兜底，不代表 AI / 系统能拍板
  collector: ["merchant", "profile", "baseline", "operating_capacity", "material_collection"],
  operator: ["merchant", "operating_capacity", "diagnosis", "data_review", "growth_plan"],
  executor: ["account_setup", "material_collection", "content_operation", "live_planning", "lead_conversion"],
  ai_worker: [], // 本阶段只读，不直接写入业务节点
  merchant: [], // 未来商家门户另行设计，当前不编辑内部节点
};

const ROLE_GLOSS: Record<Role, string> = {
  merchant: "商家（未来门户）",
  collector: "资料采集 / 录入",
  operator: "运营协调 / 审核占位",
  executor: "方案 / 执行",
  admin: "管理 / 最终配置",
  ai_worker: "AI 辅助（只读）",
};

export function roleLabel(role: Role): string {
  return `${role}（${ROLE_GLOSS[role]}）`;
}

export function canEditMerchantNode(role: Role, nodeKey: MerchantNodeKey): boolean {
  const e = EDITABLE[role];
  return e === "all" || e.includes(nodeKey);
}

/** Phase B keeps VIEW permissive — viewing is gated by merchant-level access, only WRITE is role-guarded. */
export function canViewMerchantNode(role: Role, nodeKey: MerchantNodeKey): boolean {
  void role;
  void nodeKey;
  return true;
}

/** Internal roles that may edit a node (for human-readable reason text). */
function editorRolesFor(nodeKey: MerchantNodeKey): string {
  const roles = (["admin", "collector", "operator", "executor"] as Role[]).filter((r) =>
    canEditMerchantNode(r, nodeKey),
  );
  return roles.join(" / ") || "admin";
}

export type RoleNodeAccess = { canEdit: boolean; canView: boolean; reason: string };

/** Read-only access view for the workspace UI (canEdit / canView / non-decisional reason). */
export function getRoleNodeAccess(role: Role, nodeKey: MerchantNodeKey): RoleNodeAccess {
  if (canEditMerchantNode(role, nodeKey)) {
    return {
      canEdit: true,
      canView: true,
      reason: role === "admin" ? "admin 可兜底编辑此节点" : "当前角色可编辑此节点",
    };
  }
  return {
    canEdit: false,
    canView: true,
    reason: `当前角色（${role}）建议只读；此节点建议由 ${editorRolesFor(nodeKey)} 编辑，如需修改请交给对应负责角色。`,
  };
}

/**
 * Server-action node write guard: MERCHANT-level (TASK-040) FIRST, then NODE-level role.
 * Returns an error message to surface to the form, or null when allowed.
 */
export async function assertMerchantNodeWriteAccess(
  user: CurrentUser,
  merchantId: string,
  nodeKey: MerchantNodeKey,
): Promise<string | null> {
  // 1) merchant-level (exists + admin/own) — preserved from TASK-040.
  const merchantError = await assertMerchantWriteAccess(user, merchantId);
  if (merchantError) return merchantError;
  // 2) node-level role.
  if (!canEditMerchantNode(user.role, nodeKey)) {
    return `当前角色（${user.role}）无权编辑此节点；请交给对应负责角色（${editorRolesFor(nodeKey)}）。`;
  }
  return null;
}

/** Merchant creation is role-only (no merchantId yet). admin / collector / operator may create. */
export function canCreateMerchant(role: Role): boolean {
  return role === "admin" || role === "collector" || role === "operator";
}

export function assertMerchantCreateAccess(user: CurrentUser): string | null {
  return canCreateMerchant(user.role)
    ? null
    : `当前角色（${user.role}）无权创建商家；请交给 admin / collector / operator。`;
}

/** Map a workspace chain-node key (camelCase) to a MerchantNodeKey (snake_case). */
const WS_TO_NODE: Record<string, MerchantNodeKey> = {
  profile: "profile",
  baseline: "baseline",
  diagnosis: "diagnosis",
  accountSetup: "account_setup",
  materialCollection: "material_collection",
  contentOperation: "content_operation",
  livePlanning: "live_planning",
  leadConversion: "lead_conversion",
  dataReview: "data_review",
  ninetyDayGrowthPlan: "growth_plan",
};

export function nodeKeyForWorkspace(wsKey: string): MerchantNodeKey | null {
  return WS_TO_NODE[wsKey] ?? null;
}

// ===== Stage Handoff permissions (Phase C / TASK-057) — record-only, no auto-approval. =====

/** Whether `role` may SUBMIT a handoff FROM `fromNode`. ai_worker/merchant never; workspace
 *  is a coordination node (operator/admin); other nodes require node edit permission. */
export function canSubmitHandoffFrom(role: Role, fromNode: MerchantStageNode): boolean {
  if (role === "ai_worker" || role === "merchant") return false;
  if (fromNode === "workspace") return role === "operator" || role === "admin";
  return canEditMerchantNode(role, fromNode as MerchantNodeKey);
}

/** Whether `role` may RECEIVE a handoff targeted at `receivedByRole` (target role or admin). */
export function canReceiveHandoff(role: Role, receivedByRole: Role): boolean {
  return role === "admin" || role === receivedByRole;
}

/** Whether the user may CANCEL a submitted handoff (its submitter or admin). */
export function canCancelHandoff(
  user: { profileId: string; role: Role },
  submittedByProfileId: string,
): boolean {
  return user.role === "admin" || user.profileId === submittedByProfileId;
}
