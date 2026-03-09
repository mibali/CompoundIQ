import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require a T212 session
const PUBLIC_PATHS = ["/connect", "/api/session/connect"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Never redirect API routes — they return proper JSON 401 responses themselves
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For page navigations: redirect to /connect if no session cookie present
  const session = request.cookies.get("compoundiq_session");
  if (!session) {
    return NextResponse.redirect(new URL("/connect", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
