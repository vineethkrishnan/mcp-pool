import { readFileSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import { ServiceAccountStrategy } from "./service-account.strategy";

jest.mock("node:fs");

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockFetch = jest.fn();
global.fetch = mockFetch;

const { privateKey: testPrivateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const validKeyFile = {
  type: "service_account",
  project_id: "test-project",
  private_key_id: "key-id-123",
  private_key: testPrivateKey,
  client_email: "test@test-project.iam.gserviceaccount.com",
  client_id: "123456789",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
};

function mockTokenResponse(accessToken = "sa-access-token", expiresIn = 3600) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      access_token: accessToken,
      expires_in: expiresIn,
      token_type: "Bearer",
    }),
  });
}

function mockTokenError(status: number, body = "") {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Error",
    text: async () => body,
  });
}

describe("ServiceAccountStrategy", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockReadFileSync.mockReturnValue(JSON.stringify(validKeyFile));
  });

  // Construction
  it("constructs successfully with a valid key file", () => {
    expect(() => new ServiceAccountStrategy("/path/to/key.json")).not.toThrow();
  });

  it("throws when key file has wrong type", () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ ...validKeyFile, type: "authorized_user" }));
    expect(() => new ServiceAccountStrategy("/path/to/key.json")).toThrow(
      'expected type "service_account"',
    );
  });

  it("throws when key file is missing required fields", () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ ...validKeyFile, client_email: "", private_key: "" }),
    );
    expect(() => new ServiceAccountStrategy("/path/to/key.json")).toThrow(
      "missing required fields",
    );
  });

  it("throws when key file does not exist", () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });
    expect(() => new ServiceAccountStrategy("/nonexistent.json")).toThrow("ENOENT");
  });

  // Token exchange
  it("exchanges JWT for an access token", async () => {
    const strategy = new ServiceAccountStrategy("/path/to/key.json");
    mockTokenResponse("fresh-token");

    const token = await strategy.getAccessToken();

    expect(token).toBe("fresh-token");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(options.method).toBe("POST");
    expect(options.body).toContain("grant_type=");
    expect(options.body).toContain("assertion=");
  });

  it("includes delegatedUser as sub claim in JWT", async () => {
    const strategy = new ServiceAccountStrategy("/path/to/key.json", "admin@example.com");
    mockTokenResponse();

    await strategy.getAccessToken();

    const body = mockFetch.mock.calls[0][1].body as string;
    const assertion = new URLSearchParams(body).get("assertion")!;
    const payload = JSON.parse(
      Buffer.from(
        assertion.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString(),
    );
    expect(payload.sub).toBe("admin@example.com");
  });

  // Caching
  it("caches the token and reuses it on subsequent calls", async () => {
    const strategy = new ServiceAccountStrategy("/path/to/key.json");
    mockTokenResponse("cached-token");

    const token1 = await strategy.getAccessToken();
    const token2 = await strategy.getAccessToken();

    expect(token1).toBe("cached-token");
    expect(token2).toBe("cached-token");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("refreshes the token after expiry", async () => {
    jest.useFakeTimers();
    const strategy = new ServiceAccountStrategy("/path/to/key.json");

    mockTokenResponse("token-1", 3600);
    await strategy.getAccessToken();

    // Advance past expiry (3600s - 300s buffer = 3300s effective)
    jest.advanceTimersByTime(3301_000);

    mockTokenResponse("token-2", 3600);
    const token = await strategy.getAccessToken();

    expect(token).toBe("token-2");
    expect(mockFetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  // Error handling
  it("throws on token exchange failure", async () => {
    const strategy = new ServiceAccountStrategy("/path/to/key.json");
    mockTokenError(400, '{"error":"invalid_grant"}');

    await expect(strategy.getAccessToken()).rejects.toThrow(
      "Service account token exchange failed",
    );
  });
});
