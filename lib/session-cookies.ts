import { cookies } from "next/headers";

// Deliberately NOT a "use server" module — it's imported by both plain
// Route Handlers and lib/auth.ts's server actions, and must never itself
// become a directly-callable Server Action (this sets an auth cookie for
// whatever token/role it's given, so exposing it as an RPC endpoint would be
// a critical auth bypass).

export const SESSION_COOKIE_NAME = "seerah_session";
export const ROLE_COOKIE_NAME = "seerah_role";
export const PROFILE_COOKIE_NAME = "seerah_profile";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Sets the session + role cookies with the app's single, shared set of
 * attributes. Previously this exact `{httpOnly, secure, sameSite, expires,
 * path}` block was hand-copied in lib/auth.ts, signup-student/route.ts, and
 * mobile-anonymous/route.ts — any future cookie hardening applied to one
 * copy could easily be forgotten in the others. All three now call this.
 *
 * Also clears `seerah_profile` so a new sign-in / session does not keep a
 * stale learner-profile cookie from a previously signed-in account.
 */
export async function setAuthCookies(
  sessionToken: string,
  role: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  const shared = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: expiresAt,
    path: "/",
  };
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, shared);
  cookieStore.set(ROLE_COOKIE_NAME, role, shared);
  // Expire any prior account's active profile — profile switch/actions will
  // re-set this for the new session when the user picks a learner.
  cookieStore.set(PROFILE_COOKIE_NAME, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}
