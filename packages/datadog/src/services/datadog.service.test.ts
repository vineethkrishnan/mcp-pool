import { DatadogService } from "./datadog.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("DatadogService", () => {
  let service: DatadogService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new DatadogService({
      apiKey: "test-api-key",
      appKey: "test-app-key",
      site: "datadoghq.com",
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

  function getCalledHeaders(): Record<string, string> {
    return mockFetch.mock.calls[0][1].headers;
  }

  // ===========================================================================
  // Constructor / Multi-site URL construction
  // ===========================================================================

  describe("constructor", () => {
    it("constructs US1 base URL from datadoghq.com", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "datadoghq.com",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.datadoghq.com/api/v1/");
    });

    it("constructs EU base URL from datadoghq.eu", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "datadoghq.eu",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.datadoghq.eu/api/v1/");
    });

    it("constructs US3 base URL from us3.datadoghq.com", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "us3.datadoghq.com",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.us3.datadoghq.com/api/v1/");
    });

    it("constructs US5 base URL from us5.datadoghq.com", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "us5.datadoghq.com",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.us5.datadoghq.com/api/v1/");
    });

    it("constructs AP1 base URL from ap1.datadoghq.com", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "ap1.datadoghq.com",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.ap1.datadoghq.com/api/v1/");
    });

    it("constructs GOV base URL from ddog-gov.com", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "ddog-gov.com",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.ddog-gov.com/api/v1/");
    });

    it("removes trailing slashes from site", async () => {
      const svc = new DatadogService({
        apiKey: "k",
        appKey: "k",
        site: "datadoghq.com///",
      });
      mockResponse([]);
      await svc.listMonitors();

      expect(getCalledUrl()).toStartWith("https://api.datadoghq.com/api/v1/");
    });
  });

  // ===========================================================================
  // Request headers
  // ===========================================================================

  describe("request()", () => {
    it("sets correct DD-API-KEY and DD-APPLICATION-KEY headers", async () => {
      mockResponse([]);
      await service.listMonitors();

      const headers = getCalledHeaders();
      expect(headers["DD-API-KEY"]).toBe("test-api-key");
      expect(headers["DD-APPLICATION-KEY"]).toBe("test-app-key");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listMonitors()).rejects.toThrow(
        "Authentication failed. Check your DD_API_KEY.",
      );
    });

    it("throws scope hint on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listMonitors()).rejects.toThrow(
        "Access denied. Check your DD_APP_KEY permissions.",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getMonitor(999)).rejects.toThrow(
        "Not found. Check the ID and ensure the resource exists in your DD_SITE region.",
      );
    });

    it("throws rate limit error with X-RateLimit-Reset on 429", async () => {
      mockErrorResponse(429, "", { "X-RateLimit-Reset": "30" });
      await expect(service.listMonitors()).rejects.toThrow(
        "Rate limited by Datadog. Retry after 30 seconds.",
      );
    });

    it("throws rate limit error with unknown when header is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listMonitors()).rejects.toThrow(
        "Rate limited by Datadog. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listMonitors()).rejects.toThrow(
        "Datadog API error (500): Internal Server Error",
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
      await expect(service.listMonitors()).rejects.toThrow("Datadog API error (502): Bad Gateway");
    });
  });

  // ===========================================================================
  // Empty string param filtering
  // ===========================================================================

  describe("empty string param filtering", () => {
    it("excludes params with empty string values from the URL", async () => {
      mockResponse([]);
      await service.listMonitors("", 25);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.has("query")).toBe(false);
      expect(url.searchParams.get("page_size")).toBe("25");
    });
  });

  // ===========================================================================
  // Monitors
  // ===========================================================================

  describe("listMonitors()", () => {
    it("calls correct v1 endpoint and returns data", async () => {
      const monitors = [{ id: 1, name: "CPU Alert" }];
      mockResponse(monitors);

      const result = await service.listMonitors();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/v1/monitor");
      expect(url.searchParams.get("page_size")).toBe("25");
      expect(result).toEqual(monitors);
    });

    it("includes query parameter when provided", async () => {
      mockResponse([]);
      await service.listMonitors("status:alert", 10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("query")).toBe("status:alert");
      expect(url.searchParams.get("page_size")).toBe("10");
    });
  });

  describe("getMonitor()", () => {
    it("calls correct endpoint with monitor ID", async () => {
      const monitor = { id: 12345, name: "Disk Monitor" };
      mockResponse(monitor);

      const result = await service.getMonitor(12345);

      expect(getCalledUrl()).toContain("/api/v1/monitor/12345");
      expect(result).toEqual(monitor);
    });
  });

  describe("searchMonitors()", () => {
    it("calls correct endpoint with query and default limit", async () => {
      const searchResult = { monitors: [], metadata: { total_count: 0 } };
      mockResponse(searchResult);

      const result = await service.searchMonitors("type:metric");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/v1/monitor/search");
      expect(url.searchParams.get("query")).toBe("type:metric");
      expect(url.searchParams.get("per_page")).toBe("25");
      expect(result).toEqual(searchResult);
    });

    it("respects custom limit", async () => {
      mockResponse({ monitors: [] });
      await service.searchMonitors("status:alert", 50);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("per_page")).toBe("50");
    });
  });

  // ===========================================================================
  // Metrics
  // ===========================================================================

  describe("queryMetrics()", () => {
    it("calls correct v1 endpoint with query, from, and to", async () => {
      const metricsResult = { series: [{ metric: "cpu", pointlist: [] }] };
      mockResponse(metricsResult);

      const result = await service.queryMetrics("avg:system.cpu.user{*}", 1000, 2000);

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/v1/query");
      expect(url.searchParams.get("query")).toBe("avg:system.cpu.user{*}");
      expect(url.searchParams.get("from")).toBe("1000");
      expect(url.searchParams.get("to")).toBe("2000");
      expect(result).toEqual(metricsResult);
    });
  });

  // ===========================================================================
  // Events
  // ===========================================================================

  describe("listEvents()", () => {
    it("calls correct v2 endpoint with filter params", async () => {
      const eventsResult = { data: [{ id: "evt-1" }] };
      mockResponse(eventsResult);

      const result = await service.listEvents(1000, 2000, 10);

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/v2/events");
      expect(url.searchParams.get("filter[from]")).toBe("1000");
      expect(url.searchParams.get("filter[to]")).toBe("2000");
      expect(url.searchParams.get("page[limit]")).toBe("10");
      expect(result).toEqual(eventsResult);
    });

    it("uses default limit of 25", async () => {
      mockResponse({ data: [] });
      await service.listEvents(1000, 2000);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("page[limit]")).toBe("25");
    });
  });

  describe("getEvent()", () => {
    it("calls correct v2 endpoint with event ID", async () => {
      const event = { data: { id: "evt-123", attributes: { title: "Deploy" } } };
      mockResponse(event);

      const result = await service.getEvent(123);

      expect(getCalledUrl()).toContain("/api/v2/events/123");
      expect(result).toEqual(event);
    });
  });

  // ===========================================================================
  // Version routing
  // ===========================================================================

  describe("version routing", () => {
    it("uses v1 for monitors", async () => {
      mockResponse([]);
      await service.listMonitors();
      expect(getCalledUrl()).toContain("/api/v1/monitor");
    });

    it("uses v1 for metrics", async () => {
      mockResponse({});
      await service.queryMetrics("avg:cpu{*}", 1000, 2000);
      expect(getCalledUrl()).toContain("/api/v1/query");
    });

    it("uses v2 for events", async () => {
      mockResponse({});
      await service.listEvents(1000, 2000);
      expect(getCalledUrl()).toContain("/api/v2/events");
    });
  });
});

// Custom matcher for string prefix check
expect.extend({
  toStartWith(received: string, prefix: string) {
    const pass = received.startsWith(prefix);
    return {
      pass,
      message: () => `expected "${received}" to start with "${prefix}"`,
    };
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toStartWith(prefix: string): R;
    }
  }
}
