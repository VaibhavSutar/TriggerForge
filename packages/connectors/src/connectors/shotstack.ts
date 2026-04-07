
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

interface ShotstackClip {
    asset: {
        type: string;
        src: string;
        trim?: number;
    };
    start: number;
    length: number;
}

export const shotstackConnector: Connector = {
    id: "shotstack",
    name: "Shotstack Video Generation",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { apiKey, timeline, soundtrack, output, env = "sandbox" } = config;

        if (!apiKey) {
            throw new Error("Shotstack API Key is required. Get one at shotstack.io");
        }

        const baseUrl = env === "sandbox" ? "https://api.shotstack.io/v1" : "https://api.shotstack.io/v1/stage";
        
        // Define standard default output if not provided
        const finalOutput = Object.assign({
            format: "mp4",
            resolution: "hd",
            aspectRatio: "9:16" // Instagram Reel standard
        }, output || {});

        const body = {
            timeline: timeline || {
              "background": "#000000",
              "tracks": [
                {
                  "clips": []
                }
              ]
            },
            output: finalOutput
        };

        if (soundtrack) {
            (body as any).timeline.soundtrack = soundtrack;
        }

        ctx.logs.push(`[shotstack] Submitting render request to ${env} api...`);

        try {
            const response = await fetch(`${baseUrl}/render`, {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errBody = await response.json();
                throw new Error(`Shotstack API Error: ${response.status} ${JSON.stringify(errBody)}`);
            }

            const data = await response.json();
            const renderId = data.response.id;
            
            ctx.logs.push(`[shotstack] Render submitted successfully. ID: ${renderId}`);

            // In TriggerForge, we'll return the ID first, and user might need a "Check Status" node 
            // OR we can poll for completion here if a flag 'waitForCompletion' is set.
            if (config.waitForCompletion) {
                ctx.logs.push(`[shotstack] Waiting for completion...`);
                let status = "queued";
                let url = "";

                while (status === "queued" || status === "rendering") {
                    await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
                    const statusRes = await fetch(`${baseUrl}/render/${renderId}`, {
                        headers: { "x-api-key": apiKey }
                    });
                    const statusData = await statusRes.json();
                    status = statusData.response.status;
                    url = statusData.response.url;
                    ctx.logs.push(`[shotstack] Render status: ${status}...`);
                }

                if (status === "done") {
                  return { success: true, output: { status: "done", renderId, url } };
                } else {
                  throw new Error(`Shotstack render failed with status: ${status}`);
                }
            }

            return {
                success: true,
                output: {
                    status: data.response.status,
                    renderId: renderId,
                    message: "Render started. Use Render ID to track status."
                }
            };

        } catch (error: any) {
            return { success: false, error: error.message, output: null };
        }
    }
};
