import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

// Create the next-intl middleware for locale handling
const intlMiddleware = createMiddleware(routing);

// Public routes that require no authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/oauth-role",
  "/auth/403",
  "/auth/error",
  "/",
];

// Provider routes — require PROVIDER or ADMIN role
const PROVIDER_PATHS = ["/provider"];

// Admin routes — require ADMIN role only
const ADMIN_PATHS = ["/admin"];

// Authenticated routes — require any logged-in user
const AUTHENTICATED_PATHS = ["/dashboard", "/settings", "/bookings"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(publicPath + "/"),
  );
}

function isProviderPath(pathname: string): boolean {
  return PROVIDER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthenticatedPath(pathname: string): boolean {
  return AUTHENTICATED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default async function middleware(request: NextRequest) {
  // Run next-intl middleware first to handle locale routing
  const intlResponse = intlMiddleware(request);

  const { pathname } = request.nextUrl;

  // Extract the locale prefix from the pathname
  // Pathnames look like /fr/admin/dashboard — strip locale to get /admin/dashboard
  const localeMatch = /^\/([a-z]{2})(?:\/(.*))?$/.exec(pathname);
  const locale = localeMatch?.[1] ?? "fr";
  const pathnameWithoutLocale = localeMatch ? `/${localeMatch[2] ?? ""}` : pathname;

  // If this is a public path, allow without auth check
  if (isPublicPath(pathnameWithoutLocale)) {
    return intlResponse;
  }

  // Get the JWT token from the request (reads from cookie, no DB call)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Unauthenticated user accessing protected route — redirect to login
  if (!token) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string | undefined;

  // Admin routes — only ADMIN can access
  if (isAdminPath(pathnameWithoutLocale)) {
    if (userRole !== "ADMIN") {
      const forbiddenUrl = new URL(`/${locale}/auth/403`, request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
    return intlResponse;
  }

  // Provider routes — PROVIDER or ADMIN can access
  if (isProviderPath(pathnameWithoutLocale)) {
    if (userRole !== "PROVIDER" && userRole !== "ADMIN") {
      const forbiddenUrl = new URL(`/${locale}/auth/403`, request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
    return intlResponse;
  }

  // Authenticated routes — any logged-in user can access
  if (isAuthenticatedPath(pathnameWithoutLocale)) {
    return intlResponse;
  }

  // All other routes — allow (with locale handling)
  return intlResponse;
}

export const config = {
  // Matcher qui exclut les fichiers statiques et API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
