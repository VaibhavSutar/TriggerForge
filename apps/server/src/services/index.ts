import { MCPManager } from "./mcp.service";
import { AIService } from "./ai.service";
import { OAuthService } from "./oauth.service";
export { triggerService } from "./trigger.service";
import dotenv from "dotenv";

dotenv.config();

export const mcpManager = new MCPManager([
    // Example local MCP server (filesystem) - configured generally via env or DB later
    // { type: "stdio", name: "filesystem", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./files"] }
]);

export const aiService = new AIService({
    openaiApiKey: process.env.OPENAI_API_KEY,
});

export const oauthService = new OAuthService({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// Start MCP connections
mcpManager.connectAll().catch(err => console.error("MCP Connect Error:", err));
