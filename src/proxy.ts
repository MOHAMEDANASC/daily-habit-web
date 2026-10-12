import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic route protection. It only checks that a session cookie exists so signed-out
 * visitors are bounced early; the session itself is always verified against the database
 * (in the dashboard layout and in every API route), so a forged cookie gains nothing.
 * Redirecting *signed-in* users away from /login is done by the auth pages, which can verify
 * the session; doing it here with a mere cookie check would loop on an expired cookie.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tracker",
  "/habits",
  "/calendar",
  "/analytics",
  "/goals",
  "/notifications",
  "/profile",
  "/settings",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !request.cookies.has("habit_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
