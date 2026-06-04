// Workspace stage summary (TASK-055, Phase A). READ-ONLY top-of-workspace operations line:
// owner / chain progress / current stage / organ to watch + a non-decisional disclaimer.
// Built from existing workspace + operating-health data; no new data, no business logic.

export function WorkspaceStageSummary({
  currentRoleLabel,
  ownerEmail,
  completedCount,
  totalCount,
  currentStageLabel,
  attentionOrganLabel,
}: {
  currentRoleLabel: string;
  ownerEmail?: string | null;
  completedCount: number;
  totalCount: number;
  currentStageLabel: string;
  attentionOrganLabel: string;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "当前登录角色", value: currentRoleLabel },
    { label: "当前负责人", value: ownerEmail || "—" },
    { label: "链路状态", value: `${completedCount}/${totalCount} 节点已创建` },
    { label: "当前阶段", value: currentStageLabel },
    { label: "建议关注器官", value: attentionOrganLabel },
  ];

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="text-sm font-medium text-zinc-500">阶段摘要（运营协同）</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-zinc-400">{r.label}</dt>
            <dd className="text-zinc-600 dark:text-zinc-300">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-zinc-400">
        以上为运营协同提示；
        <span className="font-medium text-zinc-500">系统提示不代表业务决策</span>
        ，放行 / 进入下一环节 / 是否放量由人确认。
      </p>
    </section>
  );
}
