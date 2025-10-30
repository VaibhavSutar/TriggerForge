"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileConnector = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const mustache_1 = __importDefault(require("mustache"));
exports.fileConnector = {
    id: "file",
    name: "File Write",
    type: "utility",
    async run(ctx, config) {
        const { path, content } = config;
        if (!path)
            throw new Error("Missing file path");
        const rendered = mustache_1.default.render(content ?? "", { state: ctx.state, ...ctx.state });
        await promises_1.default.writeFile(path, rendered, "utf8");
        ctx.logs.push(`[file] written to ${path}`);
        return { success: true, output: `File saved to ${path}` };
    }
};
