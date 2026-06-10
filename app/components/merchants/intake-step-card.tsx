import Link from "next/link";

/**
 * One step card in the merchant intake wizard (TASK-064). Unified structure: number /
 * name / what to fill / why it matters / what to do when unsure / entry button / stage
 * reminder. Presentation only — reuses existing pages & permissions, changes nothing.
 */
export function IntakeStepCard({
  index,
  title,
  fills,
  why,
  ifUnknown,
  entryHref,
  entryLabel,
  note,
}: {
  index: number;
  title: string;
  fills: string[];
  why: string;
  ifUnknown: string;
  entryHref: string;
  entryLabel: string;
  note?: string;
}) {
  return (
    <li className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
          {index}
        </span>
        <span className="font-medium">{title}</span>
      </div>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-zinc-400">这一步填什么</dt>
        <dd className="text-zinc-600 dark:text-zinc-400">{fills.join("；")}</dd>
        <dt className="text-zinc-400">为什么重要</dt>
        <dd className="text-zinc-600 dark:text-zinc-400">{why}</dd>
        <dt className="text-zinc-400">不知道怎么填</dt>
        <dd className="text-zinc-600 dark:text-zinc-400">{ifUnknown}</dd>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          href={entryHref}
          className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
        >
          {entryLabel}
        </Link>
        {note && <span className="text-[11px] text-amber-700 dark:text-amber-400">{note}</span>}
      </div>
    </li>
  );
}
