"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookConnector = void 0;
exports.webhookConnector = {
    id: "webhook",
    name: "Incoming Webhook Trigger",
    type: "trigger",
    async run(ctx, config) {
        const { payload } = config;
        ctx.logs.push(`[webhook] triggered`);
        return { success: true, output: payload ?? {} };
    }
};
