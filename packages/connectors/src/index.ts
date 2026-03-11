
import { Connector } from "./types.js";

// Triggers
import { startConnector } from "./connectors/startConnector.js";
import { webhookConnector } from "./connectors/webhook.js";
import { cronConnector } from "./connectors/cron.js";

// Actions
import { httpConnector } from "./connectors/http.js";
import { delayConnector } from "./connectors/delay.js";
import { printConnector } from "./connectors/print.js";
import { randomConnector } from "./connectors/random.js";
import { mathConnector } from "./connectors/math.js";
import { conditionConnector } from "./connectors/condition.js";
import { loopConnector } from "./connectors/loop.js";

// Integrations
import { googleGmailConnector } from "./connectors/google.js";
import { googleDocsConnector } from "./connectors/googleDocs.js";
import { googleSheetsConnector } from "./connectors/googleSheets.js";
import { discordWebhookConnector } from "./connectors/discord_webhook.js";
import { slackConnector } from "./connectors/slack.js";
import { twitterConnector } from "./connectors/twitter.js";
import { telegramConnector } from "./connectors/telegram.js";
import { teamsConnector } from "./connectors/teams.js";
import { emailConnector } from "./connectors/email.js";
import { huggingFaceConnector } from "./connectors/huggingFace.js";
import { fileConnector } from "./connectors/file.js";

// AI
import { aiConnector } from "./connectors/ai.js";
import { mcpToolConnector } from "./connectors/mcpTool.js";

// [NEW] RAG & Agent
import { textSplitterConnector } from "./connectors/textSplitter.js";
import { googleDriveConnector } from "./connectors/googleDrive.js";
import { geminiConnector } from "./connectors/gemini.js";
import { pineconeConnector } from "./connectors/pinecone.js";
import { vectorStoreToolConnector } from "./connectors/vectorStoreTool.js";
import { memoryConnector } from "./connectors/memory.js";
import { agentConnector } from "./connectors/agent.js";
import { complianceNode } from "./connectors/compliance.js";
import { serpApiConnector } from "./connectors/serpapi.js";
import { openAIConnector } from "./connectors/openai.js";

// Re-export individually
export { startConnector, webhookConnector, cronConnector };
export { httpConnector, delayConnector, printConnector, randomConnector, mathConnector, conditionConnector, loopConnector };
export { googleGmailConnector, googleDocsConnector, googleSheetsConnector, discordWebhookConnector, slackConnector, twitterConnector, telegramConnector, teamsConnector, emailConnector, huggingFaceConnector, fileConnector };
export { aiConnector, mcpToolConnector };
export { textSplitterConnector, googleDriveConnector, geminiConnector, pineconeConnector, vectorStoreToolConnector, memoryConnector, agentConnector, serpApiConnector, openAIConnector };

// Registry
const ALL_CONNECTORS: Connector[] = [
  startConnector,
  webhookConnector,
  cronConnector,
  httpConnector,
  delayConnector,
  printConnector,
  randomConnector,
  mathConnector,
  conditionConnector,
  loopConnector,
  googleGmailConnector,
  googleDocsConnector,
  googleSheetsConnector,
  discordWebhookConnector,
  slackConnector,
  twitterConnector,
  telegramConnector,
  teamsConnector,
  emailConnector,
  huggingFaceConnector,
  fileConnector,
  aiConnector,
  mcpToolConnector,
  // [NEW]
  textSplitterConnector,
  googleDriveConnector,
  geminiConnector,
  pineconeConnector,
  vectorStoreToolConnector,
  memoryConnector,
  agentConnector,
  complianceNode,
  serpApiConnector,
  openAIConnector
];

export function listConnectors(): Connector[] {
  return ALL_CONNECTORS;
}

export function getConnector(id: string): Connector | undefined {
  return ALL_CONNECTORS.find(c => c.id === id);
}

// Also export types if needed
export * from "./types.js";
