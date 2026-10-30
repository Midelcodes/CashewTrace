import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting. The right-most X-Forwarded-For entry is the one appended
 * by our own edge proxy (Railway); earlier entries are client-supplied and spoofable.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || h.get("x-real-ip") || "unknown";
}
