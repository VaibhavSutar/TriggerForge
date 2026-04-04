
import { spawn } from "child_process";
import path from "path";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

// In our build system (tsc -p tsconfig.json with module: commonjs), 
// __dirname is available at runtime in Node.js.
// We avoid import.meta.url to prevent Node.js from misidentifying this 
// compiled .js file as an ES module.

export const googleMapsDeepScraperConnector: Connector = {
    id: "google_maps_deep_scraper",
    name: "Google Maps Deep Scraper (Premium)",
    type: "scraper",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { query, limit = 5, max_scrolls = 10, headless = true } = config;

        if (!query) {
            throw new Error("Missing search query for Google Maps Scraper");
        }

        ctx.logs.push(`[google_maps_scraper] Starting deep scrape for: "${query}" (limit: ${limit})`);

        // Resolve path to python script
        // packages/connectors/src/connectors/googleMapsScraper.ts
        // -> packages/connectors/google_scraper.py is 2 levels up in source,
        // but in 'dist/connectors/googleMapsScraper.js', 
        // 2 levels up gets us to 'packages/connectors/'.
        const scriptPath = path.resolve(__dirname, "../../google_scraper.py");
        const pythonCmd = process.platform === "win32" ? "python" : "python3";

        const args = [
            scriptPath,
            "--query", query,
            "--limit", limit.toString(),
            "--max_scrolls", max_scrolls.toString(),
            "--headless", headless ? "True" : "False"
        ];

        return new Promise((resolve, reject) => {
            const pyProcess = spawn(pythonCmd, args);
            let stdout = "";
            let stderr = "";

            pyProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            pyProcess.stderr.on("data", (data) => {
                const lines = data.toString().split("\n");
                for (const line of lines) {
                    if (line.trim()) {
                        ctx.logs.push(`[google_maps_scraper:log] ${line.trim()}`);
                    }
                }
                stderr += data.toString();
            });

            pyProcess.on("close", (code) => {
                if (code !== 0) {
                    ctx.logs.push(`[google_maps_scraper] Process exited with code ${code}`);
                    return resolve({
                        success: false,
                        output: { error: stderr || `Process exited with code ${code}` }
                    });
                }

                try {
                    const result = JSON.parse(stdout);
                    ctx.logs.push(`[google_maps_scraper] Successfully captured ${result.found_leads} leads.`);
                    resolve({
                        success: true,
                        output: result
                    });
                } catch (err: any) {
                    ctx.logs.push(`[google_maps_scraper] Error parsing output: ${err.message}`);
                    ctx.logs.push(`[google_maps_scraper] Raw stdout: ${stdout.substring(0, 500)}...`);
                    resolve({
                        success: false,
                        output: { error: "Failed to parse scraper output" }
                    });
                }
            });

            pyProcess.on("error", (err) => {
                ctx.logs.push(`[google_maps_scraper] Process error: ${err.message}`);
                resolve({
                    success: false,
                    output: { error: err.message }
                });
            });
        });
    }
};
