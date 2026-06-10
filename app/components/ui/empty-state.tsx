import type { ReactNode } from "react";

/**
 * Friendly empty state (TASK-066): what's empty, what to do next, and action buttons —
 * so an empty page never leaves the operator stranded. Presentation only.
 */
export function EmptyState({
  title,
  hints,
  actions,
}: {
  title: string;
  hints?: string[];
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</p>
      {hints?.map((h) => (
        <p key={h} className="mt-1 text-xs text-zinc-500">
          {h}
        </p>
      ))}
      {actions && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">{actions}</div>
      )}
    </section>
  );
}
