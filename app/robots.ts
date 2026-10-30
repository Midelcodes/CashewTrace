import type { MetadataRoute } from "next";

// Public pages are crawlable; the hub (agents' workspace) and sign-in are not.
// Individual lot pages (/v/...) carry their own noindex because they hold demo data.
// Rendered per request so PUBLIC_BASE_URL is read at runtime (Railway variables), not frozen at build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: ["/", "/impact", "/lots", "/verify"], disallow: ["/hub", "/login"] }],
    host: base,
  };
}
