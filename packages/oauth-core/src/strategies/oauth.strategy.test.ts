import { OAuthStrategy } from "./oauth.strategy";
import { StoredTokens, TokenStore } from "../types";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const baseStored: StoredTokens = {
  refreshToken: "1//refresh-token",
  accessToken: "ya29.old-access",
  expiresAt: Date.now() + 3600_000,
  clientId: "client-id",
  clientSecret: "client-secret",
};

function createMockTokenStore(stored: StoredTokens | null = baseStored): jest.Mocked<TokenStore> {
  return {
    save: jest.fn(),
    load: jest.fn().mockReturnValue(stored),
    clear: jest.fn(),
    exists: jest.fn().mockReturnValue(stored !== null),
  };
}

function mockRefreshResponse(accessToken = "ya29.new-access", expiresIn = 3600) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: accessToken, expires_in: expiresIn, token_type: "Bearer" }),
  });
}

function mockRefreshError(status: number, body = "") {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Error",
    text: async () => body,
  });
}

describe("OAuthStrategy", () => {
  beforeEach(() => mockFetch.mockReset());

  it("throws when no stored tokens exist", async () => {
    const store = createMockTokenStore(null);
    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "test-mcp auth login",
    );

    await expect(strategy.getAccessToken()).rejects.toThrow(
      "No OAuth tokens found. Run `test-mcp auth login`",
    );
  });

  it("returns stored access token when still valid", async () => {
    const store = createMockTokenStore({ ...baseStored, expiresAt: Date.now() + 3600_000 });
    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "test-mcp auth login",
    );

    expect(await strategy.getAccessToken()).toBe("ya29.old-access");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes token when expired", async () => {
    const store = createMockTokenStore({ ...baseStored, expiresAt: Date.now() - 1000 });
    mockRefreshResponse("ya29.refreshed");

    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "test-mcp auth login",
    );
    expect(await strategy.getAccessToken()).toBe("ya29.refreshed");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com/token");
  });

  it("persists updated tokens after refresh", async () => {
    const store = createMockTokenStore({ ...baseStored, expiresAt: Date.now() - 1000 });
    mockRefreshResponse("ya29.persisted");

    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "test-mcp auth login",
    );
    await strategy.getAccessToken();

    expect(store.save).toHaveBeenCalledTimes(1);
    expect(store.save.mock.calls[0][0].accessToken).toBe("ya29.persisted");
  });

  it("caches token in memory", async () => {
    const store = createMockTokenStore({ ...baseStored, expiresAt: Date.now() + 3600_000 });
    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "test-mcp auth login",
    );

    await strategy.getAccessToken();
    await strategy.getAccessToken();
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it("throws on revoked refresh token", async () => {
    const store = createMockTokenStore({ ...baseStored, expiresAt: Date.now() - 1000 });
    mockRefreshError(400);

    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "my-mcp auth login",
    );
    await expect(strategy.getAccessToken()).rejects.toThrow(
      "Run `my-mcp auth login` to re-authenticate",
    );
  });

  it("throws on server error with status", async () => {
    const store = createMockTokenStore({ ...baseStored, expiresAt: Date.now() - 1000 });
    mockRefreshError(500, "Internal Server Error");

    const strategy = new OAuthStrategy(
      "cid",
      "csecret",
      "https://example.com/token",
      store,
      "test-mcp auth login",
    );
    await expect(strategy.getAccessToken()).rejects.toThrow("OAuth token refresh failed (500)");
  });
});
