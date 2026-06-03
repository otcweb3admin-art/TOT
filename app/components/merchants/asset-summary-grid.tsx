import { Fragment, type ReactNode } from "react";

export type SummaryRow = { label: string; value: ReactNode };

/**
 * Label/value summary grid for the merchant detail sections.
 *
 * Renders markup IDENTICAL to the prior inline `<dl>` + `row()` used across the merchant
 * detail page (TASK-039 presentation refactor — behavior/output preserved). Empty / null
 * values render as "—", matching the previous `{value || "—"}` behavior.
 */
export function AssetSummaryGrid({ rows }: { rows: SummaryRow[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map((r, i) => (
        <Fragment key={i}>
          <dt className="text-zinc-500">{r.label}</dt>
          <dd>{r.value || "—"}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
