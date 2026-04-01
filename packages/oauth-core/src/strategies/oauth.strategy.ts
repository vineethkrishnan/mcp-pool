import { TokenProvider, CachedToken, TokenResponse, TokenStore } from "../types";

const REFRESH_BUFFER_MS = 300_000;

export class OAuthStrategy implements TokenProvider {
  private cachedToken: CachedToken | null = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly tokenUrl: string,
    private readonly tokenStore: TokenStore,
    private readonly cliCommand: string,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const stored = this.tokenStore.load();
    if (!stored) {
      throw new Error(`No OAuth tokens found. Run \`${this.cliCommand}\` to authenticate.`);
    }

    if (
      stored.accessToken &&
      stored.expiresAt &&
      Date.now() < stored.expiresAt - REFRESH_BUFFER_MS
    ) {
      this.cachedToken = { accessToken: stored.accessToken, expiresAt: stored.expiresAt };
      return stored.accessToken;
    }

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: stored.refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 400) {
        throw new Error(
          `OAuth refresh token is invalid or revoked. Run \`${this.cliCommand}\` to re-authenticate.`,
        );
      }
      throw new Error(
        `OAuth token refresh failed (${response.status}): ${errorBody || response.statusText}`,
      );
    }

    const data = (await response.json()) as TokenResponse;
    const expiresAt = Date.now() + data.expires_in * 1000;

    this.cachedToken = { accessToken: data.access_token, expiresAt };

    this.tokenStore.save({
      ...stored,
      accessToken: data.access_token,
      expiresAt,
    });

    return data.access_token;
  }
}
