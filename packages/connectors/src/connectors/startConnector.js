"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConnector = void 0;
/**
 * The "Start Trigger" connector is the entry point of a workflow.
 * It doesn't require any input and simply starts execution manually or based on an event.
 */
exports.startConnector = {
    id: "start",
    name: "Start Trigger",
    type: "trigger",
    async run(ctx, config) {
        // Extract the event type if provided (manual, schedule, webhook, etc.)
        const { event = "manual", payload = {} } = config;
        // Log for debugging
        ctx.logs.push(`[start] Triggered via '${event}' event.`);
        // The start node simply initializes workflow state or passes payload forward
        const output = {
            triggered: true,
            event,
            timestamp: new Date().toISOString(),
            ...payload,
        };
        return {
            success: true,
            output,
        };
    },
};
