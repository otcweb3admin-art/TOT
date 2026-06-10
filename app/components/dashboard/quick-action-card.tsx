import Link from "next/link";

/**
 * One quick-action entry card on the dashboard home (TASK-063). Presentation only.
 */
export function QuickActionCard({
  href,
  title,
  description,
  hint,
}: {
  href: string;
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
    >
      <span className="font-medium">{title}</span>
      <span className="text-xs text-zinc-500">{description}</span>
      {hint && <span className="text-[11px] text-amber-700 dark:text-amber-400">{hint}</span>}
    </Link>
  );
}
