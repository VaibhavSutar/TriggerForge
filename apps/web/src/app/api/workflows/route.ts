import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, buildApiUrl } from "@/config/constants";
import { buildAuthHeaders } from "../_utils/auth";

/**
 * GET /api/workflows?userId=123
 * → Proxies to Fastify /workflow?userId=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Optional: If userId missing, get all workflows
    const targetUrl = userId
      ? buildApiUrl(`/workflow?userId=${userId}`)
      : buildApiUrl(`/workflow`);

    const response = await fetch(targetUrl, {
      headers: await buildAuthHeaders(request),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("WORKFLOWS GET error:", error);
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/workflows
 * → Create or update workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // { userId, name, nodes, edges, id? }

    // Build full Fastify URL for workflow save
    const apiUrl = new URL(buildApiUrl(API_ENDPOINTS.WORKFLOW_SAVE));
    if (body?.userId) apiUrl.searchParams.set("userId", String(body.userId));

    const response = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: await buildAuthHeaders(request),
      body: JSON.stringify({
        id: body.id,
        userId: body.userId,                 // 👈 include in body
        name: body.name ?? "Untitled Workflow",
        nodes: body.nodes ?? [],
        edges: body.edges ?? [],
      }),
    });

    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("WORKFLOWS POST error:", error);
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
