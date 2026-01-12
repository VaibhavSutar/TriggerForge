import nodemailer from "nodemailer";
import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const emailConnector: Connector = {
  id: "email",
  name: "Send Email (SMTP)",
  type: "action",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { host, port, secure, email, password, from, to, subject, body } = config;
    if (!email || !password) throw new Error("Email or password missing");

    const renderedBody = Mustache.render(body || "", { state: ctx.state, ...ctx.state });

    const transporter = nodemailer.createTransport({
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
