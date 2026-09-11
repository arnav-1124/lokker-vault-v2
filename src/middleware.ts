import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that logged-in users should not access
const RESTRICTED_FOR_AUTHENTICATED = [
  "/",
  "/features",
  "/security",
  "/privacy",
  "/download",
  "/login",
  "/signup",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCloudSession = request.cookies.has("lokker_cloud_session");

  if (hasCloudSession) {
    const isRestricted = RESTRICTED_FOR_AUTHENTICATED.some((route) => {
      if (route === "/") return pathname === "/";
      return pathname === route || pathname.startsWith(`${route}/`);
    });

    if (isRestricted) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/features/:path*",
    "/security/:path*",
    "/privacy/:path*",
    "/download/:path*",
    "/login",
    "/signup",
  ],
};
