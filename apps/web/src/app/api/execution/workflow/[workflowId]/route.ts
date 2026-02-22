
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, ERROR_MESSAGES, HTTP_STATUS } from "@/config/constants";
import { buildAuthHeaders } from "@/app/api/_utils/auth";

type Ctx = { params: Promise<{ workflowId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
    try {
        const { workflowId } = await context.params;
        const apiUrl = buildApiUrl(`/execution/workflow/${workflowId}`);

        const r = await fetch(apiUrl, {
            method: "GET",
            headers: await buildAuthHeaders(request),
        });

        if (!r.ok) {
            return NextResponse.json(
                { ok: false, error: "Failed to fetch from backend" },
                { status: r.status }
            );
        }

        const data = await r.json();
        return NextResponse.json(data, { status: 200 });
    } catch (e) {
        console.error("Execution proxy error:", e);
        return NextResponse.json(
            { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
