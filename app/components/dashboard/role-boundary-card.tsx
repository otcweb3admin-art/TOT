/**
 * Role boundary card (TASK-070): a clear "what this role must NOT do" block on each role
 * workspace. Display only — real enforcement lives in role-access / merchant visibility.
 */
export function RoleBoundaryCard({
  title = "边界提示（不能做什么）",
  items,
}: {
  title?: string;
  items: string[];
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <h2 className="text-sm font-medium text-amber-800 dark:text-amber-300">{title}</h2>
      <ul className="mt-2 list-disc pl-5 text-xs text-amber-800/90 dark:text-amber-300/90 [&>li]:mt-0.5">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </section>
  );
}
