import { printConnector } from "./connectors/print.js";
import { httpConnector } from "./connectors/http.js";
import { delayConnector } from "./connectors/delay.js";
import { conditionConnector } from "./connectors/condition.js";
import { emailConnector } from "./connectors/email.js";
import { slackConnector } from "./connectors/slack.js";
import { mathConnector } from "./connectors/math.js";
import { webhookConnector } from "./connectors/webhook.js";
import { randomConnector } from "./connectors/random.js";
import { fileConnector } from "./connectors/file.js";
import { discordWebhookConnector } from "./connectors/discord_webhook.js";
import type { Connector } from "./types.js";
import { startConnector } from "./connectors/startConnector.js";

/** Base registry: keys are our canonical ids (lowercase, no spaces, no hyphens/underscores). */
export const connectors: Record<string, Connector> = {
  print: printConnector,
  http: httpConnector,
  delay: delayConnector,
  condition: conditionConnector,
  email: emailConnector,
  slack: slackConnector,
  math: mathConnector,
  webhook: webhookConnector,
  random: randomConnector,
  file: fileConnector,
  // Important: choose ONE canonical key; id inside the connector can be "discord_webhook" etc.,
  // but our registry key should be normalized (no hyphen/underscore) for simpler lookups.
  discordwebhook: discordWebhookConnector,
  startConnector : startConnector
};

/** Normalize any incoming id/name into a canonical lookup key. */
function normalizeKey(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ""); // remove spaces/underscores/hyphens
}

/** Optional aliases for common variations. Map normalized variations -> canonical key. */
const ALIASES: Record<string, string> = {
  // discord webhook
  [normalizeKey("discord_webhook")]: "discordwebhook",
  [normalizeKey("discord-webhook")]: "discordwebhook",
  [normalizeKey("discord webhook")]: "discordwebhook",
  [normalizeKey("discord")]: "discordwebhook",
  [normalizeKey("startConnector")]: "startConnector",

  // http variations
  [normalizeKey("HTTP")]: "http",
  [normalizeKey("http-request")]: "http",

  // print variations
  [normalizeKey("log")]: "print",
  [normalizeKey("console")]: "print",
};

/** Reverse index to support lookup by both key and connector.id/title variants. */
let INDEX = new Map<string, Connector>();

function rebuildIndex() {
  INDEX = new Map<string, Connector>();

  // 1) from registry keys
  for (const [key, conn] of Object.entries(connectors)) {
    INDEX.set(normalizeKey(key), conn);
  }

  // 2) from connector.id (if provided)
  for (const conn of Object.values(connectors)) {
    if (conn?.id) {
      INDEX.set(normalizeKey(conn.id), conn);
    }
    // 3) from connector.title/name if present (defensive)
    // @ts-ignore – some connectors may expose title/name
    if ((conn as any)?.title) INDEX.set(normalizeKey((conn as any).title), conn);
    // @ts-ignore
    if ((conn as any)?.name) INDEX.set(normalizeKey((conn as any).name), conn);
  }

  // 4) aliases
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    const target = connectors[canonical];
    if (target) INDEX.set(alias, target);
  }
}

/** Call once on module load. */
rebuildIndex();

/** Public API */

export function registerConnector(connector: Connector) {
  const key = normalizeKey(connector.id || connector?.name || "");
  if (!key) throw new Error("registerConnector: connector.id (or name) is required");

  connectors[key] = connector;
  rebuildIndex();
}

export default function hasConnector(type: string): boolean {
  const n = normalizeKey(type);
  if (INDEX.has(n)) return true;
  const alias = ALIASES[n];
  return alias ? !!connectors[alias] : false;
}

export function getConnector(type: string): Connector | undefined {
  const n = normalizeKey(type);

  // exact / normalized index hit
  const byIndex = INDEX.get(n);
  if (byIndex) return byIndex;

  // alias → canonical → value
  const alias = ALIASES[n];
  if (alias) return connectors[alias];

  // as a last resort, try raw registry access by normalized key
  return connectors[n];
}

export function listConnectors(): Connector[] {
  return Object.values(connectors);
}

export * from "./types.js";
