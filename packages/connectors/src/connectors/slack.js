"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const mustache_1 = __importDefault(require("mustache"));
exports.slackConnector = {
    id: "slack",
    name: "Send Slack Message",
    type: "action",
    async run(ctx, config) {
        const { webhookUrl, message } = config;
        if (!webhookUrl)
            throw new Error("Missing Slack webhookUrl");
        const rendered = mustache_1.default.render(message ?? "No message", { state: ctx.state, ...ctx.state });
        await axios_1.default.post(webhookUrl, { text: rendered });
        ctx.logs.push(`[slack] sent message`);
        return { success: true, output: rendered };
    }
};
