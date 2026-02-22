
import { google } from "googleapis";

export class OAuthService {
    private googleClient;

    constructor(
        private config: {
            googleClientId?: string;
            googleClientSecret?: string;
            redirectUri?: string;
        }
    ) {
        if (config.googleClientId && config.googleClientSecret) {
            this.googleClient = new google.auth.OAuth2(
                config.googleClientId,
                config.googleClientSecret,
                config.redirectUri || "http://localhost:4000/auth/google/callback"
            );
        }
    }

    getGoogleAuthUrl(scopes: string[] = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive.readonly"
    ]) {
        if (!this.googleClient) throw new Error("Google OAuth not configured");
        return this.googleClient.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent", // Force refresh token
        });
    }

    async exchangeGoogleCode(code: string) {
        if (!this.googleClient) throw new Error("Google OAuth not configured");
        const { tokens } = await this.googleClient.getToken(code);
        return tokens;
    }

    async getGoogleClient(accessToken: string, refreshToken?: string) {
        if (!this.googleClient) throw new Error("Google OAuth not configured");

        const client = new google.auth.OAuth2(
            this.config.googleClientId,
            this.config.googleClientSecret
        );
        client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
        return client;
    }

    async listFiles(accessToken: string, refreshToken?: string, mimeType?: string) {
        const auth = await this.getGoogleClient(accessToken, refreshToken);
        const drive = google.drive({ version: 'v3', auth });

        // Filter by mimeType if provided, and restrict to non-trashed files
        let q = "trashed = false";
        if (mimeType) {
            // "mimeType = 'application/vnd.google-apps.spreadsheet'" for Sheets
            // "mimeType = 'application/vnd.google-apps.document'" for Docs
            q += ` and mimeType = '${mimeType}'`;
        }

        const res = await drive.files.list({
            q,
            fields: 'files(id, name, mimeType)',
            pageSize: 20
        });

        return res.data.files || [];
    }

    async getSheetsClient(accessToken: string, refreshToken?: string) {
        const auth = await this.getGoogleClient(accessToken, refreshToken);
        return google.sheets({ version: 'v4', auth });
    }

    async getDocsClient(accessToken: string, refreshToken?: string) {
        const auth = await this.getGoogleClient(accessToken, refreshToken);
        return google.docs({ version: 'v1', auth });
    }
}
