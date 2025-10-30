"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mathConnector = void 0;
const mustache_1 = __importDefault(require("mustache"));
exports.mathConnector = {
    id: "math",
    name: "Math Expression",
    type: "utility",
    async run(ctx, config) {
        const { expression } = config; // e.g. "{{state.a}} + {{state.b}}"
        const rendered = mustache_1.default.render(expression || "0", { state: ctx.state, ...ctx.state });
        const result = eval(rendered);
        ctx.logs.push(`[math] ${rendered} = ${result}`);
        return { success: true, output: result };
    }
};
