import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import axios from "axios";

const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,5}\b/g;

function extractEmails(text: string): string[] {
    if (!text) return [];
    const matches = text.match(emailRegex);
    return matches ? Array.from(new Set(matches)) : [];
}

function deepExtractEmails(obj: any): string[] {
    const emails: Set<string> = new Set();
    const stack = [obj];

    while (stack.length > 0) {
        const current = stack.pop();
        if (typeof current === "string") {
            const matches = current.match(emailRegex);
            if (matches) matches.forEach(m => emails.add(m));
        } else if (Array.isArray(current)) {
            for (const item of current) stack.push(item);
        } else if (current && typeof current === "object") {
            for (const value of Object.values(current)) stack.push(value);
        }
    }
    return Array.from(emails);
}

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
        const google_domain = config.google_domain || "google.com";

        ctx.logs.push(`[serpapi] Executing search on engine: ${engine} with query: "${query}"`);

        const params: Record<string, any> = {
            q: query,
            engine: engine,
            api_key: apiKey,
            hl,
            gl,
            num,
            google_domain
        };

        if (location) {
            params.location = location;
        }

        // Add any other config params directly to SerpApi call
        for (const [key, value] of Object.entries(config)) {
            if (!["query", "engine", "apiKey", "language", "country", "num", "google_domain", "location"].includes(key)) {
                params[key] = value;
            }
        }

        try {
            const response = await axios.get("https://serpapi.com/search", { params });
            const data = response.data;

            const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];
            const getLocalResults = (data: any) => {
                if (Array.isArray(data.local_results)) return data.local_results;
                if (data.local_results && Array.isArray(data.local_results.places)) return data.local_results.places;
                return [];
            };

            const totalEmails = [
                ...ensureArray(data.organic_results).flatMap(r => deepExtractEmails(r)),
                ...getLocalResults(data).flatMap((l: any) => deepExtractEmails(l))
            ].length;

            ctx.logs.push(`[serpapi] Search successful. Found ${ensureArray(data.organic_results).length} organic results and ${getLocalResults(data).length} local results.`);

            if (totalEmails === 0) {
                ctx.logs.push(`[serpapi] Tip: No emails found in snippets. Connect a "Website Scraper" node to the results to extract emails directly from each website URL.`);
            }

            return {
                success: true,
                output: {
                    search_metadata: data.search_metadata,
                    search_parameters: data.search_parameters,
                    organic_results: ensureArray(data.organic_results).map((r: any) => {
                        const emails = deepExtractEmails(r);
                        return {
                            ...r,
                            emails: emails,
                            email: emails.length > 0 ? emails[0] : null
                        };
                    }),
                    local_results: getLocalResults(data).map((l: any) => {
                        const emails = deepExtractEmails(l);
                        return {
                            ...l,
                            emails: emails,
                            email: emails.length > 0 ? emails[0] : null
                        };
                    }),
                    place_results: data.place_results ? {
                        ...data.place_results,
                        emails: deepExtractEmails(data.place_results),
                        email: deepExtractEmails(data.place_results)[0] || null
                    } : null,
                    knowledge_graph: data.knowledge_graph ? {
                        ...data.knowledge_graph,
                        emails: deepExtractEmails(data.knowledge_graph),
                        email: deepExtractEmails(data.knowledge_graph)[0] || null
                    } : null,
                    related_questions: ensureArray(data.related_questions).map((q: any) => ({
                        question: q.question,
                        snippet: q.snippet,
                        title: q.title,
                        link: q.link
                    })),
                    news_results: ensureArray(data.news_results).map((n: any) => ({
                        position: n.position,
                        title: n.title,
                        link: n.link,
                        snippet: n.snippet,
                        source: n.source,
                        date: n.date,
                        thumbnail: n.thumbnail
                    })),
                    // Keep raw data in case user needs specialized fields
                    raw: data
                }
            };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message;
            ctx.logs.push(`[serpapi] Error: ${errorMsg}`);
            return {
                success: false,
                output: null,
                error: `SerpApi execution failed: ${errorMsg}`
            };
        }
    }
};
