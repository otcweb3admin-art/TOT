// Lightweight read-only intake-guidance / evidence-discipline note (TASK-048). PRESENTATION
// ONLY — copy guardrails for real pilot-merchant intake; no behavior, no data, no decision.
// tone: info (neutral) · warning (caution) · evidence (evidence-discipline).

type Tone = "info" | "warning" | "evidence";

const TONE_STYLES: Record<Tone, string> = {
  info: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
  evidence:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300",
};

export function IntakeGuidanceBox({
  title,
  items,
  tone = "info",
}: {
  title: string;
  items: string[];
  tone?: Tone;
}) {
  return (
    <section className={`rounded-lg border p-3 text-xs ${TONE_STYLES[tone]}`}>
      <p className="font-medium">{title}</p>
      <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </section>
  );
}
