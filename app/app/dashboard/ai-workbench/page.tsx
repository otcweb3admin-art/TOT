import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";

const AI_TASKS = [
  "生成诊断草稿（TB-001 商家诊断）",
  "生成内容方向草稿（TB-004 内容运营）",
  "生成账号搭建建议（TB-002 账号搭建）",
  "生成素材采集建议（TB-003 素材采集）",
  "生成复盘分析草稿（TB-007 数据复盘）",
  "生成 90 天计划草稿（TB-008 90 天增长计划）",
];

const NEXT_PHASE_STEPS = [
  "选择商家",
  "选择 AI 任务类型",
  "生成 Prompt（自动带上该商家已录入的资料）",
  "人工审核 AI 输出",
  "确认后保存到对应节点",
];

/**
 * AI Workbench V0 placeholder (TASK-063): gives AI a clear PRODUCT ENTRY without wiring any
 * real AI API. Copy stresses: AI never decides, never writes nodes directly, output must be
 * human-reviewed. Current mode = manual assist (copy merchant data to an AI, review, then
 * type the approved result into the node yourself).
 */
export default async function AiWorkbenchPage() {
  await requireUser();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">AI 工作台</h1>
          <p className="text-sm text-zinc-500">
            当前状态：<span className="font-medium">V0 占位 · 人工辅助模式</span>（未接入自动调用）
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          ← 首页
        </Link>
      </header>

      <section className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        <p className="font-medium">AI 使用边界（必读）</p>
        <ul className="mt-1 list-disc pl-4 [&>li]:mt-0.5">
          <li>AI 不自动决策 — 是否采用 AI 建议由人判断。</li>
          <li>AI 不直接写入业务节点 — 系统已在权限层阻止 ai_worker 写入。</li>
          <li>AI 结果必须人工审核 — 审核通过后由人录入对应节点。</li>
          <li>AI 输出是草稿 / 假设，不是事实，不得当作证据或结论。</li>
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">AI 能帮什么（草稿辅助）</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 [&>li]:mt-1">
          {AI_TASKS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">现在怎么用（人工辅助流程）</h2>
        <ol className="mt-2 list-decimal pl-5 text-sm text-zinc-600 dark:text-zinc-400 [&>li]:mt-1">
          <li>打开商家工作台，复制该商家已录入的资料（画像 / 基准 / 承接能力等）。</li>
          <li>把资料粘贴给你使用的 AI 工具，请它生成上面某类草稿。</li>
          <li>人工审核草稿：删掉编造内容，缺证据的标「待验证」。</li>
          <li>把审核后的结果，手动录入到对应节点并保存。</li>
        </ol>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-medium text-zinc-500">下一阶段规划（本期未实现）</h2>
        <ol className="mt-2 list-decimal pl-5 text-xs text-zinc-500 [&>li]:mt-0.5">
          {NEXT_PHASE_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-zinc-400">
          届时仍保持同一原则：AI 生成草稿 → 人工审核 → 人确认保存。AI 永远不替人做商业决策。
        </p>
      </section>
    </main>
  );
}
