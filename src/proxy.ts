import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Single-society mode: set SOCIETY_SLUG env var for per-domain deployments.
// Middleware rewrites clean paths (/dashboard) → /slug/dashboard internally,
// and redirects /slug/... → /... so users always see slug-free public URLs.
const SOCIETY_SLUG = process.env.SOCIETY_SLUG ?? "";

// Paths that are never rewritten (they exist at the root level)
const ROOT_PATHS = ["/login", "/register", "/setup", "/api/", "/_next", "/uploads", "/favicon.ico"];

function isRootPath(pathname: string) {
  return ROOT_PATHS.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic =
    isAuthPage || isApiAuth || pathname.startsWith("/_next") || pathname.startsWith("/uploads");

  // Auth guard (runs regardless of society mode)
  if (!isPublic && !isAuth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Single-society mode URL rewriting
  if (SOCIETY_SLUG && !isPublic) {
    const slugPrefix = `/${SOCIETY_SLUG}`;

    if (pathname.startsWith(slugPrefix + "/") || pathname === slugPrefix) {
      // Browser requested /slug/... — redirect to clean URL so address bar stays clean
      const cleanPath = pathname === slugPrefix ? "/" : pathname.slice(slugPrefix.length);
      const cleanUrl = new URL(cleanPath || "/", req.url);
      cleanUrl.search = req.nextUrl.search;
      return NextResponse.redirect(cleanUrl);
    }

    if (!isRootPath(pathname)) {
      // Rewrite clean path → /slug/path (internal, transparent to browser)
      const rewritten = new URL(`${slugPrefix}${pathname}`, req.url);
      rewritten.search = req.nextUrl.search;
      return NextResponse.rewrite(rewritten);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
