import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, getWorkflowById } from "@/config/constants";
import { buildAuthHeaders } from "../../_utils/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  try {
    const { id } = await context.params; // ✅ unwrap params Promise
    const apiUrl = buildApiUrl(`/workflow/${id}`);
    console.log("Fetching workflow from URL:", apiUrl);

    const r = await fetch(apiUrl, {
      headers: await buildAuthHeaders(request),
      cache: "no-store",
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("WORKFLOW [id] GET error:", e);
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const body = await request.json();
    const apiUrl = new URL(buildApiUrl(API_ENDPOINTS.WORKFLOW_SAVE));

    // Ensure userId is present
    if (body?.userId) apiUrl.searchParams.set("userId", String(body.userId));

    const r = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: await buildAuthHeaders(request),
      body: JSON.stringify({
        id: (await params).id,
        userId: body.userId,       // ✅ include userId for upsert
        name: body.name,
        nodes: body.nodes,
        edges: body.edges,
      }),
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("WORKFLOW PUT error:", e);
    return NextResponse.json(
      { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}


export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? "";
    const url = new URL(buildApiUrl(getWorkflowById((await params).id)));
    if (userId) url.searchParams.set("userId", userId);

    const r = await fetch(url.toString(), { method: "DELETE", headers: await buildAuthHeaders(request) });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
