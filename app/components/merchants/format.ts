// Merchant-detail presentation helpers (TASK-039 refactor — behavior preserved).

/** "YYYY-MM-DD HH:MM:SS" from a Date — matches the prior inline date formatting. */
export function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Upstream-reference label: "已引用当前<noun>" when a source id is present, else "未引用".
 *
 * NOTE(p2-chain-review-and-refactor-check-v1 §4 / §10): this is PRESENCE-based, NOT a
 * strict equality check against the current upstream id. Behavior is intentionally
 * preserved here (TASK-039 is refactor-only). A strict-equality / versioned-reference
 * variant is later-phase work — do NOT change it in a refactor pass.
 */
export function referenceLabel(
  sourceId: string | null | undefined,
  noun: string,
): string {
  return sourceId ? `已引用当前${noun}` : "未引用";
}
