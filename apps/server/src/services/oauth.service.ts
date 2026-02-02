
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

    getGoogleAuthUrl(scopes: string[] = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/gmail.readonly"]) {
        if (!this.googleClient) throw new Error("Google OAuth not configured");
        return this.googleClient.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
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
}
