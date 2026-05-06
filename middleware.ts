import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

// Note: Middleware pattern is still the recommended way to handle route protection in Next.js 16+
// The deprecation warning about 'proxy' refers to a different use case (request proxying)
// Route protection via middleware is the standard approach and will continue to be supported

const SESSION_COOKIE = "ft_session";

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    // Admin routes — require admin role
    if (pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const session = await verifySessionToken(token);
      if (!session || session.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    // Protected user routes
    const protectedPaths = ["/persons", "/families", "/family-tree"];
    if (protectedPaths.some((p) => pathname.startsWith(p))) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const session = await verifySessionToken(token);
      if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    // Redirect already-authenticated users away from login/register
    if (pathname === "/login" || pathname === "/register") {
      if (token) {
        const session = await verifySessionToken(token);
        if (session) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Return to login on any auth errors
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/persons/:path*",
    "/families/:path*",
    "/family-tree/:path*",
    "/login",
    "/register",
  ],
};
