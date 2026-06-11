"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  createAiDraftReviewWorkItem,
  type SubmitAiDraftState,
} from "@/lib/ai-workbench/actions";

/**
 * Manual AI-result capture & review area (TASK-065, Plan A — jump-to-node save; TASK-072
 * adds "submit as ai_draft_review task"). The user pastes the AI output here, reviews it
 * locally (client state — NOTHING auto-saved), then either (a) copies the reviewed draft
 * and saves manually on the node edit page, or (b) submits it as a WorkItem
 * (type=ai_draft_review, status=submitted) into the task center for operator review.
 * Submitting is NOT approval and never writes a business node; save stays behind the
 * existing role-access guards.
 */
export function ManualResultCapture({
  nodeHref,
  nodeLabel,
  merchantId,
  aiTaskKey,
  canSubmitReviewTask,
  isAdmin,
}: {
  nodeHref: string;
  nodeLabel: string;
  merchantId: string;
  aiTaskKey: string;
  /** server-computed: canCreateWorkItemType(role, "ai_draft_review") — display only, action re-checks. */
  canSubmitReviewTask: boolean;
  isAdmin: boolean;
}) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<SubmitAiDraftState, FormData>(
    createAiDraftReviewWorkItem,
    undefined,
  );

  const copyReviewed = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 手动复制即可 */
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-500">
        ⑤ 把 AI 输出粘贴到这里 · 人工审核（不会自动保存）
      </h2>
      <ul className="mt-1 list-disc pl-5 text-[11px] text-amber-700 dark:text-amber-400 [&>li]:mt-0.5">
        <li>粘贴后必须人工检查：删除编造内容，标记「待验证」信息。</li>
        <li>补充证据来源；没有依据的判断不要保留为事实。</li>
        <li>不要直接保存未审查内容。</li>
      </ul>
      <form action={formAction}>
        <input type="hidden" name="merchantId" value={merchantId} />
        <input type="hidden" name="aiTaskKey" value={aiTaskKey} />
        <textarea
          name="aiOutput"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="把 AI 工具生成的草稿粘贴到这里，然后在此修改、删减、标注待验证……"
          className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyReviewed}
            disabled={text.trim() === ""}
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {copied ? "已复制 ✓" : "复制审核后的草稿"}
          </button>
          {canSubmitReviewTask && (
            <button
              type="submit"
              disabled={text.trim() === "" || pending}
              className="rounded border border-indigo-400 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 disabled:opacity-50 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              {pending ? "提交中…" : "提交为 AI 草稿审核任务"}
            </button>
          )}
          <Link
            href={nodeHref}
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
          >
            去「{nodeLabel}」编辑页保存 →
          </Link>
        </div>
        {state?.error ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
      </form>
      {canSubmitReviewTask ? (
        <p className="mt-2 text-[11px] text-zinc-400">
          「提交为 AI 草稿审核任务」会在任务中心创建一条「审核 AI
          草稿」任务（状态：待审核），由人工审核员检查后决定通过或退回。提交不代表审核通过；系统不会自动把
          AI 内容写入业务节点——审核通过后仍需人工到目标节点保存。
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
          当前角色不可提交正式 AI 草稿审核任务（由 operator / admin
          提交）；你仍可复制审核后的草稿交给审核员处理。
        </p>
      )}
      {isAdmin && canSubmitReviewTask && (
        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
          提醒：admin 是平台管理账号，非日常运营账号；日常 AI 草稿提交建议用 operator 账号。
        </p>
      )}
      <p className="mt-1 text-[11px] text-zinc-400">
        本页不调用 AI API、不自动保存任何内容；保存仍受角色权限限制。
      </p>
    </section>
  );
}
