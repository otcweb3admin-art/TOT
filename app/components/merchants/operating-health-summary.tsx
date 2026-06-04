import { StatusBadge } from "@/components/merchants/status-badge";
import type {
  OperatingHealthSnapshot,
  OperatingOrgan,
} from "@/lib/merchants/operating-health";

/**
 * Read-only "five-organ operating health summary" block for the merchant workspace
 * (TASK-044). Maps EXISTING merchant data to the five organs (Channel / Offer /
 * Fulfillment / Cashflow / Organization). Presentation-only — NOT a diagnosis, score, AI
 * judgment, or business decision; next-step copy is non-decisional ("建议补充/关注/可在诊断中确认").
 */
function OrganRow({ organ }: { organ: OperatingOrgan }) {
  return (
    <li className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{organ.label}</span>
        <span className="text-xs text-zinc-400">· {organ.cart}</span>
        <StatusBadge status={organ.status} />
        {organ.weakSignalOnly && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            弱信号
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{organ.observation}</p>
      <p className="mt-0.5 text-xs text-zinc-400">
        数据来源：{organ.sources.length ? organ.sources.join("、") : "—"}
      </p>
      {organ.gaps.length > 0 && (
        <p className="mt-0.5 text-xs text-zinc-400">数据缺口：{organ.gaps.join("、")}</p>
      )}
      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
        下一步：{organ.nextStep}
      </p>
    </li>
  );
}

export function OperatingHealthSummary({
  snapshot,
}: {
  snapshot: OperatingHealthSnapshot;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-sm font-medium text-zinc-500">经营健康摘要（五器官）</h2>
      <p className="mt-0.5 text-xs text-zinc-400">
        基于现有商家资产的只读信号，不代表最终诊断或商业决策。
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        状态：signal 已有信号 · attention 有信号但缺关键项 · missing 暂无信息 · unknown 数据不足。
        {snapshot.hasCriticalAttention && snapshot.firstAttentionOrgan
          ? ` 风险提示：可优先关注「${snapshot.firstAttentionOrgan.label}」。`
          : ""}
        {` 数据缺口器官：${snapshot.missingEvidenceCount}/5。`}
      </p>
      <ul className="mt-2 flex flex-col">
        {snapshot.organs.map((organ) => (
          <OrganRow key={organ.key} organ={organ} />
        ))}
      </ul>
    </section>
  );
}
