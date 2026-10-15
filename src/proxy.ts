import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isLogin = createRouteMatcher(["/admin/login"]);
const isAdmin = createRouteMatcher(["/admin(.*)"]);

/**
 * Protegge /admin/** (primo livello). Ogni funzione Convex ricontrolla comunque sessione + lista admin.
 * Attivo SOLO su /admin e /api/auth: il sito pubblico non passa da qui (zero overhead).
 */
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated();
  if (isAdmin(request) && !isLogin(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/admin/login");
  }
  if (isLogin(request) && authed) {
    return nextjsMiddlewareRedirect(request, "/admin");
  }
});

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/auth"],
};
