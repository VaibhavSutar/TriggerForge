
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";
import { google } from "googleapis";

export const googleGmailConnector: Connector = {
    id: "google_gmail",
    name: "Google Gmail: Send Email",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        let { operation = "send_email", to, subject, body, userId, messageId, addLabels, removeLabels } = config;

        // Global Smart Fallback: Resolve fields from ctx.input or ctx.item if missing in config
        const input = ctx.input || {};
        const item = ctx.item || {};
        if (!messageId) messageId = input.id || input.messageId || item.id || item.messageId;

        if (operation === "send_email") {
            if (!to) to = input.to;
            if (!subject) subject = input.subject;
            if (!body) body = input.body;
        }
        if (!ctx.services?.oauth) {
            throw new Error("OAuth Service not available");
        }

        let auth;
        const accessToken = config.accessToken || ctx.state?.connections?.google?.accessToken || ctx.state?.accessToken;
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
                const q = config.query || "is:unread";
                ctx.logs.push(`[google_gmail] Mock fetching emails with query: "${q}"`);
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
                const q = config.query || "is:unread";
                ctx.logs.push(`[google_gmail] Fetching emails with query: "${q}"`);
                
                const response = await gmail.users.messages.list({
                    userId: 'me',
                    q: q,
                    maxResults: config.maxResults || 10,
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

                ctx.logs.push(`[google_gmail] Fetched ${emails.length} emails`);
                return {
                    success: true,
                    output: { emails }
                };
            }

            if (operation === "move_to_spam") {
                if (!messageId) throw new Error("Missing messageId for move_to_spam");
                await gmail.users.messages.modify({
                    userId: 'me',
                    id: messageId,
                    requestBody: {
                        addLabelIds: ['SPAM'],
                        removeLabelIds: ['INBOX']
                    }
                });
                ctx.logs.push(`[google_gmail] Moved message ${messageId} to spam`);
                return { success: true, output: { message: `Moved ${messageId} to spam` } };
            }

            if (operation === "modify_labels") {
                if (!messageId) throw new Error("Missing messageId for modify_labels");

                const parseLabels = (val: any) => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === "string") {
                        const trimmed = val.trim();
                        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                            try {
                                return JSON.parse(trimmed);
                            } catch (e) {
                                // Fallback to split if JSON parse fails
                            }
                        }
                        return trimmed.split(',').map((l: string) => l.trim()).filter(Boolean);
                    }
                    return [];
                };

                try {
                    // 1. Fetch current labels to map Names -> IDs
                    const labelsList = await gmail.users.labels.list({ userId: 'me' });
                    const existingLabels = labelsList.data.labels || [];
                    const nameToId: Record<string, string> = {};
                    existingLabels.forEach(l => {
                        if (l.name && l.id) nameToId[l.name.toLowerCase()] = l.id;
                        if (l.id) nameToId[l.id.toLowerCase()] = l.id; // Also map ID to ID for compatibility
                    });

                    const resolveLabelIds = async (names: string[]) => {
                        const ids: string[] = [];
                        for (const name of names) {
                            const normalized = name.trim();
                            if (!normalized) continue;

                            // Check if we already have an ID for this name (case-insensitive)
                            if (nameToId[normalized.toLowerCase()]) {
                                ids.push(nameToId[normalized.toLowerCase()]);
                            } else {
                                // CREATE the label if it doesn't exist!
                                try {
                                    ctx.logs.push(`[google_gmail] Creating new label: "${normalized}"`);
                                    const newLabel = await gmail.users.labels.create({
                                        userId: 'me',
                                        requestBody: {
                                            name: normalized,
                                            labelListVisibility: 'labelShow',
                                            messageListVisibility: 'show'
                                        }
                                    });
                                    if (newLabel.data.id) {
                                        const newId = newLabel.data.id;
                                        ids.push(newId);
                                        nameToId[normalized.toLowerCase()] = newId; // Cache it
                                    }
                                } catch (createErr: any) {
                                    ctx.logs.push(`[google_gmail] Warning: Could not create label "${normalized}": ${createErr.message}`);
                                }
                            }
                        }
                        return ids;
                    };

                    const labelsToAdd = await resolveLabelIds(parseLabels(addLabels));
                    const labelsToRemove = await resolveLabelIds(parseLabels(removeLabels));

                    if (labelsToAdd.length === 0 && labelsToRemove.length === 0) {
                        return { success: true, output: { message: "No labels to update" } };
                    }

                    const modifyResponse = await gmail.users.messages.modify({
                        userId: 'me',
                        id: messageId,
                        requestBody: {
                            addLabelIds: labelsToAdd,
                            removeLabelIds: labelsToRemove
                        }
                    });

                    ctx.logs.push(`[google_gmail] Modified labels for ${messageId}`);
                    return { success: true, output: { message: `Modified labels for ${messageId}` } };
                } catch (err: any) {
                    throw err;
                }
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
