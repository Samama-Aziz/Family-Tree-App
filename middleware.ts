import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

const SESSION_COOKIE = "ft_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Admin-only routes — require admin role
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/persons") ||
    pathname.startsWith("/families")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const session = await verifySessionToken(token);
      if (!session || session.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Redirect already-authenticated users away from login/register
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      try {
        const session = await verifySessionToken(token);
        if (session) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // Invalid token — let them access login/register
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/persons/:path*",
    "/families/:path*",
    "/login",
    "/register",
  ],
};
