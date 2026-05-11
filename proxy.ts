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
  // Legacy member routes kept for backwards compatibility
  "/dashboard",
  "/parts",
  "/conclusion",
];

const SESSION_COOKIE = "seerah_session";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Only gate protected routes — proxy cannot verify session validity against
  // the DB (edge runtime has no DB access). If the cookie exists but the
  // session is stale, the page server-component will call getCurrentUser(),
  // get null, and redirect to /login itself. Redirecting auth routes (like
  // /login) back to /my-courses when a cookie exists creates an infinite loop
  // whenever the session is invalid, so we intentionally skip that redirect.
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
    "/dashboard/:path*",
    "/parts/:path*",
    "/conclusion/:path*",
  ],
};
