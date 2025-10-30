// apps/web/app/api/workflows/[id]/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, HTTP_STATUS, ERROR_MESSAGES } from "@/config/constants";
import { buildAuthHeaders } from "@/app/api/_utils/auth";

type Ctx = { params: Promise<{ id: string }> }; // 👈 params is a Promise

export async function POST(request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params; // ✅ await params before using it
    const body = await request.json();
    const apiUrl = buildApiUrl(`/workflow/${id}/run`);

    const r = await fetch(apiUrl, {
      method: "POST",
      headers: await buildAuthHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("Run proxy error:", e);
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
