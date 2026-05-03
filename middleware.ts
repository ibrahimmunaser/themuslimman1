import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "seerah_session";

// Pages logged-in users shouldn't see
const AUTH_ONLY_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  // If already logged in, redirect away from auth pages to home
  if (sessionToken && AUTH_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "?"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/forgot-password", "/reset-password"],
};
