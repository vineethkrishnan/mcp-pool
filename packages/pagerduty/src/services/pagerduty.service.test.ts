import { PagerDutyService } from "./pagerduty.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("PagerDutyService", () => {
  let service: PagerDutyService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new PagerDutyService({
      apiKey: "test-api-key",
      baseUrl: "https://api.pagerduty.com",
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
  // Constructor & Auth
  // ===========================================================================

  describe("constructor", () => {
    it("normalizes base URL by removing trailing slashes", async () => {
      const svc = new PagerDutyService({
        apiKey: "key",
        baseUrl: "https://api.pagerduty.com///",
      });
      mockResponse({ incidents: [] });
      await svc.listIncidents();

      expect(getCalledUrl()).toStartWith("https://api.pagerduty.com/");
    });

    it("works with EU base URL", async () => {
      const svc = new PagerDutyService({
        apiKey: "eu-key",
        baseUrl: "https://api.eu.pagerduty.com",
      });
      mockResponse({ incidents: [] });
      await svc.listIncidents();

      expect(getCalledUrl()).toStartWith("https://api.eu.pagerduty.com/incidents");
    });
  });

  // ===========================================================================
  // Request headers
  // ===========================================================================

  describe("request headers", () => {
    it("sets correct Token token= authorization header format", async () => {
      mockResponse({ incidents: [] });
      await service.listIncidents();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Token token=test-api-key");
    });

    it("sets Content-Type header", async () => {
      mockResponse({ incidents: [] });
      await service.listIncidents();

      const headers = getCalledHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("sets Accept header for PagerDuty API v2", async () => {
      mockResponse({ incidents: [] });
      await service.listIncidents();

      const headers = getCalledHeaders();
      expect(headers["Accept"]).toBe("application/vnd.pagerduty+json;version=2");
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401 with EU hint", async () => {
      mockErrorResponse(401);
      await expect(service.listIncidents()).rejects.toThrow(
        "Authentication failed. Check your PAGERDUTY_API_KEY. If using EU, verify PAGERDUTY_BASE_URL matches your account region.",
      );
    });

    it("throws permission error on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listIncidents()).rejects.toThrow(
        "Access denied. API key may lack required permissions.",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getIncident("PXYZ")).rejects.toThrow(
        "Not found. Check the ID and ensure it exists.",
      );
    });

    it("throws rate limit error with Ratelimit-Reset on 429", async () => {
      mockErrorResponse(429, "", { "Ratelimit-Reset": "45" });
      await expect(service.listIncidents()).rejects.toThrow(
        "Rate limited by PagerDuty. Retry after 45 seconds.",
      );
    });

    it("throws rate limit error with unknown when Ratelimit-Reset is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listIncidents()).rejects.toThrow(
        "Rate limited by PagerDuty. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listIncidents()).rejects.toThrow(
        "PagerDuty API error (500): Internal Server Error",
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
      await expect(service.listIncidents()).rejects.toThrow(
        "PagerDuty API error (502): Bad Gateway",
      );
    });
  });

  // ===========================================================================
  // Incidents
  // ===========================================================================

  describe("listIncidents()", () => {
    it("calls /incidents with default params", async () => {
      mockResponse({ incidents: [{ id: "P1" }] });
      const result = await service.listIncidents();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/incidents");
      expect(url.searchParams.get("limit")).toBe("25");
      expect(url.searchParams.get("offset")).toBe("0");
      expect(result).toEqual([{ id: "P1" }]);
    });

    it("passes status filters as array params", async () => {
      mockResponse({ incidents: [] });
      await service.listIncidents(["triggered", "acknowledged"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.getAll("statuses[]")).toEqual(["triggered", "acknowledged"]);
    });

    it("passes custom limit", async () => {
      mockResponse({ incidents: [] });
      await service.listIncidents(undefined, 10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("10");
    });

    it("unwraps incidents from response envelope", async () => {
      const incidents = [{ id: "P1" }, { id: "P2" }];
      mockResponse({ incidents, more: true, limit: 25, offset: 0 });

      const result = await service.listIncidents();
      expect(result).toEqual(incidents);
    });
  });

  describe("getIncident()", () => {
    it("calls /incidents/{id} and unwraps response", async () => {
      const incident = { id: "PABC", summary: "Server down" };
      mockResponse({ incident });

      const result = await service.getIncident("PABC");

      expect(getCalledUrl()).toStartWith("https://api.pagerduty.com/incidents/PABC");
      expect(result).toEqual(incident);
    });
  });

  // ===========================================================================
  // Services
  // ===========================================================================

  describe("listServices()", () => {
    it("calls /services with default params", async () => {
      mockResponse({ services: [{ id: "SVC1" }] });
      const result = await service.listServices();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/services");
      expect(url.searchParams.get("limit")).toBe("25");
      expect(result).toEqual([{ id: "SVC1" }]);
    });

    it("passes custom limit", async () => {
      mockResponse({ services: [] });
      await service.listServices(50);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("50");
    });

    it("unwraps services from response envelope", async () => {
      const services = [{ id: "SVC1" }, { id: "SVC2" }];
      mockResponse({ services, more: false });

      const result = await service.listServices();
      expect(result).toEqual(services);
    });
  });

  describe("getService()", () => {
    it("calls /services/{id} and unwraps response", async () => {
      const svc = { id: "SVC1", name: "API Gateway" };
      mockResponse({ service: svc });

      const result = await service.getService("SVC1");

      expect(getCalledUrl()).toStartWith("https://api.pagerduty.com/services/SVC1");
      expect(result).toEqual(svc);
    });
  });

  // ===========================================================================
  // On-Call
  // ===========================================================================

  describe("listOncalls()", () => {
    it("calls /oncalls with default params", async () => {
      mockResponse({ oncalls: [{ user: { summary: "Alice" } }] });
      const result = await service.listOncalls();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/oncalls");
      expect(url.searchParams.get("limit")).toBe("25");
      expect(result).toEqual([{ user: { summary: "Alice" } }]);
    });

    it("passes schedule_ids as array params", async () => {
      mockResponse({ oncalls: [] });
      await service.listOncalls(["SCH1", "SCH2"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.getAll("schedule_ids[]")).toEqual(["SCH1", "SCH2"]);
    });

    it("unwraps oncalls from response envelope", async () => {
      const oncalls = [{ user: { summary: "Alice" } }, { user: { summary: "Bob" } }];
      mockResponse({ oncalls, more: false });

      const result = await service.listOncalls();
      expect(result).toEqual(oncalls);
    });
  });

  describe("getSchedule()", () => {
    it("calls /schedules/{id} and unwraps response", async () => {
      const schedule = { id: "SCH1", name: "Primary On-Call" };
      mockResponse({ schedule });

      const result = await service.getSchedule("SCH1");

      expect(getCalledUrl()).toStartWith("https://api.pagerduty.com/schedules/SCH1");
      expect(result).toEqual(schedule);
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
