"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conditionConnector = void 0;
const mustache_1 = __importDefault(require("mustache"));
exports.conditionConnector = {
    id: "condition",
    name: "Conditional Branch",
    type: "logic",
    async run(ctx, config) {
        const { expression } = config; // e.g., "{{state.user.age}} > 18"
        if (!expression)
            throw new Error("Condition connector missing 'expression'");
        const rendered = mustache_1.default.render(expression, { state: ctx.state, ...ctx.state });
        const result = eval(rendered); // ⚠️ sandbox later for security
        ctx.logs.push(`[condition] ${expression} => ${result}`);
        return { success: true, output: !!result };
    }
};
