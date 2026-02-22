
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, HTTP_STATUS, ERROR_MESSAGES } from "@/config/constants";
import { buildAuthHeaders } from "../../../_utils/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
    try {
        const { id } = await context.params;
        const apiUrl = buildApiUrl(`/workflow/${id}/executions`);

        const r = await fetch(apiUrl, {
            headers: await buildAuthHeaders(request),
            cache: "no-store",
        });

        const data = await r.json().catch(() => ({}));
        return NextResponse.json(data, { status: r.status });
    } catch (e) {
        console.error("WORKFLOW EXECUTION HISTORY GET error:", e);
        return NextResponse.json(
            { ok: false, error: ERROR_MESSAGES.INTERNAL_ERROR },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
