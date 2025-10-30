"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpConnector = void 0;
const axios_1 = __importDefault(require("axios"));
const mustache_1 = __importDefault(require("mustache"));
exports.httpConnector = {
    id: "http",
    name: "HTTP Request",
    type: "action",
    async run(ctx, config) {
        const { url, method = "GET", headers = {}, body, timeout_ms = 15000 } = config;
        if (!url)
            throw new Error("Missing URL in HTTP connector config");
        const templateCtx = { state: ctx.state, ...ctx.state };
        const renderedUrl = mustache_1.default.render(String(url), templateCtx);
        const renderedBody = body ? mustache_1.default.render(String(body), templateCtx) : undefined;
        ctx.logs.push(`[http] ${method.toUpperCase()} ${renderedUrl}`);
        try {
            const response = await (0, axios_1.default)({
                url: renderedUrl,
                method,
                headers,
                data: renderedBody,
                timeout: timeout_ms,
                validateStatus: () => true
            });
            ctx.logs.push(`[http] status ${response.status}`);
            return { success: true, output: response.data };
        }
        catch (err) {
            ctx.logs.push(`[http] error: ${err.message}`);
            return { success: false, output: { error: err.message } };
        }
    }
};
