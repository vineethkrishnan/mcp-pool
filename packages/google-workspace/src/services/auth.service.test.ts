import { GoogleAuthService } from "./auth.service";

jest.mock("../auth/strategies/service-account.strategy");
jest.mock("@vineethnkrishnan/oauth-core", () => {
  const actual = jest.requireActual("@vineethnkrishnan/oauth-core");
  return {
    ...actual,
    OAuthStrategy: jest.fn().mockImplementation(() => ({
      getAccessToken: jest.fn().mockResolvedValue("oauth-token"),
    })),
    createTokenStore: jest.fn().mockReturnValue({
      save: jest.fn(),
      load: jest.fn().mockReturnValue(null),
      clear: jest.fn(),
      exists: jest.fn().mockReturnValue(false),
    }),
  };
});

describe("GoogleAuthService", () => {
  // Static token (backward compatibility)
  it("stores access token from config", async () => {
    const auth = new GoogleAuthService({ accessToken: "test-token-123" });
    expect(await auth.getAccessToken()).toBe("test-token-123");
  });

  it("returns same token on multiple calls", async () => {
    const auth = new GoogleAuthService({ accessToken: "my-token" });
    expect(await auth.getAccessToken()).toBe("my-token");
    expect(await auth.getAccessToken()).toBe("my-token");
  });

  it("throws when no authentication is provided", () => {
    expect(() => new GoogleAuthService({})).toThrow("Google Workspace authentication required");
  });

  it("throws with helpful message including playground URL", () => {
    expect(() => new GoogleAuthService({})).toThrow(
      "https://developers.google.com/oauthplayground/",
    );
  });

  it("accepts access token even when other config fields are present", async () => {
    const auth = new GoogleAuthService({
      accessToken: "tok",
      serviceAccountKey: "/path/to/key.json",
      delegatedUser: "user@example.com",
    });
    expect(await auth.getAccessToken()).toBe("tok");
  });

  // Strategy selection
  it("uses ServiceAccountStrategy when serviceAccountKey is provided", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ServiceAccountStrategy } = require("../auth/strategies/service-account.strategy");
    new GoogleAuthService({ serviceAccountKey: "/path/to/key.json" });
    expect(ServiceAccountStrategy).toHaveBeenCalledWith("/path/to/key.json", undefined);
  });

  it("passes delegatedUser to ServiceAccountStrategy", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ServiceAccountStrategy } = require("../auth/strategies/service-account.strategy");
    new GoogleAuthService({
      serviceAccountKey: "/path/to/key.json",
      delegatedUser: "admin@example.com",
    });
    expect(ServiceAccountStrategy).toHaveBeenCalledWith("/path/to/key.json", "admin@example.com");
  });

  it("uses OAuthStrategy when clientId and clientSecret are provided", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OAuthStrategy } = require("@vineethnkrishnan/oauth-core");
    OAuthStrategy.mockClear();
    new GoogleAuthService({ clientId: "cid", clientSecret: "csecret" });
    expect(OAuthStrategy).toHaveBeenCalledWith(
      "cid",
      "csecret",
      "https://oauth2.googleapis.com/token",
      expect.anything(),
      "google-workspace-mcp auth login",
    );
  });

  // Priority: accessToken > serviceAccountKey > clientId+clientSecret
  it("prefers accessToken over serviceAccountKey", async () => {
    const auth = new GoogleAuthService({
      accessToken: "direct-token",
      serviceAccountKey: "/path/to/key.json",
    });
    expect(await auth.getAccessToken()).toBe("direct-token");
  });

  it("prefers serviceAccountKey over clientId+clientSecret", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ServiceAccountStrategy } = require("../auth/strategies/service-account.strategy");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OAuthStrategy } = require("@vineethnkrishnan/oauth-core");
    ServiceAccountStrategy.mockClear();
    OAuthStrategy.mockClear();

    new GoogleAuthService({
      serviceAccountKey: "/path/to/key.json",
      clientId: "cid",
      clientSecret: "csecret",
    });
    expect(ServiceAccountStrategy).toHaveBeenCalled();
    expect(OAuthStrategy).not.toHaveBeenCalled();
  });
});
