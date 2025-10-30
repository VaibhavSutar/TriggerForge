import nodemailer from "nodemailer";
import Mustache from "mustache";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

export const emailConnector: Connector = {
  id: "email",
  name: "Send Email (SMTP)",
  type: "action",

  async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
    const { smtp, from, to, subject, body } = config;
    if (!smtp || !smtp.host) throw new Error("SMTP configuration missing");

    const renderedBody = Mustache.render(body || "", { state: ctx.state, ...ctx.state });

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port ?? 587,
      secure: smtp.secure ?? false,
      auth: smtp.auth
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html: renderedBody
    });

    ctx.logs.push(`[email] sent to ${to}`);
    return { success: true, output: `Email sent to ${to}` };
  }
};
