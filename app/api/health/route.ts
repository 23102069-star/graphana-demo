import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  if (request.nextUrl.searchParams.get("fail") === "1") {
    return NextResponse.json({ status: "unhealthy" }, { status: 503, headers });
  }
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return NextResponse.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: sha ? sha.slice(0, 7) : "local"
  }, { status: 200, headers });
}
