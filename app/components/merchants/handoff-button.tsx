"use client";

import { useActionState } from "react";
import type { HandoffState } from "@/lib/merchants/handoff-actions";

type HandoffAction = (
  handoffId: string,
  prevState: HandoffState,
  formData: FormData,
) => Promise<HandoffState>;

/**
 * A single handoff action button (Phase C / TASK-057): mark-received or cancel. The Server
 * Action (passed as a prop from the server component) is bound to handoffId and run via a
 * form. Record-only — does not approve / transition / change node status.
 */
export function HandoffButton({
  handoffId,
  action,
  label,
  tone = "neutral",
}: {
  handoffId: string;
  action: HandoffAction;
  label: string;
  tone?: "neutral" | "primary";
}) {
  const bound = action.bind(null, handoffId);
  const [state, formAction, pending] = useActionState<HandoffState, FormData>(
    bound,
    undefined,
  );

  const cls =
    tone === "primary"
      ? "rounded bg-zinc-900 px-2 py-0.5 text-[11px] text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      : "rounded border border-zinc-300 px-2 py-0.5 text-[11px] disabled:opacity-50 dark:border-zinc-700";

  return (
    <form action={formAction} className="inline-block">
      <button type="submit" disabled={pending} className={cls}>
        {pending ? "处理中…" : label}
      </button>
      {state?.error ? (
        <span className="ml-1 text-[11px] text-red-600" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
