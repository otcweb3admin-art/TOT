import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

// Next.js 16: Middleware is now called "Proxy". Runs in the Node.js runtime.
// Optimistic route guard + Supabase session refresh. Real authorization is also
// enforced server-side in the DAL (requireUser) — this is defense in depth.

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login"];

export async function proxy(request: NextRequest) {
  // Until Supabase is configured, don't guard (avoids 500s before env vars are set).
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  const isAuthPage = AUTH_PAGES.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Run on all routes EXCEPT: API, Next internals, the public /health check, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|health|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
