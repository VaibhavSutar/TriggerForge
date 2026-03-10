import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import axios from "axios";

export const serpApiConnector: Connector = {
    id: "serpapi",
    name: "SerpApi",
    type: "scraper",
    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const query = config.query || ctx.input?.query;
        if (!query) {
            return { success: false, output: null, error: "Search Query is required" };
        }

        const apiKey = ctx.services?.serpapi_api_key || ctx.state?.env?.SERPAPI_API_KEY || process.env.SERPAPI_API_KEY || config.apiKey;
        if (!apiKey) {
            return { success: false, output: null, error: "SerpApi API key not found in credentials or environment variables" };
        }

        const engine = config.engine || "google";
        const location = config.location;
        const hl = config.language || "en";
        const gl = config.country || "us";
        const num = config.num || 10;

        const params: Record<string, any> = {
            q: query,
            engine: engine,
            api_key: apiKey,
            hl,
            gl,
            num
        };

        if (location) {
            params.location = location;
        }

        try {
            const response = await axios.get("https://serpapi.com/search", { params });
            return {
                success: true,
                output: {
                    results: response.data,
                    organic_results: response.data.organic_results || []
                }
            };
        } catch (error: any) {
            console.error("SerpApi error:", error.response?.data || error.message);
            return {
                success: false,
                output: null,
                error: `SerpApi execution failed: ${error.response?.data?.error || error.message}`
            };
        }
    }
};
