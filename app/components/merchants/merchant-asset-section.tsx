import Link from "next/link";
import { type ReactNode } from "react";

/**
 * One merchant-detail asset section: a bordered card with a header (title + create/edit
 * link) and, when the asset exists, its summary (`children`); otherwise an empty-state
 * note. Centralizes the section/header/empty-state markup that was previously duplicated
 * ~10× inline in the merchant detail page (TASK-039 refactor — behavior preserved).
 */
export function MerchantAssetSection({
  title,
  href,
  exists,
  editLabel,
  createLabel,
  emptyText,
  children,
}: {
  title: string;
  href: string;
  exists: boolean;
  editLabel: string;
  createLabel: string;
  emptyText: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
        <Link
          href={href}
          className="rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
        >
          {exists ? editLabel : createLabel}
        </Link>
      </div>
      {exists ? children : <p className="text-sm text-zinc-500">{emptyText}</p>}
    </section>
  );
}
