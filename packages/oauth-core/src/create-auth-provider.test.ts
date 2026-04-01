import { createAuthProvider } from "./create-auth-provider";
import { OAuthProviderConfig } from "./types";

jest.mock("./token-store", () => ({
  createTokenStore: () => ({
    save: jest.fn(),
    load: jest.fn().mockReturnValue(null),
    clear: jest.fn(),
    exists: jest.fn().mockReturnValue(false),
  }),
}));
jest.mock("./cli/auth-cli", () => ({
  createAuthCli: () => jest.fn(),
}));

const testConfig: OAuthProviderConfig = {
  name: "testpkg",
  authUrl: "https://auth.example.com/authorize",
  tokenUrl: "https://auth.example.com/token",
  scopes: ["read"],
  envVars: {
    staticToken: "TEST_STATIC_TOKEN",
    clientId: "TEST_CLIENT_ID",
    clientSecret: "TEST_CLIENT_SECRET",
  },
};

describe("createAuthProvider", () => {
  afterEach(() => {
    delete process.env.TEST_STATIC_TOKEN;
    delete process.env.TEST_CLIENT_ID;
    delete process.env.TEST_CLIENT_SECRET;
  });

  it("uses static token when env var is set", async () => {
    process.env.TEST_STATIC_TOKEN = "my-static-token";
    const provider = createAuthProvider(testConfig);

    expect(await provider.getAccessToken()).toBe("my-static-token");
  });

  it("throws helpful error when no auth is configured", async () => {
    const provider = createAuthProvider(testConfig);

    await expect(provider.getAccessToken()).rejects.toThrow("testpkg authentication required");
    await expect(provider.getAccessToken()).rejects.toThrow("TEST_STATIC_TOKEN");
    await expect(provider.getAccessToken()).rejects.toThrow("TEST_CLIENT_ID");
  });

  it("has handleCli function", () => {
    const provider = createAuthProvider(testConfig);
    expect(typeof provider.handleCli).toBe("function");
  });

  it("resolves strategy lazily", async () => {
    const provider = createAuthProvider(testConfig);
    // No env vars set yet — don't call getAccessToken yet
    process.env.TEST_STATIC_TOKEN = "lazy-token";

    // Strategy resolves on first call
    expect(await provider.getAccessToken()).toBe("lazy-token");
  });
});
