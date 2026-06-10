// ===== AI Workbench task catalog (TASK-065) =====
// Pure data: the 7 draft-assist task types, their target node, and the OUTPUT STRUCTURE the
// prompt asks the AI to follow. No API calls, no DB. AI output is ALWAYS a draft that a
// human reviews and then saves manually via the existing node edit pages (Plan A).

export type AiTaskKey =
  | "diagnosis"
  | "account_setup"
  | "materials"
  | "content_operation"
  | "lead_conversion"
  | "data_review"
  | "growth_plan";

export type AiTask = {
  key: AiTaskKey;
  label: string; // 运营人员可读名称
  nodeLabel: string; // 目标节点（带 TB 编号 + 中文）
  nodeSegment: string; // 目标节点编辑页路由段
  purpose: string; // 这个任务帮什么
  outputStructure: string[]; // Prompt 要求的输出结构
  warning?: string; // 任务级特别提醒
};

export const AI_TASKS: AiTask[] = [
  {
    key: "diagnosis",
    label: "商家诊断草稿",
    nodeLabel: "TB-001 商家诊断",
    nodeSegment: "diagnosis",
    purpose: "基于画像 / 基线 / 履约组织能力，识别当前主要短板，输出诊断草稿。",
    outputStructure: [
      "已知事实摘要",
      "当前主要问题判断",
      "五器官观察（渠道 / 卖点 / 履约 / 现金流 / 组织）",
      "风险与缺口",
      "待补充信息",
      "建议下一步",
      "不应立即做的动作",
    ],
  },
  {
    key: "account_setup",
    label: "账号搭建建议",
    nodeLabel: "TB-002 账号搭建",
    nodeSegment: "account-setup",
    purpose: "判断商家需要哪些线上账号 / 地图 / 社媒 / 私域基础，输出账号建设建议。",
    outputStructure: [
      "已知事实摘要",
      "建议的平台与账号清单（含优先级）",
      "账号定位 / 命名 / 简介方向",
      "地图与联系入口建议",
      "风险与限制",
      "待补充信息",
    ],
  },
  {
    key: "materials",
    label: "素材采集建议",
    nodeLabel: "TB-003 素材采集",
    nodeSegment: "materials",
    purpose: "根据行业、卖点、履约情况，输出需要采集的照片 / 视频 / 评价 / 菜单 / 环境 / 人员素材清单。",
    outputStructure: [
      "已知事实摘要",
      "建议采集的素材清单（按优先级）",
      "每类素材的用途说明",
      "拍摄 / 收集注意事项",
      "风险与限制",
      "待补充信息",
    ],
  },
  {
    key: "content_operation",
    label: "内容运营方向草稿",
    nodeLabel: "TB-004 内容运营",
    nodeSegment: "content-operation",
    purpose: "输出内容主题、短视频 / 图文方向、发布节奏建议。不承诺爆款。",
    outputStructure: [
      "商家定位摘要",
      "内容主题方向",
      "适合展示的素材",
      "3-5 个内容系列",
      "发布节奏建议",
      "风险与限制",
      "待补充信息",
    ],
  },
  {
    key: "lead_conversion",
    label: "线索转化建议",
    nodeLabel: "TB-006 线索转化",
    nodeSegment: "lead-conversion",
    purpose: "输出客户咨询承接建议、响应话术方向、私域 / 电话 / WhatsApp / Zalo / 微信等承接建议。不承诺成交。",
    outputStructure: [
      "已知事实摘要",
      "客户从看到 → 咨询 → 到店/成交的路径建议",
      "咨询承接与响应话术方向",
      "私域 / 联系入口承接建议",
      "来源追踪（归因）思路",
      "风险与限制",
      "待补充信息",
    ],
  },
  {
    key: "data_review",
    label: "数据复盘草稿",
    nodeLabel: "TB-007 数据复盘",
    nodeSegment: "data-review",
    purpose: "仅在有真实执行数据时使用：对照基线，输出复盘草稿。",
    warning:
      "仅在有真实执行数据时使用本任务。没有真实数据时不可强行复盘——编出来的复盘会污染后续判断。",
    outputStructure: [
      "本期真实数据摘要（缺什么写待补充）",
      "与基线对照的变化",
      "效果观察（内容 / 承接 / 转化）",
      "问题诊断",
      "归因观察（说明可信度）",
      "风险与缺口",
      "待补充信息",
    ],
  },
  {
    key: "growth_plan",
    label: "90 天增长计划草稿",
    nodeLabel: "TB-008 90 天增长计划",
    nodeSegment: "growth-plan",
    purpose: "基于完整资料和阶段判断，输出阶段性计划草稿。不承诺增长结果。",
    outputStructure: [
      "前提条件（哪些资料 / 能力必须先就位）",
      "第 1-30 天",
      "第 31-60 天",
      "第 61-90 天",
      "所需素材和人员",
      "风险",
      "不承诺事项",
      "待补充信息",
    ],
  },
];

export function getAiTask(key: string | undefined): AiTask | null {
  return AI_TASKS.find((t) => t.key === key) ?? null;
}
