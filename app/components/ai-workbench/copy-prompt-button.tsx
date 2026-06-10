"use client";

import { useState } from "react";

/**
 * Copy-to-clipboard button (TASK-065). Uses the native clipboard API; no dependency.
 */
export function CopyPromptButton({
  text,
  label = "复制 Prompt",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
      >
        {copied ? "已复制 ✓" : label}
      </button>
      {failed && (
        <span className="text-[11px] text-red-600">复制失败，请手动全选复制</span>
      )}
    </span>
  );
}
