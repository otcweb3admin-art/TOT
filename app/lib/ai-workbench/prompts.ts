import type { AiTask } from "@/lib/ai-workbench/tasks";
import type { AiMerchantContext } from "@/lib/ai-workbench/context";

// ===== AI Workbench prompt builder (TASK-065) =====
// Pure string assembly: merchant context + task type -> a copy-paste prompt with hard
// safety rules. No API calls. The AI's output is a DRAFT for human review — never saved
// automatically, never a decision.

const SAFETY_RULES = [
  "你是商家线上增长运营助手。",
  "只能基于下面提供的上下文回答；上下文之外的信息一律视为未知。",
  "不确定的地方明确标注「待补充」或「待验证」。",
  "不得编造数据、案例或商家情况。",
  "不得承诺增长结果，不得承诺 ROI，不得承诺爆款或成交。",
  "输出必须区分：已知事实 / 观察判断 / 风险 / 待补充信息 / 建议动作。",
  "输出语言：中文。",
  "你的输出只是草稿，需要人工审核后才会被使用；不要写成最终结论。",
];

export function buildAiPrompt(task: AiTask, ctx: AiMerchantContext): string {
  const parts: string[] = [];

  parts.push("# 角色与规则");
  SAFETY_RULES.forEach((r, i) => parts.push(`${i + 1}. ${r}`));
  if (ctx.isDemo) {
    parts.push(
      `${SAFETY_RULES.length + 1}. 注意：本商家是 DEMO 演示数据，不是真实商家；输出仅用于演示/培训，不得当作真实案例引用。`,
    );
  }
  if (task.warning) {
    parts.push(`特别提醒：${task.warning}`);
  }

  parts.push("");
  parts.push(`# 本次任务：${task.label}（目标节点：${task.nodeLabel}）`);
  parts.push(task.purpose);

  parts.push("");
  parts.push("# 商家上下文（仅可使用以下信息）");
  parts.push(ctx.text);

  parts.push("");
  parts.push("# 输出要求");
  parts.push("严格按以下结构输出（每节一个小标题；该节没有可靠依据时写「待补充」）：");
  task.outputStructure.forEach((s, i) => parts.push(`${i + 1}. ${s}`));

  return parts.join("\n");
}
