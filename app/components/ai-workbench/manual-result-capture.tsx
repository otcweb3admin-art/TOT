"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Manual AI-result capture & review area (TASK-065, Plan A — jump-to-node save).
 * The user pastes the AI output here, reviews it locally (client state only — NOTHING is
 * saved automatically), then copies the reviewed draft and jumps to the target node edit
 * page to paste & save manually. Save stays behind the existing role-access guards.
 */
export function ManualResultCapture({
  nodeHref,
  nodeLabel,
}: {
  nodeHref: string;
  nodeLabel: string;
}) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

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
        <li>粘贴后必须人工审核：删除编造内容，标记「待验证」信息。</li>
        <li>补充证据来源；没有依据的判断不要保留为事实。</li>
        <li>不要直接保存未审查内容。</li>
      </ul>
      <textarea
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
        <Link
          href={nodeHref}
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
        >
          去「{nodeLabel}」编辑页保存 →
        </Link>
        <span className="text-[11px] text-zinc-400">
          保存仍受角色权限限制；本页不会自动保存任何内容。
        </span>
      </div>
    </section>
  );
}
