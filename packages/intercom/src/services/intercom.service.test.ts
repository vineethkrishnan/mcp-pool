import { IntercomService } from "./intercom.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("IntercomService", () => {
  let service: IntercomService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new IntercomService({ accessToken: "test-token" });
  });

  function mockResponse(data: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: "OK",
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: {
        get: () => null,
      },
    });
  }

  function mockErrorResponse(status: number, body = "", headers: Record<string, string> = {}) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText: "Error",
      json: async () => ({}),
      text: async () => body,
      headers: {
        get: (name: string) => headers[name] ?? null,
      },
    });
  }

  function getCalledUrl(): string {
    return mockFetch.mock.calls[0][0] as string;
  }

  function getCalledOptions(): RequestInit {
    return mockFetch.mock.calls[0][1] as RequestInit;
  }

  function getCalledHeaders(): Record<string, string> {
    return getCalledOptions().headers as Record<string, string>;
  }

  // =========================================================================
  // Request headers
  // =========================================================================

  describe("request headers", () => {
    it("sets Authorization bearer header", async () => {
      mockResponse({ conversations: [] });
      await service.listConversations();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
    });

    it("sets Content-Type header", async () => {
      mockResponse({ conversations: [] });
      await service.listConversations();

      const headers = getCalledHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("sets Intercom-Version header to 2.11", async () => {
      mockResponse({ conversations: [] });
      await service.listConversations();

      const headers = getCalledHeaders();
      expect(headers["Intercom-Version"]).toBe("2.11");
    });

    it("sets Accept header", async () => {
      mockResponse({ conversations: [] });
      await service.listConversations();

      const headers = getCalledHeaders();
      expect(headers["Accept"]).toBe("application/json");
    });

    it("sets Intercom-Version header on POST requests", async () => {
      mockResponse({ conversations: [] });
      await service.searchConversations("test");

      const headers = getCalledHeaders();
      expect(headers["Intercom-Version"]).toBe("2.11");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listConversations()).rejects.toThrow(
        "Authentication failed. Check your INTERCOM_ACCESS_TOKEN.",
      );
    });

    it("throws scope hint on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listConversations()).rejects.toThrow(
        "Access denied. Token may lack required scopes (read conversations, read contacts).",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getConversation("999")).rejects.toThrow(
        "Not found. Check the ID and ensure you have access.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "30" });
      await expect(service.listConversations()).rejects.toThrow(
        "Rate limited by Intercom. Retry after 30 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listConversations()).rejects.toThrow(
        "Rate limited by Intercom. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listConversations()).rejects.toThrow(
        "Intercom API error (500): Internal Server Error",
      );
    });

    it("falls back to statusText when error body is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: async () => ({}),
        text: async () => "",
        headers: { get: () => null },
      });
      await expect(service.listConversations()).rejects.toThrow(
        "Intercom API error (502): Bad Gateway",
      );
    });

    it("handles error on POST requests", async () => {
      mockErrorResponse(401);
      await expect(service.searchConversations("test")).rejects.toThrow(
        "Authentication failed. Check your INTERCOM_ACCESS_TOKEN.",
      );
    });
  });

  // =========================================================================
  // Conversations
  // =========================================================================

  describe("listConversations()", () => {
    it("calls correct endpoint with default limit", async () => {
      mockResponse({ conversations: [] });
      await service.listConversations();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/conversations");
      expect(url.searchParams.get("per_page")).toBe("20");
    });

    it("respects custom limit", async () => {
      mockResponse({ conversations: [] });
      await service.listConversations(50);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("per_page")).toBe("50");
    });
  });

  describe("getConversation()", () => {
    it("calls correct endpoint with conversation ID", async () => {
      const conversation = { id: "123", state: "open" };
      mockResponse(conversation);

      const result = await service.getConversation("123");

      expect(getCalledUrl()).toBe("https://api.intercom.io/conversations/123");
      expect(result).toEqual(conversation);
    });
  });

  describe("searchConversations()", () => {
    it("calls POST /conversations/search with query body", async () => {
      mockResponse({ conversations: [] });
      await service.searchConversations("billing issue");

      expect(getCalledUrl()).toBe("https://api.intercom.io/conversations/search");
      expect(getCalledOptions().method).toBe("POST");

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.query.field).toBe("source.body");
      expect(body.query.operator).toBe("~");
      expect(body.query.value).toBe("billing issue");
      expect(body.pagination.per_page).toBe(20);
    });

    it("respects custom limit", async () => {
      mockResponse({ conversations: [] });
      await service.searchConversations("test", 10);

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.pagination.per_page).toBe(10);
    });
  });

  // =========================================================================
  // Contacts
  // =========================================================================

  describe("listContacts()", () => {
    it("calls correct endpoint with default limit", async () => {
      mockResponse({ data: [] });
      await service.listContacts();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/contacts");
      expect(url.searchParams.get("per_page")).toBe("50");
    });

    it("respects custom limit", async () => {
      mockResponse({ data: [] });
      await service.listContacts(10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("per_page")).toBe("10");
    });
  });

  describe("getContact()", () => {
    it("calls correct endpoint with contact ID", async () => {
      const contact = { id: "c1", email: "alice@example.com" };
      mockResponse(contact);

      const result = await service.getContact("c1");

      expect(getCalledUrl()).toBe("https://api.intercom.io/contacts/c1");
      expect(result).toEqual(contact);
    });
  });

  describe("searchContacts()", () => {
    it("calls POST /contacts/search with query body", async () => {
      mockResponse({ data: [] });
      await service.searchContacts("alice@example.com");

      expect(getCalledUrl()).toBe("https://api.intercom.io/contacts/search");
      expect(getCalledOptions().method).toBe("POST");

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.query.field).toBe("email");
      expect(body.query.operator).toBe("~");
      expect(body.query.value).toBe("alice@example.com");
      expect(body.pagination.per_page).toBe(50);
    });

    it("respects custom limit", async () => {
      mockResponse({ data: [] });
      await service.searchContacts("test", 5);

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.pagination.per_page).toBe(5);
    });
  });
});
