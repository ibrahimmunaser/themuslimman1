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

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
const SESSION_COOKIE = "seerah_session";
const ROLE_COOKIE    = "seerah_role";

function roleHome(role: string | undefined): string {
  if (role === "platform_admin") return "/admin/dashboard";
  if (role === "student")        return "/my-courses";
  return "/";
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const role  = request.cookies.get(ROLE_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAuth = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && token) {
    // Redirect logged-in users directly to their role home using the role cookie.
    // If role cookie is missing (old sessions), default to /my-courses and let server-side auth handle proper redirect.
    const destination = role ? roleHome(role) : "/my-courses";
    return NextResponse.redirect(new URL(destination, request.url));
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
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
