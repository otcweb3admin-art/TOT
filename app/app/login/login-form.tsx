"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        邮箱
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        密码
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
