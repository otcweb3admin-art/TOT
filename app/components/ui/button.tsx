// Unified button class constants (TASK-066). Codifies the convention the app already uses
// so primary / secondary / danger stay consistent. Use on <button> or <Link> via className.
// Pure styles — no behavior, no dependency.

const BASE =
  "inline-flex items-center justify-center gap-1 rounded px-3 py-1.5 text-sm transition-colors";

export const btnPrimary = `${BASE} bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200`;

export const btnSecondary = `${BASE} border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900`;

export const btnDanger = `${BASE} border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30`;

/** Smaller variants for dense rows. */
export const btnPrimarySm = btnPrimary.replace("px-3 py-1.5 text-sm", "px-2.5 py-1 text-xs");
export const btnSecondarySm = btnSecondary.replace("px-3 py-1.5 text-sm", "px-2.5 py-1 text-xs");
