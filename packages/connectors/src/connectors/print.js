"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printConnector = void 0;
const mustache_1 = __importDefault(require("mustache"));
exports.printConnector = {
    id: "print",
    name: "Print Message",
    type: "utility",
    async run(ctx, config) {
        const messageTemplate = config.message ?? "No message provided";
        const rendered = mustache_1.default.render(String(messageTemplate), { state: ctx.state, ...ctx.state });
        ctx.logs.push(`[print] ${rendered}`);
        console.log(`[print] ${rendered}`);
        return { success: true, output: rendered };
    }
};
