import { NotionService } from "./notion.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("NotionService", () => {
  let service: NotionService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new NotionService({
      apiKey: "secret_test-token",
      notionVersion: "2022-06-28",
    });
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
    return (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
  }

  // =========================================================================
  // Request headers
  // =========================================================================

  describe("request()", () => {
    it("sets correct Authorization, Notion-Version, and Content-Type headers", async () => {
      mockResponse({ results: [] });
      await service.search("test");

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer secret_test-token");
      expect(headers["Notion-Version"]).toBe("2022-06-28");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("uses custom Notion-Version from config", async () => {
      const customService = new NotionService({
        apiKey: "secret_tok",
        notionVersion: "2023-08-01",
      });
      mockResponse({ results: [] });
      await customService.search();

      const headers = getCalledHeaders();
      expect(headers["Notion-Version"]).toBe("2023-08-01");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.search("test")).rejects.toThrow(
        "Authentication failed. Check your NOTION_API_KEY.",
      );
    });

    it("throws access denied on 403", async () => {
      mockErrorResponse(403);
      await expect(service.getPage("abc")).rejects.toThrow(
        "Access denied. Ensure the Notion integration is connected to this page/database via the 'Connect to' menu.",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getPage("abc")).rejects.toThrow(
        "Not found. The page/database may not exist or may not be shared with your integration.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "30" });
      await expect(service.search("test")).rejects.toThrow(
        "Rate limited by Notion. Retry after 30 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.search("test")).rejects.toThrow(
        "Rate limited by Notion. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.search("test")).rejects.toThrow(
        "Notion API error (500): Internal Server Error",
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
      await expect(service.search("test")).rejects.toThrow("Notion API error (502): Bad Gateway");
    });
  });

  // =========================================================================
  // Search
  // =========================================================================

  describe("search()", () => {
    it("calls POST /search with query and default limit", async () => {
      const mockResult = { results: [{ id: "page1" }] };
      mockResponse(mockResult);

      const result = await service.search("roadmap");

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/search");
      expect(getCalledOptions().method).toBe("POST");
      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.query).toBe("roadmap");
      expect(body.page_size).toBe(10);
      expect(result).toEqual(mockResult);
    });

    it("includes filter when provided", async () => {
      mockResponse({ results: [] });
      await service.search("test", { property: "object", value: "page" });

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.filter).toEqual({ property: "object", value: "page" });
    });

    it("respects custom limit capped at 100", async () => {
      mockResponse({ results: [] });
      await service.search("test", undefined, 200);

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.page_size).toBe(100);
    });

    it("works without query parameter", async () => {
      mockResponse({ results: [] });
      await service.search();

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.query).toBeUndefined();
      expect(body.page_size).toBe(10);
    });
  });

  // =========================================================================
  // Pages
  // =========================================================================

  describe("getPage()", () => {
    it("calls GET /pages/{id}", async () => {
      const page = { id: "page-123", properties: {} };
      mockResponse(page);

      const result = await service.getPage("page-123");

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/pages/page-123");
      expect(getCalledOptions().method).toBe("GET");
      expect(result).toEqual(page);
    });
  });

  describe("getPageContent()", () => {
    it("fetches top-level blocks", async () => {
      mockResponse({
        results: [
          { id: "block-1", type: "paragraph", has_children: false },
          { id: "block-2", type: "heading_1", has_children: false },
        ],
        has_more: false,
      });

      const result = await service.getPageContent("page-1");

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/blocks/page-1/children?page_size=100");
      expect(result).toHaveLength(2);
      expect((result[0] as Record<string, unknown>)._depth).toBe(0);
    });

    it("recursively fetches child blocks", async () => {
      // Top-level blocks
      mockResponse({
        results: [{ id: "block-1", type: "toggle", has_children: true }],
        has_more: false,
      });
      // Children of block-1
      mockResponse({
        results: [{ id: "block-1-1", type: "paragraph", has_children: false }],
        has_more: false,
      });

      const result = await service.getPageContent("page-1");

      expect(result).toHaveLength(2);
      expect((result[0] as Record<string, unknown>)._depth).toBe(0);
      expect((result[1] as Record<string, unknown>)._depth).toBe(1);
    });

    it("respects max depth limit", async () => {
      // Top-level
      mockResponse({
        results: [{ id: "b1", type: "toggle", has_children: true }],
        has_more: false,
      });
      // Depth 1
      mockResponse({
        results: [{ id: "b2", type: "toggle", has_children: true }],
        has_more: false,
      });
      // Should NOT fetch depth 2 with maxDepth=1
      const result = await service.getPageContent("page-1", 1);

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("respects max blocks limit", async () => {
      const manyBlocks = Array.from({ length: 50 }, (_, i) => ({
        id: `b-${i}`,
        type: "paragraph",
        has_children: false,
      }));
      mockResponse({ results: manyBlocks, has_more: false });

      const result = await service.getPageContent("page-1", 3, 10);
      expect(result).toHaveLength(10);
    });
  });

  // =========================================================================
  // Databases
  // =========================================================================

  describe("getDatabase()", () => {
    it("calls GET /databases/{id}", async () => {
      const db = { id: "db-123", title: [{ plain_text: "Tasks" }] };
      mockResponse(db);

      const result = await service.getDatabase("db-123");

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/databases/db-123");
      expect(getCalledOptions().method).toBe("GET");
      expect(result).toEqual(db);
    });
  });

  describe("queryDatabase()", () => {
    it("calls POST /databases/{id}/query with default limit", async () => {
      const queryResult = { results: [{ id: "entry-1" }] };
      mockResponse(queryResult);

      const result = await service.queryDatabase("db-123");

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/databases/db-123/query");
      expect(getCalledOptions().method).toBe("POST");
      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.page_size).toBe(25);
      expect(result).toEqual(queryResult);
    });

    it("includes filter and sorts when provided", async () => {
      mockResponse({ results: [] });
      const filter = { property: "Status", select: { equals: "Done" } };
      const sorts = [{ property: "Created", direction: "descending" }];

      await service.queryDatabase("db-123", filter, sorts, 50);

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.filter).toEqual(filter);
      expect(body.sorts).toEqual(sorts);
      expect(body.page_size).toBe(50);
    });

    it("caps limit at 100", async () => {
      mockResponse({ results: [] });
      await service.queryDatabase("db-123", undefined, undefined, 200);

      const body = JSON.parse(getCalledOptions().body as string);
      expect(body.page_size).toBe(100);
    });
  });

  // =========================================================================
  // Users
  // =========================================================================

  describe("listUsers()", () => {
    it("calls GET /users with default limit", async () => {
      const users = { results: [{ id: "user-1", name: "Alice" }] };
      mockResponse(users);

      const result = await service.listUsers();

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/users?page_size=25");
      expect(getCalledOptions().method).toBe("GET");
      expect(result).toEqual(users);
    });

    it("respects custom limit capped at 100", async () => {
      mockResponse({ results: [] });
      await service.listUsers(200);

      expect(getCalledUrl()).toBe("https://api.notion.com/v1/users?page_size=100");
    });
  });
});
