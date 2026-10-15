import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.GRAFANA_URL && process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN);
  return NextResponse.json({ annotationsConfigured: configured }, {
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}
