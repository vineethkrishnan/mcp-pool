import { GmailService } from "./gmail.service";
import { GoogleAuthService } from "./auth.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("./auth.service");

describe("GmailService", () => {
  let service: GmailService;
  let mockAuth: jest.Mocked<GoogleAuthService>;

  beforeEach(() => {
    mockFetch.mockReset();
    mockAuth = new GoogleAuthService({ accessToken: "fake" }) as jest.Mocked<GoogleAuthService>;
    mockAuth.getAccessToken = jest.fn().mockResolvedValue("test-token");
    service = new GmailService(mockAuth);
  });

  function mockResponse(data: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: "OK",
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: { get: () => null },
    });
  }

  function mockErrorResponse(status: number, body = "") {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText: "Error",
      json: async () => ({}),
      text: async () => body,
      headers: { get: () => null },
    });
  }

  function getCalledUrl(callIndex = 0): string {
    return mockFetch.mock.calls[callIndex][0] as string;
  }

  function getCalledHeaders(callIndex = 0): Record<string, string> {
    return mockFetch.mock.calls[callIndex][1].headers;
  }

  // =========================================================================
  // Auth header
  // =========================================================================

  describe("request()", () => {
    it("sets correct Authorization bearer header", async () => {
      mockResponse({ messages: [] });
      await service.listMessages();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listMessages()).rejects.toThrow("Gmail authentication failed");
    });

    it("throws on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listMessages()).rejects.toThrow("Gmail access denied");
    });

    it("throws on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getMessage("bad-id")).rejects.toThrow("Gmail resource not found");
    });

    it("throws on 429", async () => {
      mockErrorResponse(429);
      await expect(service.listMessages()).rejects.toThrow("Gmail API rate limit exceeded");
    });

    it("throws generic error on 500", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listMessages()).rejects.toThrow("Gmail API error (500)");
    });
  });

  // =========================================================================
  // listMessages
  // =========================================================================

  describe("listMessages()", () => {
    it("calls correct endpoint with default params", async () => {
      mockResponse({ messages: [] });
      await service.listMessages();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/gmail/v1/users/me/messages");
      expect(url.searchParams.get("maxResults")).toBe("10");
    });

    it("includes query param when provided", async () => {
      mockResponse({ messages: [] });
      await service.listMessages("is:unread", 5);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("q")).toBe("is:unread");
      expect(url.searchParams.get("maxResults")).toBe("5");
    });

    it("returns empty messages when none found", async () => {
      mockResponse({ messages: undefined, resultSizeEstimate: 0 });
      const result = await service.listMessages();
      expect(result).toEqual({ messages: [], resultSizeEstimate: 0 });
    });

    it("fetches metadata for each message in the list", async () => {
      // First call: list
      mockResponse({
        messages: [
          { id: "msg-1", threadId: "t-1" },
          { id: "msg-2", threadId: "t-2" },
        ],
        resultSizeEstimate: 2,
      });
      // Second call: metadata for msg-1
      mockResponse({
        id: "msg-1",
        threadId: "t-1",
        snippet: "Hello...",
        payload: {
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "Subject", value: "Test" },
          ],
        },
      });
      // Third call: metadata for msg-2
      mockResponse({
        id: "msg-2",
        threadId: "t-2",
        snippet: "World...",
        payload: {
          headers: [
            { name: "From", value: "bob@example.com" },
            { name: "Subject", value: "Re: Test" },
          ],
        },
      });

      const result = (await service.listMessages()) as {
        messages: unknown[];
        resultSizeEstimate: number;
      };
      expect(result.messages).toHaveLength(2);
      expect(result.resultSizeEstimate).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  // =========================================================================
  // getMessage
  // =========================================================================

  describe("getMessage()", () => {
    it("calls correct endpoint with message ID", async () => {
      mockResponse({
        id: "msg-1",
        threadId: "t-1",
        snippet: "Hello",
        labelIds: ["INBOX"],
        payload: {
          mimeType: "text/plain",
          headers: [
            { name: "From", value: "alice@example.com" },
            { name: "Subject", value: "Test" },
          ],
          body: {
            data: Buffer.from("Email body text").toString("base64url"),
          },
        },
      });

      const result = (await service.getMessage("msg-1")) as Record<string, unknown>;

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/gmail/v1/users/me/messages/msg-1");
      expect(url.searchParams.get("format")).toBe("full");
      expect(result.id).toBe("msg-1");
      expect(result.body).toBe("Email body text");
      expect(result.labelIds).toEqual(["INBOX"]);
    });
  });

  // =========================================================================
  // searchMessages
  // =========================================================================

  describe("searchMessages()", () => {
    it("delegates to listMessages with query", async () => {
      mockResponse({ messages: [] });
      await service.searchMessages("from:boss@company.com", 20);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("q")).toBe("from:boss@company.com");
      expect(url.searchParams.get("maxResults")).toBe("20");
    });
  });
});
