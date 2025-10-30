"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayConnector = void 0;
exports.delayConnector = {
    id: "delay",
    name: "Delay / Wait",
    type: "utility",
    async run(ctx, config) {
        const ms = Number(config.ms ?? 1000);
        ctx.logs.push(`[delay] waiting ${ms}ms`);
        await new Promise((r) => setTimeout(r, ms));
        ctx.logs.push(`[delay] completed`);
        return { success: true, output: `Waited ${ms}ms` };
    }
};
