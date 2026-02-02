"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectors = void 0;
exports.registerConnector = registerConnector;
exports.default = hasConnector;
exports.getConnector = getConnector;
exports.listConnectors = listConnectors;
const print_js_1 = require("./connectors/print.js");
const http_js_1 = require("./connectors/http.js");
const delay_js_1 = require("./connectors/delay.js");
const condition_js_1 = require("./connectors/condition.js");
const email_js_1 = require("./connectors/email.js");
const slack_js_1 = require("./connectors/slack.js");
const math_js_1 = require("./connectors/math.js");
const webhook_js_1 = require("./connectors/webhook.js");
const random_js_1 = require("./connectors/random.js");
const file_js_1 = require("./connectors/file.js");
const discord_webhook_js_1 = require("./connectors/discord_webhook.js");
const startConnector_js_1 = require("./connectors/startConnector.js");
const ai_js_1 = require("./connectors/ai.js");
const mcpTool_js_1 = require("./connectors/mcpTool.js");
const google_js_1 = require("./connectors/google.js");
/** Base registry: keys are our canonical ids (lowercase, no spaces, no hyphens/underscores). */
exports.connectors = {
    print: print_js_1.printConnector,
    http: http_js_1.httpConnector,
    delay: delay_js_1.delayConnector,
    condition: condition_js_1.conditionConnector,
    email: email_js_1.emailConnector,
    slack: slack_js_1.slackConnector,
    math: math_js_1.mathConnector,
    webhook: webhook_js_1.webhookConnector,
    random: random_js_1.randomConnector,
    file: file_js_1.fileConnector,
    // Important: choose ONE canonical key; id inside the connector can be "discord_webhook" etc.,
    // but our registry key should be normalized (no hyphen/underscore) for simpler lookups.
    discordwebhook: discord_webhook_js_1.discordWebhookConnector,
    start: startConnector_js_1.startConnector,
    ai: ai_js_1.aiConnector,
    mcp_tool: mcpTool_js_1.mcpToolConnector,
    google_gmail: google_js_1.googleGmailConnector,
};
/** Normalize any incoming id/name into a canonical lookup key. */
function normalizeKey(s) {
    return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, ""); // remove spaces/underscores/hyphens
}
/** Optional aliases for common variations. Map normalized variations -> canonical key. */
const ALIASES = {
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
let INDEX = new Map();
function rebuildIndex() {
    INDEX = new Map();
    // 1) from registry keys
    for (const [key, conn] of Object.entries(exports.connectors)) {
        INDEX.set(normalizeKey(key), conn);
    }
    // 2) from connector.id (if provided)
    for (const conn of Object.values(exports.connectors)) {
        if (conn?.id) {
            INDEX.set(normalizeKey(conn.id), conn);
        }
        // 3) from connector.title/name if present (defensive)
        // @ts-ignore – some connectors may expose title/name
        if (conn?.title)
            INDEX.set(normalizeKey(conn.title), conn);
        // @ts-ignore
        if (conn?.name)
            INDEX.set(normalizeKey(conn.name), conn);
    }
    // 4) aliases
    for (const [alias, canonical] of Object.entries(ALIASES)) {
        const target = exports.connectors[canonical];
        if (target)
            INDEX.set(alias, target);
    }
}
/** Call once on module load. */
rebuildIndex();
/** Public API */
function registerConnector(connector) {
    const key = normalizeKey(connector.id || connector?.name || "");
    if (!key)
        throw new Error("registerConnector: connector.id (or name) is required");
    exports.connectors[key] = connector;
    rebuildIndex();
}
function hasConnector(type) {
    const n = normalizeKey(type);
    if (INDEX.has(n))
        return true;
    const alias = ALIASES[n];
    return alias ? !!exports.connectors[alias] : false;
}
function getConnector(type) {
    const n = normalizeKey(type);
    // exact / normalized index hit
    const byIndex = INDEX.get(n);
    if (byIndex)
        return byIndex;
    // alias → canonical → value
    const alias = ALIASES[n];
    if (alias)
        return exports.connectors[alias];
    // as a last resort, try raw registry access by normalized key
    return exports.connectors[n];
}
function listConnectors() {
    return Object.values(exports.connectors);
}
__exportStar(require("./types.js"), exports);
