import type { ReactNode } from "react";

/**
 * Unified page header (TASK-066): title + one-line description + optional status chip +
 * actions slot. Keeps every main page telling the user WHERE they are and WHAT the main
 * actions are. Presentation only.
 */
export function PageHeader({
  title,
  description,
  status,
  actions,
}: {
  title: string;
  description?: ReactNode;
  status?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {status && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {status}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
