import { createAuthCli } from "./auth-cli";
import { OAuthProviderConfig, TokenStore } from "../types";

jest.mock("./oauth-callback-server");
jest.mock("node:child_process", () => ({ exec: jest.fn() }));

const testConfig: OAuthProviderConfig = {
  name: "testprovider",
  authUrl: "https://auth.example.com/authorize",
  tokenUrl: "https://auth.example.com/token",
  scopes: ["read"],
  envVars: {
    staticToken: "TEST_TOKEN",
    clientId: "TEST_CLIENT_ID",
    clientSecret: "TEST_CLIENT_SECRET",
  },
};

function createMockTokenStore(): jest.Mocked<TokenStore> {
  return {
    save: jest.fn(),
    load: jest.fn().mockReturnValue(null),
    clear: jest.fn(),
    exists: jest.fn().mockReturnValue(false),
  };
}

let stderrOutput: string;
const originalWrite = process.stderr.write;

beforeEach(() => {
  stderrOutput = "";
  process.stderr.write = ((chunk: string) => {
    stderrOutput += chunk;
    return true;
  }) as typeof process.stderr.write;
});

afterEach(() => {
  process.stderr.write = originalWrite;
  delete process.env.TEST_TOKEN;
  delete process.env.TEST_CLIENT_ID;
  delete process.env.TEST_CLIENT_SECRET;
});

describe("createAuthCli", () => {
  describe("logout", () => {
    it("clears stored tokens", async () => {
      const store = createMockTokenStore();
      store.exists.mockReturnValue(true);
      const handleCli = createAuthCli(testConfig, store);

      await handleCli(["logout"]);

      expect(store.clear).toHaveBeenCalled();
      expect(stderrOutput).toContain("Stored tokens cleared");
    });

    it("reports when no tokens exist", async () => {
      const store = createMockTokenStore();
      const handleCli = createAuthCli(testConfig, store);

      await handleCli(["logout"]);

      expect(store.clear).not.toHaveBeenCalled();
      expect(stderrOutput).toContain("No stored tokens found");
    });
  });

  describe("status", () => {
    it("shows static token mode", async () => {
      process.env.TEST_TOKEN = "tok";
      const store = createMockTokenStore();
      const handleCli = createAuthCli(testConfig, store);

      await handleCli(["status"]);

      expect(stderrOutput).toContain("Static access token (TEST_TOKEN)");
    });

    it("shows stored token info", async () => {
      const store = createMockTokenStore();
      store.load.mockReturnValue({
        refreshToken: "1//refresh",
        accessToken: "ya29.access",
        expiresAt: Date.now() + 3600_000,
        clientId: "12345678901234567890.apps",
        clientSecret: "secret",
      });
      const handleCli = createAuthCli(testConfig, store);

      await handleCli(["status"]);

      expect(stderrOutput).toContain("Stored tokens: found");
      expect(stderrOutput).toContain("valid");
    });

    it("shows no tokens when none stored", async () => {
      const store = createMockTokenStore();
      const handleCli = createAuthCli(testConfig, store);

      await handleCli(["status"]);

      expect(stderrOutput).toContain("Stored tokens: none");
      expect(stderrOutput).toContain("testprovider-mcp auth login");
    });
  });

  describe("unknown command", () => {
    it("shows usage with provider name", async () => {
      const store = createMockTokenStore();
      const handleCli = createAuthCli(testConfig, store);

      await handleCli(["unknown"]);

      expect(stderrOutput).toContain("testprovider-mcp auth");
      expect(stderrOutput).toContain("login");
      expect(stderrOutput).toContain("logout");
      expect(stderrOutput).toContain("status");
    });

    it("shows usage when no subcommand given", async () => {
      const store = createMockTokenStore();
      const handleCli = createAuthCli(testConfig, store);

      await handleCli([]);

      expect(stderrOutput).toContain("Usage:");
    });
  });
});
