import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isPreviewMode } from "@/lib/preview-data";

const GUEST_COOKIE_NAME = "slc_guest";
const GUEST_TTL_SECONDS = 60 * 60 * 24 * 180;

const protectedPrefixes = [
  "/form",
  "/environment",
  "/result",
  "/analyze",
  "/generate",
  "/me",
  "/records",
  "/dashboard",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPreviewMode) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("slc_session")?.value);
  const hasGuest = Boolean(request.cookies.get(GUEST_COOKIE_NAME)?.value);

  if (hasSession || hasGuest) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set(GUEST_COOKIE_NAME, crypto.randomUUID(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: GUEST_TTL_SECONDS,
  });
  return response;
}

export const config = {
  matcher: [
    "/form/:path*",
    "/environment/:path*",
    "/result/:path*",
    "/analyze/:path*",
    "/generate/:path*",
    "/me/:path*",
    "/records/:path*",
    "/dashboard/:path*",
  ],
};
