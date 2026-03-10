
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import { google } from "googleapis";

export const googleGmailConnector: Connector = {
    id: "google_gmail",
    name: "Google Gmail: Send Email",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation = "send_email", to, subject, body, userId } = config;

        // In a real app, we need to resolve the USER's access token here.
        if (!ctx.services?.oauth) {
            throw new Error("OAuth Service not available");
        }

        let auth;
        const accessToken = config.accessToken || ctx.state?.accessToken;
        if (accessToken) {
            try {
                const oauth2Client = new google.auth.OAuth2();
                oauth2Client.setCredentials({ access_token: accessToken });
                auth = oauth2Client;
            } catch (e) {
                console.error("Failed to set up google auth", e);
            }
        }

        if (!auth) {
            // Mock Mode if no auth
            if (operation === "read_emails") {
                ctx.logs.push(`[google_gmail] Mock fetching unread emails`);
                return {
                    success: true,
                    output: {
                        emails: [
                            { id: "msg_1", subject: "Invoice #1024", body: "Please find attached your recent invoice." },
                            { id: "msg_2", subject: "WIN A FREE IPHONE", body: "Click here to claim your prize now! Limited time." }
                        ]
                    }
                };
            }

            if (operation === "move_to_spam") {
                ctx.logs.push(`[google_gmail] Mock moved message ${config.messageId} to spam`);
                return { success: true, output: { message: `Moved ${config.messageId} to spam (mock)` } };
            }

            if (operation === "modify_labels") {
                ctx.logs.push(`[google_gmail] Mock modified labels for ${config.messageId} adding ${config.addLabels}`);
                return { success: true, output: { message: `Modified labels (mock)` } };
            }

            // Default to send_email
            ctx.logs.push(`[google_gmail] Mock send to ${to}`);
            return { success: true, output: { message: "Email sent (mock)" } };
        }

        const gmail = google.gmail({ version: 'v1', auth });

        try {
            if (operation === "read_emails") {
                // Fetch unread emails
                const response = await gmail.users.messages.list({
                    userId: 'me',
                    q: 'is:unread',
                    maxResults: 10,
                });

                const messages = response.data.messages || [];
                const emails = [];

                for (const msg of messages) {
                    if (msg.id) {
                        const msgData = await gmail.users.messages.get({
                            userId: 'me',
                            id: msg.id,
                            format: 'full',
                        });

                        const payload = msgData.data.payload;
                        const headers = payload?.headers || [];
                        const subjectHeader = headers.find((h: any) => h.name === 'Subject');
                        const fromHeader = headers.find((h: any) => h.name === 'From');

                        let msgBody = "";
                        if (payload?.parts && payload.parts.length > 0) {
                            const part = payload.parts.find((p: any) => p.mimeType === 'text/plain');
                            if (part && part.body && part.body.data) {
                                msgBody = Buffer.from(part.body.data, 'base64').toString('utf8');
                            }
                        } else if (payload?.body && payload.body.data) {
                            msgBody = Buffer.from(payload.body.data, 'base64').toString('utf8');
                        }

                        emails.push({
                            id: msg.id,
                            subject: subjectHeader ? subjectHeader.value : '(No Subject)',
                            from: fromHeader ? fromHeader.value : '(Unknown Sender)',
                            body: msgBody.substring(0, 500) // limit body size
                        });
                    }
                }

                ctx.logs.push(`[google_gmail] Fetched ${emails.length} unread emails`);
                return {
                    success: true,
                    output: { emails }
                };
            }

            if (operation === "move_to_spam") {
                if (!config.messageId) throw new Error("Missing messageId for move_to_spam");
                await gmail.users.messages.modify({
                    userId: 'me',
                    id: config.messageId,
                    requestBody: {
                        addLabelIds: ['SPAM'],
                        removeLabelIds: ['INBOX']
                    }
                });
                ctx.logs.push(`[google_gmail] Moved message ${config.messageId} to spam`);
                return { success: true, output: { message: `Moved ${config.messageId} to spam` } };
            }

            if (operation === "modify_labels") {
                if (!config.messageId) throw new Error("Missing messageId for modify_labels");

                const addLabels = config.addLabels ? config.addLabels.split(',').map((l: string) => l.trim()) : [];
                const removeLabels = config.removeLabels ? config.removeLabels.split(',').map((l: string) => l.trim()) : [];

                await gmail.users.messages.modify({
                    userId: 'me',
                    id: config.messageId,
                    requestBody: {
                        addLabelIds: addLabels,
                        removeLabelIds: removeLabels
                    }
                });

                ctx.logs.push(`[google_gmail] Modified labels for ${config.messageId}`);
                return { success: true, output: { message: `Modified labels for ${config.messageId}` } };
            }

            // Default: send_email
            if (!to || !subject || !body) {
                throw new Error("Missing required fields for send_email: to, subject, body");
            }

            const rawMessage = [
                `To: ${to}`,
                `Subject: ${subject}`,
                `Content-Type: text/plain; charset=utf-8`,
                '',
                body,
            ].join('\n');

            const encodedMessage = Buffer.from(rawMessage)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                },
            });

            ctx.logs.push(`[google_gmail] Email sent to ${to}`);
            return { success: true, output: { message: `Email sent to ${to}` } };

        } catch (err: any) {
            ctx.logs.push(`[google_gmail] Error: ${err.message}`);
            return { success: false, error: err.message, output: null };
        }
    }
};
