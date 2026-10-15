import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const latencyMs = 100 + Math.floor(Math.random() * 901);
  await new Promise((resolve) => setTimeout(resolve, latencyMs));
  const failed = Math.random() < 0.3;
  return NextResponse.json(
    failed ? { error: "simulated flaky failure", latencyMs } : { status: "ok", latencyMs },
    { status: failed ? 500 : 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
