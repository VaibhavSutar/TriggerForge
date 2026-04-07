
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const pexelsConnector: Connector = {
    id: "pexels",
    name: "Pexels (Free Stock Video)",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { apiKey, query, type = "videos", per_page = 3, orientation = "portrait" } = config;

        if (!apiKey) throw new Error("Pexels API Key is required.");
        
        let queryInput = query;
        if (typeof queryInput === 'string' && (queryInput.startsWith("[") || queryInput.startsWith("{"))) {
            try { queryInput = JSON.parse(queryInput); } catch { }
        }
        
        const queries = Array.isArray(queryInput) ? queryInput : [queryInput];
        const isBatch = Array.isArray(queryInput);

        if (isBatch) ctx.logs.push(`[pexels] Batch mode detected. Processing ${queries.length} queries...`);

        const execSearch = async (input: any) => {
            const q = typeof input === 'string' ? input : (input?.search_query || input?.query || input?.q || JSON.stringify(input));
            const url = type === "videos"
                ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=${per_page}&orientation=${orientation}`
                : `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${per_page}&orientation=${orientation}`;

            const response = await fetch(url, { headers: { Authorization: apiKey } });
            if (!response.ok) throw new Error(`Pexels API Error: ${response.status}`);
            const data = await response.json();
            const results = type === "videos" ? data.videos : data.photos;

            const links = results.map((asset: any) => {
                if (type === "videos") {
                    const file = asset.video_files.find((f: any) => f.quality === 'hd' || f.quality === 'sd') || asset.video_files?.[0];
                    return file?.link || "";
                }
                return asset.src?.large2x || "";
            }).filter((l: string) => !!l);

            return {
                found: links.length > 0,
                link: links[0],
                links: links,
                asset: results[0]
            };
        };

        try {
            const allResults: any[] = [];
            for (const q of queries) {
                allResults.push(await execSearch(q));
            }
            ctx.logs.push(`[pexels] Successfully fetched assets for ${queries.length} items.`);

            return {
                success: true,
                output: isBatch ? allResults : allResults[0]
            };
        } catch (error: any) {
            return { success: false, error: error.message, output: null };
        }
    }
};
