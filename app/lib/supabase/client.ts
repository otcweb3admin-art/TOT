import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// Browser-side Supabase client (Client Components).
// Foundation util for later phases; P1 login/logout run server-side via Server Actions.
// Guard with isSupabaseConfigured() before calling, since this throws on empty url/key.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
