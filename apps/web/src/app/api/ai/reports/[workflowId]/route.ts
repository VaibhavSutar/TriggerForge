import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/config/constants";

type Ctx = { params: Promise<{ workflowId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
    try {
        const { workflowId } = await context.params;
        const apiUrl = buildApiUrl(`/ai/reports/${workflowId}`);
        console.log("Fetching AI report from URL:", apiUrl);

        const res = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store"
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        console.error("AI Report GET error:", error);
        return NextResponse.json(
            { ok: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
