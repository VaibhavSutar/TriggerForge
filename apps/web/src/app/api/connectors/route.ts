import { NextResponse, NextRequest } from "next/server";
import { buildApiUrl, API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES } from "@/config/constants";

export async function GET(_req: NextRequest) {
  try {
    const r = await fetch(buildApiUrl(API_ENDPOINTS.CONNECTORS), { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("CONNECTORS GET error:", e);
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
