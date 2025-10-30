"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordWebhookConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const mustache_1 = __importDefault(require("mustache"));
exports.discordWebhookConnector = {
    id: "discord",
    name: "Discord Message",
    type: "action",
    async run(ctx, config) {
        const { webhookUrl, message } = config;
        if (!webhookUrl)
            throw new Error("Missing Discord webhook URL");
        const rendered = mustache_1.default.render(message ?? "Hello from TriggerForge!", {
            state: ctx.state,
            ...ctx.state,
        });
        await axios_1.default.post(webhookUrl, { content: rendered });
        ctx.logs.push(`[discord] message sent`);
        return { success: true, output: `Sent to Discord: ${rendered}` };
    },
};
