import { VercelService } from "./vercel.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("VercelService", () => {
  let service: VercelService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new VercelService({
      token: "test-token",
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
  // Request headers
  // ===========================================================================

  describe("request()", () => {
    it("sets correct Authorization bearer header", async () => {
      mockResponse({ projects: [] });
      await service.listProjects();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  // ===========================================================================
  // Team ID inclusion
  // ===========================================================================

  describe("teamId", () => {
    it("does not include teamId when not configured", async () => {
      mockResponse({ projects: [] });
      await service.listProjects();

      const url = new URL(getCalledUrl());
      expect(url.searchParams.has("teamId")).toBe(false);
    });

    it("includes teamId when configured", async () => {
      const teamService = new VercelService({
        token: "test-token",
        teamId: "team_abc123",
      });
      mockResponse({ projects: [] });
      await teamService.listProjects();

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("teamId")).toBe("team_abc123");
    });

    it("includes teamId alongside other params", async () => {
      const teamService = new VercelService({
        token: "test-token",
        teamId: "team_abc123",
      });
      mockResponse({ deployments: [] });
      await teamService.listDeployments("prj_123", 10);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("teamId")).toBe("team_abc123");
      expect(url.searchParams.get("projectId")).toBe("prj_123");
      expect(url.searchParams.get("limit")).toBe("10");
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listProjects()).rejects.toThrow(
        "Authentication failed. Check your VERCEL_TOKEN.",
      );
    });

    it("throws access denied on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listProjects()).rejects.toThrow(
        "Access denied. Token may lack required scopes, or you may not have access to this team.",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getProject("nonexistent")).rejects.toThrow(
        "Not found. Check the ID and ensure you have access.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "30" });
      await expect(service.listProjects()).rejects.toThrow(
        "Rate limited by Vercel. Retry after 30 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listProjects()).rejects.toThrow(
        "Rate limited by Vercel. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listProjects()).rejects.toThrow(
        "Vercel API error (500): Internal Server Error",
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
      await expect(service.listProjects()).rejects.toThrow("Vercel API error (502): Bad Gateway");
    });
  });

  // ===========================================================================
  // Projects
  // ===========================================================================

  describe("listProjects()", () => {
    it("calls correct endpoint with default limit", async () => {
      const responseData = { projects: [{ id: "prj_1" }] };
      mockResponse(responseData);

      const result = await service.listProjects();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/v9/projects");
      expect(url.searchParams.get("limit")).toBe("20");
      expect(result).toEqual(responseData);
    });

    it("respects custom limit", async () => {
      mockResponse({ projects: [] });
      await service.listProjects(5);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("5");
    });
  });

  describe("getProject()", () => {
    it("calls correct endpoint with project ID", async () => {
      const project = { id: "prj_123", name: "my-app" };
      mockResponse(project);

      const result = await service.getProject("prj_123");

      expect(getCalledUrl()).toContain("/v9/projects/prj_123");
      expect(result).toEqual(project);
    });
  });

  // ===========================================================================
  // Deployments
  // ===========================================================================

  describe("listDeployments()", () => {
    it("calls correct endpoint with default limit and no projectId", async () => {
      mockResponse({ deployments: [] });
      await service.listDeployments();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/v6/deployments");
      expect(url.searchParams.get("limit")).toBe("20");
      expect(url.searchParams.has("projectId")).toBe(false);
    });

    it("includes projectId when provided", async () => {
      mockResponse({ deployments: [] });
      await service.listDeployments("prj_123");

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("projectId")).toBe("prj_123");
    });

    it("respects custom limit", async () => {
      mockResponse({ deployments: [] });
      await service.listDeployments(undefined, 50);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("50");
      expect(url.searchParams.has("projectId")).toBe(false);
    });
  });

  describe("getDeployment()", () => {
    it("calls correct endpoint with deployment ID", async () => {
      const deployment = { id: "dpl_abc", state: "READY" };
      mockResponse(deployment);

      const result = await service.getDeployment("dpl_abc");

      expect(getCalledUrl()).toContain("/v13/deployments/dpl_abc");
      expect(result).toEqual(deployment);
    });
  });

  describe("getDeploymentBuildLogs()", () => {
    it("calls correct endpoint with deployment ID", async () => {
      const events = [{ type: "build", text: "Compiling..." }];
      mockResponse(events);

      const result = await service.getDeploymentBuildLogs("dpl_abc");

      expect(getCalledUrl()).toContain("/v2/deployments/dpl_abc/events");
      expect(result).toEqual(events);
    });
  });
});
