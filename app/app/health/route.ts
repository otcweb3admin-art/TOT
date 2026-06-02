// P0 health check — confirms the app is reachable and reports DB connectivity.
// GET /health -> JSON. Always runs at request time (checks the live DB), never prerendered.
//
// States:
//   db.status = "unconfigured" -> DATABASE_URL not set (expected during P0 before creds)  -> 200 ok
//   db.status = "connected"    -> DB reachable                                             -> 200 ok
//   db.status = "error"        -> DATABASE_URL set but query failed                        -> 503 degraded

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.DATABASE_URL);

  let db: { status: "unconfigured" | "connected" | "error"; detail?: string } = {
    status: "unconfigured",
  };

  if (configured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = { status: "connected" };
    } catch (err) {
      db = {
        status: "error",
        detail: err instanceof Error ? err.message : "unknown error",
      };
    }
  }

  // Unconfigured DB is the expected, acceptable state during P0 → app is still healthy.
  // A configured-but-failing DB is a real problem → degraded.
  const healthy = !configured || db.status === "connected";

  return Response.json(
    {
      service: "tot",
      status: healthy ? "ok" : "degraded",
      phase: "p0-foundation",
      db,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
