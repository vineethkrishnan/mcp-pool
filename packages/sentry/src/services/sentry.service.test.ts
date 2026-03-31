import { SentryService } from "./sentry.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("SentryService", () => {
  let service: SentryService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new SentryService({
      authToken: "test-token",
      baseUrl: "https://sentry.io",
      org: "test-org",
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

  // =========================================================================
  // Constructor
  // =========================================================================

  describe("constructor", () => {
    it("normalizes base URL by removing trailing slashes", async () => {
      const svc = new SentryService({
        authToken: "tok",
        baseUrl: "https://sentry.io///",
        org: "org",
      });
      mockResponse([]);
      await svc.listOrganizations();

      expect(getCalledUrl()).toStartWith("https://sentry.io/api/0/");
    });

    it("works with self-hosted base URL", async () => {
      const svc = new SentryService({
        authToken: "tok",
        baseUrl: "https://sentry.mycompany.com",
        org: "my-org",
      });
      mockResponse([]);
      await svc.listOrganizations();

      expect(getCalledUrl()).toBe("https://sentry.mycompany.com/api/0/organizations/");
    });
  });

  // =========================================================================
  // Request headers
  // =========================================================================

  describe("request()", () => {
    it("sets correct Authorization bearer header", async () => {
      mockResponse([]);
      await service.listOrganizations();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listOrganizations()).rejects.toThrow(
        "Authentication failed. Check your SENTRY_AUTH_TOKEN.",
      );
    });

    it("throws scope hint on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listOrganizations()).rejects.toThrow(
        "Access denied. Token may lack required scopes (org:read, project:read, event:read).",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getIssue("999")).rejects.toThrow(
        "Not found. Check the ID and ensure you have access.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "30" });
      await expect(service.listOrganizations()).rejects.toThrow(
        "Rate limited by Sentry. Retry after 30 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listOrganizations()).rejects.toThrow(
        "Rate limited by Sentry. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listOrganizations()).rejects.toThrow(
        "Sentry API error (500): Internal Server Error",
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
      await expect(service.listOrganizations()).rejects.toThrow(
        "Sentry API error (502): Bad Gateway",
      );
    });
  });

  // =========================================================================
  // Organization resolution
  // =========================================================================

  describe("resolveOrg", () => {
    it("uses default org from config", async () => {
      mockResponse([]);
      await service.listProjects();
      expect(getCalledUrl()).toContain("/organizations/test-org/projects/");
    });

    it("uses parameter org over default", async () => {
      mockResponse([]);
      await service.listProjects("override-org");
      expect(getCalledUrl()).toContain("/organizations/override-org/projects/");
    });

    it("throws when no org is available", async () => {
      const noOrgService = new SentryService({
        authToken: "tok",
        baseUrl: "https://sentry.io",
      });
      await expect(noOrgService.listProjects()).rejects.toThrow(
        "Organization is required. Set SENTRY_ORG environment variable or pass the org parameter.",
      );
    });
  });

  // =========================================================================
  // Organizations
  // =========================================================================

  describe("listOrganizations()", () => {
    it("calls correct endpoint and returns data", async () => {
      const orgs = [{ slug: "org-1" }, { slug: "org-2" }];
      mockResponse(orgs);

      const result = await service.listOrganizations();

      expect(getCalledUrl()).toBe("https://sentry.io/api/0/organizations/");
      expect(result).toEqual(orgs);
    });
  });

  // =========================================================================
  // Projects
  // =========================================================================

  describe("listProjects()", () => {
    it("calls correct endpoint with resolved org", async () => {
      const projects = [{ slug: "my-project" }];
      mockResponse(projects);

      const result = await service.listProjects();

      expect(getCalledUrl()).toBe("https://sentry.io/api/0/organizations/test-org/projects/");
      expect(result).toEqual(projects);
    });
  });

  // =========================================================================
  // Issues
  // =========================================================================

  describe("getIssue()", () => {
    it("calls correct endpoint with issue ID", async () => {
      const issue = { id: "12345", title: "TypeError" };
      mockResponse(issue);

      const result = await service.getIssue("12345");

      expect(getCalledUrl()).toBe("https://sentry.io/api/0/issues/12345/");
      expect(result).toEqual(issue);
    });
  });

  describe("listIssues()", () => {
    it("calls correct endpoint with project and default limit", async () => {
      mockResponse([]);
      await service.listIssues("my-project");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/0/projects/test-org/my-project/issues/");
      expect(url.searchParams.get("per_page")).toBe("25");
    });

    it("includes query and sort params when provided", async () => {
      mockResponse([]);
      await service.listIssues("my-project", undefined, "is:unresolved", "date", 10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("query")).toBe("is:unresolved");
      expect(url.searchParams.get("sort")).toBe("date");
      expect(url.searchParams.get("per_page")).toBe("10");
    });

    it("uses explicit org over default", async () => {
      mockResponse([]);
      await service.listIssues("proj", "custom-org");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/0/projects/custom-org/proj/issues/");
    });
  });

  describe("searchIssues()", () => {
    it("calls correct endpoint with query and default limit", async () => {
      mockResponse([]);
      await service.searchIssues("TypeError");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/0/organizations/test-org/issues/");
      expect(url.searchParams.get("query")).toBe("TypeError");
      expect(url.searchParams.get("per_page")).toBe("25");
    });

    it("respects custom limit and org", async () => {
      mockResponse([]);
      await service.searchIssues("ReferenceError", "other-org", 5);

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/0/organizations/other-org/issues/");
      expect(url.searchParams.get("per_page")).toBe("5");
    });
  });

  // =========================================================================
  // Events
  // =========================================================================

  describe("getEvent()", () => {
    it("calls correct endpoint with event ID, project, and org", async () => {
      const event = { eventID: "abc123" };
      mockResponse(event);

      const result = await service.getEvent("abc123", "my-project");

      expect(getCalledUrl()).toBe(
        "https://sentry.io/api/0/projects/test-org/my-project/events/abc123/",
      );
      expect(result).toEqual(event);
    });

    it("uses explicit org parameter", async () => {
      mockResponse({});
      await service.getEvent("evt-1", "proj", "custom-org");

      expect(getCalledUrl()).toBe("https://sentry.io/api/0/projects/custom-org/proj/events/evt-1/");
    });
  });

  describe("listIssueEvents()", () => {
    it("calls correct endpoint with issue ID and default limit", async () => {
      mockResponse([]);
      await service.listIssueEvents("12345");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/api/0/issues/12345/events/");
      expect(url.searchParams.get("per_page")).toBe("25");
    });

    it("respects custom limit", async () => {
      mockResponse([]);
      await service.listIssueEvents("12345", 50);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("per_page")).toBe("50");
    });
  });

  describe("getLatestEvent()", () => {
    it("calls correct endpoint with issue ID", async () => {
      const event = { eventID: "latest-evt" };
      mockResponse(event);

      const result = await service.getLatestEvent("12345");

      expect(getCalledUrl()).toBe("https://sentry.io/api/0/issues/12345/events/latest/");
      expect(result).toEqual(event);
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
