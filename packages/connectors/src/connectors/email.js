"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailConnector = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mustache_1 = __importDefault(require("mustache"));
exports.emailConnector = {
    id: "email",
    name: "Send Email (SMTP)",
    type: "action",
    async run(ctx, config) {
        const { host, port, secure, email, password, from, to, subject, body } = config;
        if (!email || !password)
            throw new Error("Email or password missing");
        const renderedBody = mustache_1.default.render(body || "", { state: ctx.state, ...ctx.state });
        const transporter = nodemailer_1.default.createTransport({
            host,
            port: port ?? 587,
            secure: secure ?? false,
            auth: {
                user: email,
                pass: password,
            },
        });
        await transporter.sendMail({
            from,
            to,
            subject,
            html: renderedBody,
        });
        ctx.logs.push(`[email] sent to ${to}`);
        return { success: true, output: `Email sent to ${to}` };
    },
};
