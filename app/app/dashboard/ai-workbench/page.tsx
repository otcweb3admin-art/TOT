import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listMerchants, getMerchantById } from "@/lib/merchants/data";
import { AI_TASKS, getAiTask } from "@/lib/ai-workbench/tasks";
import { buildAiMerchantContext } from "@/lib/ai-workbench/context";
import { buildAiPrompt } from "@/lib/ai-workbench/prompts";
import { buildMerchantWorkspace } from "@/lib/merchants/workspace";
import { CopyPromptButton } from "@/components/ai-workbench/copy-prompt-button";
import { ManualResultCapture } from "@/components/ai-workbench/manual-result-capture";
import {
  isDemoMerchant,
  DemoDataBadge,
} from "@/components/merchants/demo-data-badge";
import { formatDateTime } from "@/components/merchants/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { btnPrimary, btnSecondary, btnSecondarySm } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const FLOW = [
  "选择商家",
  "选择 AI 任务",
  "复制 Prompt",
  "到 AI 工具生成草稿",
  "把结果粘贴回来",
  "人工审核",
  "去对应节点保存",
];

/**
 * AI Workbench V0 — manual-assist prompt flow (TASK-065). NO AI API is called and NOTHING
 * is auto-saved: the system only assembles the merchant context (permission-filtered) into
 * a copy-paste prompt; the human runs it in their own AI tool, pastes the draft back,
 * reviews it, then saves manually on the existing node edit page (existing role-access
 * guards apply). Selection is URL-driven: ?merchantId=...&task=...
 */
export default async function AiWorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{ merchantId?: string; task?: string }>;
}) {
  const user = await requireUser();
  const { merchantId, task: taskKey } = await searchParams;

  const merchants = await listMerchants(user); // permission-filtered, newest first
  const recent = merchants.slice(0, 8);
  const task = getAiTask(taskKey);

  // Selected merchant: permission-filtered load; null covers both missing and no-access
  // (no existence leak).
  const selected = merchantId ? await getMerchantById(merchantId, user) : null;
  const selectedMissing = Boolean(merchantId) && !selected;

  const qs = (mId?: string, tKey?: string) => {
    const p = new URLSearchParams();
    if (mId) p.set("merchantId", mId);
    if (tKey) p.set("task", tKey);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const ctx = selected ? buildAiMerchantContext(selected) : null;
  const ws = selected ? buildMerchantWorkspace(selected) : null;
  const prompt = selected && task && ctx ? buildAiPrompt(task, ctx) : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
      <PageHeader
        title="AI 工作台"
        status="人工辅助模式 V0"
        description={`不自动调用 AI API、不自动保存结果。流程：${FLOW.join(" → ")}。`}
        actions={
          <Link href="/dashboard" className={btnSecondary}>
            ← 首页
          </Link>
        }
      />

      <section className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
        <p className="font-medium">AI 边界（必读）</p>
        <p className="mt-0.5">
          AI 输出不是事实、不是最终结论、不能直接保存——必须人工审核，没有证据的内容标「待验证」。
          AI 不替代商业决策、不承诺增长结果、不得把 DEMO 当真实案例。最终保存由你人工完成，且仍受角色权限限制。
        </p>
      </section>

      {/* ① 选择商家 */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">① 选择商家</h2>
        {selectedMissing && (
          <p className="mt-2 rounded bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            商家不存在或无权访问，请从下面选择一个你可访问的商家。
          </p>
        )}
        {recent.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              title="还没有可选商家"
              hints={[
                "AI 草稿需要先有商家资料：请先到「商家接入向导」创建并录入商家，或运行 npm run seed:demo 生成 DEMO 学习。",
              ]}
              actions={
                <Link href="/dashboard/merchants/intake" className={btnPrimary}>
                  进入商家接入向导
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-2 flex flex-col">
            {recent.map((m) => {
              const isSelected = selected?.id === m.id;
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={isSelected ? "font-semibold" : "font-medium"}>
                      {m.name}
                    </span>
                    {isDemoMerchant(m.name) && <DemoDataBadge variant="compact" />}
                    <span className="text-[11px] text-zinc-400">
                      创建于 {formatDateTime(m.createdAt)}
                    </span>
                    {isSelected && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        已选中
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/ai-workbench${qs(m.id, task?.key)}`}
                    className={btnSecondarySm}
                  >
                    {isSelected ? "重新载入" : "选择此商家"}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {selected && ctx?.isDemo && (
          <p className="mt-2 rounded bg-rose-50 px-3 py-2 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            当前选择的是 DEMO 演示数据：仅用于演示 / 培训，不得当真实案例，不得用于承诺增长。
          </p>
        )}
      </section>

      {/* ② 选择 AI 任务 */}
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-500">② 选择 AI 任务</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AI_TASKS.map((t) => {
            const isActive = task?.key === t.key;
            return (
              <Link
                key={t.key}
                href={`/dashboard/ai-workbench${qs(selected?.id, t.key)}`}
                className={`rounded-lg border p-3 text-xs transition-colors ${
                  isActive
                    ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-900"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <span className="mt-0.5 block text-zinc-500">→ {t.nodeLabel}</span>
              </Link>
            );
          })}
        </div>
        {task?.warning && (
          <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            ⚠ {task.warning}
          </p>
        )}
      </section>

      {/* 已选商家上下文 + Prompt */}
      {selected && ctx && ws && (
        <>
          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-zinc-500">
                ③ 系统整理的商家上下文：{selected.name}
              </h2>
              <span className="text-[11px] text-zinc-400">
                链路 {ws.completedCount}/{ws.totalCount} 节点已创建 · 缺失信息{" "}
                {ctx.missing.length} 项（已标待补充）
              </span>
            </div>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {ctx.text}
            </pre>
            <p className="mt-1 text-[11px] text-zinc-400">
              空字段已写「待补充」——不会被美化成已知事实。资料不全时建议先回
              <Link
                href="/dashboard/merchants/intake"
                className="underline underline-offset-2"
              >
                接入向导
              </Link>
              补录。
            </p>
          </section>

          {task && prompt ? (
            <>
              <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-zinc-500">
                    ④ 生成的 Prompt：{task.label}（复制到你使用的 AI 工具）
                  </h2>
                  <CopyPromptButton text={prompt} />
                </div>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {prompt}
                </pre>
              </section>

              <ManualResultCapture
                nodeHref={`/dashboard/merchants/${selected.id}/${task.nodeSegment}`}
                nodeLabel={task.nodeLabel}
              />
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              ↑ 在上面「② 选择 AI 任务」中选一个任务类型，即可生成 Prompt。
            </p>
          )}
        </>
      )}
      {!selected && !selectedMissing && recent.length > 0 && (
        <p className="text-sm text-zinc-500">↑ 先在「① 选择商家」中选择一个商家。</p>
      )}
    </main>
  );
}
