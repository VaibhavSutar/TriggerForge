"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomConnector = void 0;
exports.randomConnector = {
    id: "random",
    name: "Generate Random Number",
    type: "utility",
    async run(ctx, config) {
        const min = Number(config.min ?? 0);
        const max = Number(config.max ?? 100);
        const value = Math.floor(Math.random() * (max - min + 1)) + min;
        ctx.logs.push(`[random] ${value} between ${min}-${max}`);
        return { success: true, output: value };
    }
};
