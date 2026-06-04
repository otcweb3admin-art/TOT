// DEMO-data safety badge (TASK-051). PRESENTATION ONLY — flags seed/demo merchants so
// internal users never mistake them for real merchants / real cases. NOT used for
// permission or query logic. DEMO rule is name-based only (see seed-demo-merchant.ts).

/** A merchant is DEMO data iff its name starts with "DEMO_". Display-only — never gate on this. */
export function isDemoMerchant(name: string): boolean {
  return name.startsWith("DEMO_");
}

/**
 * compact: a small pill for the list page.
 * full: a prominent notice for the detail / workspace pages.
 */
export function DemoDataBadge({ variant = "full" }: { variant?: "compact" | "full" }) {
  if (variant === "compact") {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
        DEMO 数据
      </span>
    );
  }
  return (
    <section className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
      <p className="font-medium">⚠ DEMO 演示数据 · 仅用于演示 / 培训</p>
      <p className="mt-0.5">
        这是 DEMO 演示数据，仅用于内部演示和培训，不代表真实商家，不得用于 MVS、ROI、归因、经验库或真实案例。
      </p>
    </section>
  );
}
