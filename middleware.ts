import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware performs the cheap first-pass: if there's no session cookie at all,
// redirect to /login. Full role checking happens server-side via requireRole()
// because middleware does not have DB access on the edge runtime.

const PROTECTED_PREFIXES = [
  "/admin",
  "/org-admin",
  "/teacher",
  "/student",
  "/change-password",
  "/seerah",
  "/learn",
  "/billing",
  "/upgrade",
  "/profiles",
  // Legacy member routes kept for backwards compatibility
  "/dashboard",
  "/parts",
  "/conclusion",
];

// Routes under a protected prefix that signed-out visitors may still view.
// The course dashboard is browsable by guests: only the free preview part
// (lib/access.ts's FREE_PART_NUMBER) is free, every other part shows as
// locked and routes to /pricing. These pages check the session themselves
// (getCachedStudentOrGuest) and render a guest view when there isn't one.
// /seerah/part-15 is the one lesson page guests may open directly (free
// preview, no progress tracking); every other /seerah/part-N stays gated,
// and the content APIs enforce access independently either way.
// NOTE: keep this part number in sync with FREE_PART_NUMBER in lib/access.ts.
const PUBLIC_EXACT_PATHS = new Set(["/seerah", "/seerah/resources", "/seerah/part-15", "/learn"]);

const SESSION_COOKIE = "seerah_session";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname, search } = request.nextUrl;

  // Normalise a trailing slash so "/seerah/" can't slip past (or fall out of) the allow-list.
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const isProtected =
    !PUBLIC_EXACT_PATHS.has(normalizedPath) &&
    PROTECTED_PREFIXES.some(
      (r) => normalizedPath === r || normalizedPath.startsWith(r + "/")
    );

  // Only gate protected routes — middleware cannot verify session validity against
  // the DB (edge runtime has no DB access). If the cookie exists but the
  // session is stale, the page server-component will call getCurrentUser(),
  // get null, and redirect to /login itself. Redirecting auth routes (like
  // /login) back to /seerah when a cookie exists creates an infinite loop
  // whenever the session is invalid, so we intentionally skip that redirect.
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the full path + query so the user returns to their destination.
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Forward the current pathname as a request header so server components can
  // read it via `headers()` — used by requireAuth() to build return URLs for
  // stale-session edge cases.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (search) requestHeaders.set("x-search", search);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/org-admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/change-password",
    "/seerah",
    "/seerah/:path*",
    "/learn/:path*",
    "/billing",
    "/upgrade",
    "/profiles",
    "/dashboard/:path*",
    "/parts/:path*",
    "/conclusion/:path*",
  ],
};
