import { GoogleAuthService } from "./auth.service";

describe("GoogleAuthService", () => {
  it("stores access token from config", async () => {
    const auth = new GoogleAuthService({ accessToken: "test-token-123" });
    const token = await auth.getAccessToken();
    expect(token).toBe("test-token-123");
  });

  it("returns same token on multiple calls", async () => {
    const auth = new GoogleAuthService({ accessToken: "my-token" });
    const token1 = await auth.getAccessToken();
    const token2 = await auth.getAccessToken();
    expect(token1).toBe(token2);
    expect(token1).toBe("my-token");
  });

  it("throws when no access token is provided", () => {
    expect(() => new GoogleAuthService({})).toThrow(
      "Google Workspace authentication required. Set GOOGLE_ACCESS_TOKEN environment variable.",
    );
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
    const token = await auth.getAccessToken();
    expect(token).toBe("tok");
  });
});
