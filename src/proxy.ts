import type { NextFetchEvent, NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { routing } from "./i18n/routing";

const isLogin = createRouteMatcher(["/admin/login"]);
const isAdmin = createRouteMatcher(["/admin(.*)"]);

/**
 * Admin: protegge /admin/** (primo livello). Ogni funzione Convex ricontrolla comunque sessione + lista admin.
 * Il sito pubblico non usa Convex Auth: solo negoziazione/prefisso lingua (nessun cookie).
 */
const auth = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated();
  if (isAdmin(request) && !isLogin(request) && !authed) return nextjsMiddlewareRedirect(request, "/admin/login");
  if (isLogin(request) && authed) return nextjsMiddlewareRedirect(request, "/admin");
});

const intl = createIntlMiddleware(routing);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const p = request.nextUrl.pathname;
  if (p === "/admin" || p.startsWith("/admin/") || p === "/api/auth") return auth(request, event);
  return intl(request);
}

export const config = {
  // pagine del sito (esclusi api, admin, _next e file statici) + admin + endpoint auth
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)", "/admin/:path*", "/admin", "/api/auth"],
};
