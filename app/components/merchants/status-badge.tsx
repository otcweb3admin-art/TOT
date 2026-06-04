// Unified status pill for Merchant + asset statuses (lead/active/paused/archived and
// draft/completed/archived). PRESENTATION-ONLY (TASK-039 refactor): the status value and
// its meaning are unchanged — only the rendering is unified into a consistent pill.
const STATUS_STYLES: Record<string, string> = {
  // P2-013: workspace node-overview pseudo-status (asset not yet created).
  missing: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  // P2-015: operating-health organ pseudo-statuses (read-only signals).
  signal:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  attention: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  unknown: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  // P2-022: stage-handoff statuses (record-only; not approval/transition).
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  received:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  archived: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300",
  lead: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  paused: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

const FALLBACK = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? FALLBACK
      }`}
    >
      {status}
    </span>
  );
}
