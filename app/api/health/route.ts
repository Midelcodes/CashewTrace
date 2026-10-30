import { db } from "@/lib/db";

// Railway health check: the new deploy only goes live once this returns 200.
// Also pings the database so a deploy that can't reach Postgres is not promoted.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
