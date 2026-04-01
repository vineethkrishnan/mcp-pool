import { readFileSync } from "node:fs";
import { TokenProvider, CachedToken, TokenResponse } from "@vineethnkrishnan/oauth-core";
import { createSignedJwt } from "../jwt";

export interface ServiceAccountKeyFile {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
].join(" ");

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 300_000;

export class ServiceAccountStrategy implements TokenProvider {
  private readonly keyData: ServiceAccountKeyFile;
  private readonly delegatedUser?: string;
  private cachedToken: CachedToken | null = null;

  constructor(keyFilePath: string, delegatedUser?: string) {
    const raw = readFileSync(keyFilePath, "utf-8");
    this.keyData = JSON.parse(raw) as ServiceAccountKeyFile;

    if (this.keyData.type !== "service_account") {
      throw new Error(
        `Invalid service account key file: expected type "service_account", got "${this.keyData.type}"`,
      );
    }
    if (!this.keyData.client_email || !this.keyData.private_key) {
      throw new Error(
        "Service account key file missing required fields: client_email, private_key",
      );
    }

    this.delegatedUser = delegatedUser;
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const now = Math.floor(Date.now() / 1000);
    const jwt = createSignedJwt(
      {
        iss: this.keyData.client_email,
        scope: GOOGLE_SCOPES,
        aud: this.keyData.token_uri || "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        ...(this.delegatedUser ? { sub: this.delegatedUser } : {}),
      },
      this.keyData.private_key,
    );

    const tokenUrl = this.keyData.token_uri || "https://oauth2.googleapis.com/token";
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${encodeURIComponent(jwt)}`,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Service account token exchange failed (${response.status}): ${errorBody || response.statusText}`,
      );
    }

    const data = (await response.json()) as TokenResponse;
    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - REFRESH_BUFFER_MS,
    };

    return this.cachedToken.accessToken;
  }
}
