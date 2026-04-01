import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";
import { createTokenStore } from "./token-store";
import { StoredTokens } from "./types";

jest.mock("node:fs");
jest.mock("node:os", () => ({ homedir: () => "/mock-home" }));

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>;
const mockUnlinkSync = unlinkSync as jest.MockedFunction<typeof unlinkSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

const sampleTokens: StoredTokens = {
  refreshToken: "1//refresh",
  accessToken: "ya29.access",
  expiresAt: Date.now() + 3600_000,
  clientId: "client-id",
  clientSecret: "client-secret",
};

describe("createTokenStore", () => {
  beforeEach(() => jest.resetAllMocks());

  it("uses provider-specific directory", () => {
    const store = createTokenStore("hubspot");
    store.save(sampleTokens);

    expect(mockMkdirSync).toHaveBeenCalledWith("/mock-home/.mcp-pool/hubspot", {
      recursive: true,
      mode: 0o700,
    });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "/mock-home/.mcp-pool/hubspot/tokens.json",
      expect.any(String),
      { mode: 0o600 },
    );
  });

  it("isolates tokens between providers", () => {
    const hubspot = createTokenStore("hubspot");
    const notion = createTokenStore("notion");

    hubspot.save(sampleTokens);
    notion.save(sampleTokens);

    expect(mockMkdirSync).toHaveBeenCalledWith("/mock-home/.mcp-pool/hubspot", expect.anything());
    expect(mockMkdirSync).toHaveBeenCalledWith("/mock-home/.mcp-pool/notion", expect.anything());
  });

  describe("load", () => {
    it("returns parsed tokens", () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(sampleTokens));
      const store = createTokenStore("test");
      expect(store.load()).toEqual(sampleTokens);
    });

    it("returns null when file does not exist", () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("ENOENT");
      });
      const store = createTokenStore("test");
      expect(store.load()).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      mockReadFileSync.mockReturnValue("not-json");
      const store = createTokenStore("test");
      expect(store.load()).toBeNull();
    });
  });

  describe("clear", () => {
    it("deletes the tokens file", () => {
      const store = createTokenStore("test");
      store.clear();
      expect(mockUnlinkSync).toHaveBeenCalledWith("/mock-home/.mcp-pool/test/tokens.json");
    });

    it("does not throw when file does not exist", () => {
      mockUnlinkSync.mockImplementation(() => {
        throw new Error("ENOENT");
      });
      const store = createTokenStore("test");
      expect(() => store.clear()).not.toThrow();
    });
  });

  describe("exists", () => {
    it("returns true when file exists", () => {
      mockExistsSync.mockReturnValue(true);
      expect(createTokenStore("test").exists()).toBe(true);
    });

    it("returns false when file does not exist", () => {
      mockExistsSync.mockReturnValue(false);
      expect(createTokenStore("test").exists()).toBe(false);
    });
  });
});
