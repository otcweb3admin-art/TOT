import type { ReactNode } from "react";

export type QueueItem = {
  label: string;
  /** A live value (count / text) or a placeholder note when the backing model isn't built yet. */
  value: ReactNode;
};

/**
 * Role queue preview (TASK-070): the "今日任务 / 队列" block on a role workspace. V1 shows
 * live values where data exists and explicit placeholders ("Task 模型上线后启用") where the
 * backing model (Task / ReviewRecord / Assignment) is not built yet — never fakes a queue.
 */
export function RoleQueuePreview({
  title,
  items,
  note,
}: {
  title: string;
  items: QueueItem[];
  note?: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {items.map((it) => (
          <div key={it.label} className="contents">
            <dt className="text-zinc-500">{it.label}</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{it.value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-2 text-[11px] text-zinc-400">{note}</p>}
    </section>
  );
}
