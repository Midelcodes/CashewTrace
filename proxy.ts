import { NextResponse, type NextRequest } from "next/server";
import { readSessionCookie, SESSION_COOKIE } from "@/lib/session";

// Optimistic, cookie-only gate for the hub app. The authoritative checks (agent still exists,
// role) happen server-side in lib/auth.ts, which every hub page and server action calls.

const ADMIN_PATHS = ["/hub/settings", "/hub/agents", "/hub/exports"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session.agentId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const adminOnly = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (adminOnly && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*"],
};
