// Supabase public configuration.
// NEXT_PUBLIC_* are inlined at build and also available in process.env on the
// server / proxy at runtime. Read them here in one place.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True only when both public Supabase env vars are set.
 * Used to degrade gracefully (no auth guard, no client construction) until the
 * operator configures the env vars — so the app does not 500 before P1 is wired up.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
