import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CurrentUser = {
  id: string; // Supabase auth user id
  profileId: string; // UserProfile.id — use for owner / createdBy FKs (NOT the auth id)
  email: string;
  role: Role;
  status: UserStatus;
};

/**
 * Data Access Layer — single source of truth for "who is the current user".
 *
 * Returns the authenticated user + their role/status, or null if not logged in
 * (or Supabase not yet configured). Memoized per request via React cache().
 * Just-in-time provisions a UserProfile row on first login (role/status defaults
 * come from the Prisma schema). Role management UI is a later phase.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profile = await prisma.userProfile.findUnique({
    where: { authUserId: user.id },
  });
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { authUserId: user.id, email: user.email ?? "" },
    });
  }

  return {
    id: user.id,
    profileId: profile.id,
    email: profile.email || user.email || "",
    role: profile.role,
    status: profile.status,
  };
});

/** Redirects to /login when there is no authenticated user. Use in protected pages. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
