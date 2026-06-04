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
  "/my-courses",
  "/billing",
  "/upgrade",
  "/profiles",
  // Legacy member routes kept for backwards compatibility
  "/dashboard",
  "/parts",
  "/conclusion",
];

const SESSION_COOKIE = "seerah_session";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Only gate protected routes — middleware cannot verify session validity against
  // the DB (edge runtime has no DB access). If the cookie exists but the
  // session is stale, the page server-component will call getCurrentUser(),
  // get null, and redirect to /login itself. Redirecting auth routes (like
  // /login) back to /my-courses when a cookie exists creates an infinite loop
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
    "/seerah/:path*",
    "/learn/:path*",
    "/my-courses",
    "/billing",
    "/upgrade",
    "/profiles",
    "/dashboard/:path*",
    "/parts/:path*",
    "/conclusion/:path*",
  ],
};
