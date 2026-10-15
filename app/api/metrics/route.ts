import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory counters are per process; serverless instances have separate counters.
const startTimeSeconds = Math.floor(Date.now() / 1000);
let requestCount = 0;

export async function GET() {
  requestCount += 1;
  const body = [
    "# HELP app_up Whether the demo app is responding.",
    "# TYPE app_up gauge",
    "app_up 1",
    "# HELP app_requests_total Number of requests observed by this process.",
    "# TYPE app_requests_total counter",
    `app_requests_total ${requestCount}`,
    "# HELP app_start_time_seconds Unix timestamp when this process initialized.",
    "# TYPE app_start_time_seconds gauge",
    `app_start_time_seconds ${startTimeSeconds}`,
    ""
  ].join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8", "Cache-Control": "no-store, max-age=0" }
  });
}
