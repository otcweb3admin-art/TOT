import type { Role } from "@prisma/client";

// ===== Role home / workspace mapping (TASK-070, Phase 1 of the workflow blueprint) =====
// Pure data: maps each REAL Role enum value to its workspace identity, duties, boundaries
// and next-step hint. Display/routing only — permission enforcement stays in role-access
// (TASK-056) and merchant-level visibility (TASK-040); nothing here grants or removes
// access. Short-term mapping per account-role-workflow-system-design-v1 Plan A:
//   merchant=客户 · collector=采集员 · operator=人工审核 · executor=外包/执行 ·
//   admin=平台管理 · ai_worker=AI 能力标识（不开放真人工作台）.

export type RoleHome = {
  workspaceName: string; // 工作台名称
  description: string; // 一句话说明
  humanWorkspace: boolean; // false = 不作为真人工作账号（ai_worker）
  duties: string[]; // 我负责什么
  boundaries: string[]; // 不能做什么 / 边界
  nextHint: string; // 下一步建议（规则提示，非决策）
};

export const ROLE_HOME: Record<Role, RoleHome> = {
  merchant: {
    workspaceName: "客户工作台",
    description: "查看项目进度、待配合事项和待确认内容。",
    humanWorkspace: true,
    duties: ["查看项目进度", "补充我们请求的资料", "确认待确认内容", "对成果提出反馈"],
    boundaries: [
      "不修改内部诊断 / 运营方案 / 审核结果",
      "不查看内部任务、外包信息与内部 AI 草稿",
      "试点阶段为共同验证，不承诺具体增长数字",
    ],
    nextHint: "查看「待配合事项」与「待确认内容」；有疑问联系负责人。",
  },
  collector: {
    workspaceName: "采集员工作台",
    description: "新建商家、采集基础资料、提交原始采集包。",
    humanWorkspace: true,
    duties: ["新建商家并填写基础信息", "采集 画像 / 基线 / 履约组织能力", "标记证据来源与待补充", "提交原始采集包给审核"],
    boundaries: [
      "不做最终诊断",
      "不承诺增长结果",
      "不分配外包任务",
      "不把口述数据当事实（标「口述/估计」）",
      "不编数据——不知道写「待补充」",
    ],
    nextHint: "从「商家接入向导」按 6 步采集录入；先用 Field Pack 线下采集再进系统。",
  },
  operator: {
    workspaceName: "人工审核工作台",
    description: "审核采集资料、使用 AI 草稿、推进下一阶段。",
    humanWorkspace: true,
    duties: ["审核采集员提交的资料（证据完整性）", "用 AI 生成草稿并人工修改", "审核外包成果 / 提交客户确认", "推进商家节点与交接"],
    boundaries: [
      "AI 只是草稿——必须人工确认后才保存",
      "没有证据不通过（缺证据标待验证）",
      "received 不等于 approved（交接≠审批）",
      "不承诺增长结果",
      "不绕过证据纪律",
    ],
    nextHint: "通过 商家列表 / 工作台 / AI 工作台 推进；正式审核队列将在 Task 模型上线后启用。",
  },
  executor: {
    workspaceName: "外包 / 执行工作台",
    description: "查看分配任务、理解要求、提交成果等待审核。",
    humanWorkspace: true,
    duties: ["查看分配给自己的任务", "按任务要求与验收标准执行", "提交成果等待审核", "按退回意见修改重交"],
    boundaries: [
      "不查看完整客户经营数据",
      "不查看内部诊断与审核结论",
      "不查看其它外包任务",
      "不直接联系客户（除非被授权）",
      "不修改商家核心节点结论",
    ],
    nextHint: "正式外包任务模型尚未启用；启用后此处只显示分配给你的任务、要求与验收标准。",
  },
  admin: {
    workspaceName: "平台管理工作台",
    description: "查看全局状态、账号角色、系统边界和异常。",
    humanWorkspace: true,
    duties: ["管理账号与角色分配", "查看全局商家 / 任务 / 交接", "维护 DEMO / UAT / 真实数据边界", "处理权限问题与异常"],
    boundaries: [
      "Admin 是平台管理，不是日常运营账号",
      "不应多人共享同一个 admin",
      "不替代审核员做日常审核",
      "不让 AI / 系统替代商业决策",
    ],
    nextHint: "用「上线前检查」核对系统状态；账号与角色变更按内部账号指南人工执行。",
  },
  ai_worker: {
    workspaceName: "AI 能力说明",
    description: "AI 是系统能力标识，不作为真人工作账号。",
    humanWorkspace: false,
    duties: ["（系统能力标识）AI 草稿能力由审核员在 AI 工作台调用"],
    boundaries: [
      "本账号不用于人工操作",
      "AI 不直接写入业务节点（权限层已阻止）",
      "AI 输出必须人工审核",
      "如你是真人登录到此账号，请联系管理员配置正确角色",
    ],
    nextHint: "请联系管理员为你的账号配置正确角色。",
  },
};

export function getRoleHome(role: Role): RoleHome {
  return ROLE_HOME[role];
}
