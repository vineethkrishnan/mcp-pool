import { LinearService } from "./linear.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("LinearService", () => {
  let service: LinearService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new LinearService({
      tokenProvider: { getAccessToken: jest.fn().mockResolvedValue("lin_api_test123") },
    });
  });

  function mockGraphQLResponse(data: unknown, errors?: unknown[]) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data, errors }),
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

  function getCalledBody(): { query: string; variables?: Record<string, unknown> } {
    return JSON.parse(mockFetch.mock.calls[0][1].body);
  }

  function getCalledHeaders(): Record<string, string> {
    return mockFetch.mock.calls[0][1].headers;
  }

  function getCalledUrl(): string {
    return mockFetch.mock.calls[0][0] as string;
  }

  // ===========================================================================
  // Request configuration
  // ===========================================================================

  describe("request configuration", () => {
    it("posts to the Linear GraphQL endpoint", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues();

      expect(getCalledUrl()).toBe("https://api.linear.app/graphql");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    });

    it("sends Authorization header without Bearer prefix", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("lin_api_test123");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("sends query and variables in the request body", async () => {
      mockGraphQLResponse({ issue: { id: "i1" } });
      await service.getIssue("ENG-123");

      const body = getCalledBody();
      expect(body.query).toContain("GetIssue");
      expect(body.variables).toEqual({ id: "ENG-123" });
    });
  });

  // ===========================================================================
  // HTTP error handling
  // ===========================================================================

  describe("HTTP error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listIssues()).rejects.toThrow(
        "Authentication failed. Check your LINEAR_API_KEY.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "60" });
      await expect(service.listIssues()).rejects.toThrow(
        "Rate limited by Linear. Retry after 60 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listIssues()).rejects.toThrow(
        "Rate limited by Linear. Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listIssues()).rejects.toThrow(
        "Linear API error (500): Internal Server Error",
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
      await expect(service.listIssues()).rejects.toThrow("Linear API error (502): Bad Gateway");
    });
  });

  // ===========================================================================
  // GraphQL error handling
  // ===========================================================================

  describe("GraphQL error handling", () => {
    it("throws when response contains GraphQL errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: null,
          errors: [{ message: "Entity not found", extensions: { code: "ENTITY_NOT_FOUND" } }],
        }),
      });

      await expect(service.getIssue("bad-id")).rejects.toThrow(
        "Linear GraphQL error: Entity not found",
      );
    });

    it("joins multiple GraphQL error messages", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: null,
          errors: [{ message: "Error one" }, { message: "Error two" }],
        }),
      });

      await expect(service.getIssue("bad-id")).rejects.toThrow(
        "Linear GraphQL error: Error one; Error two",
      );
    });

    it("throws when response has no data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await expect(service.listIssues()).rejects.toThrow("Linear API returned no data.");
    });
  });

  // ===========================================================================
  // Issues
  // ===========================================================================

  describe("listIssues()", () => {
    it("sends issues query with default limit", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues();

      const body = getCalledBody();
      expect(body.query).toContain("issues(first: 25");
    });

    it("returns issues connection data", async () => {
      const issuesData = {
        nodes: [{ id: "i1", identifier: "ENG-1", title: "Fix bug" }],
      };
      mockGraphQLResponse({ issues: issuesData });

      const result = await service.listIssues();
      expect(result).toEqual(issuesData);
    });

    it("includes team filter when teamId is provided", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues("team-uuid-123");

      const body = getCalledBody();
      expect(body.query).toContain('team: { id: { eq: "team-uuid-123" } }');
    });

    it("includes status filter when status is provided", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues(undefined, "In Progress");

      const body = getCalledBody();
      expect(body.query).toContain('state: { name: { eqCaseInsensitive: "In Progress" } }');
    });

    it("includes both team and status filters when both are provided", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues("team-id", "Done", 10);

      const body = getCalledBody();
      expect(body.query).toContain("team: { id: { eq:");
      expect(body.query).toContain("state: { name: { eqCaseInsensitive:");
      expect(body.query).toContain("first: 10");
    });

    it("respects custom limit", async () => {
      mockGraphQLResponse({ issues: { nodes: [] } });
      await service.listIssues(undefined, undefined, 50);

      const body = getCalledBody();
      expect(body.query).toContain("first: 50");
    });
  });

  describe("getIssue()", () => {
    it("sends issue query with ID variable", async () => {
      const issue = { id: "i1", identifier: "ENG-1", title: "Fix bug" };
      mockGraphQLResponse({ issue });

      const result = await service.getIssue("ENG-1");

      const body = getCalledBody();
      expect(body.query).toContain("GetIssue");
      expect(body.variables).toEqual({ id: "ENG-1" });
      expect(result).toEqual(issue);
    });

    it("works with UUID format", async () => {
      const issue = { id: "uuid-123" };
      mockGraphQLResponse({ issue });

      await service.getIssue("uuid-123");

      const body = getCalledBody();
      expect(body.variables).toEqual({ id: "uuid-123" });
    });
  });

  describe("searchIssues()", () => {
    it("sends search query with variables", async () => {
      const searchResult = { nodes: [{ id: "i1", title: "Match" }] };
      mockGraphQLResponse({ searchIssues: searchResult });

      const result = await service.searchIssues("bug fix", 10);

      const body = getCalledBody();
      expect(body.query).toContain("SearchIssues");
      expect(body.variables).toEqual({ query: "bug fix", first: 10 });
      expect(result).toEqual(searchResult);
    });

    it("uses default limit of 25", async () => {
      mockGraphQLResponse({ searchIssues: { nodes: [] } });
      await service.searchIssues("test");

      const body = getCalledBody();
      expect(body.variables).toEqual({ query: "test", first: 25 });
    });
  });

  // ===========================================================================
  // Projects
  // ===========================================================================

  describe("listProjects()", () => {
    it("sends projects query with limit variable", async () => {
      const projectsData = { nodes: [{ id: "p1", name: "Alpha" }] };
      mockGraphQLResponse({ projects: projectsData });

      const result = await service.listProjects(10);

      const body = getCalledBody();
      expect(body.query).toContain("ListProjects");
      expect(body.variables).toEqual({ first: 10 });
      expect(result).toEqual(projectsData);
    });

    it("uses default limit of 25", async () => {
      mockGraphQLResponse({ projects: { nodes: [] } });
      await service.listProjects();

      const body = getCalledBody();
      expect(body.variables).toEqual({ first: 25 });
    });
  });

  describe("getProject()", () => {
    it("sends project query with ID variable", async () => {
      const project = { id: "p1", name: "Alpha" };
      mockGraphQLResponse({ project });

      const result = await service.getProject("p1");

      const body = getCalledBody();
      expect(body.query).toContain("GetProject");
      expect(body.variables).toEqual({ id: "p1" });
      expect(result).toEqual(project);
    });
  });

  // ===========================================================================
  // Teams
  // ===========================================================================

  describe("listTeams()", () => {
    it("sends teams query with limit variable", async () => {
      const teamsData = { nodes: [{ id: "t1", name: "Engineering", key: "ENG" }] };
      mockGraphQLResponse({ teams: teamsData });

      const result = await service.listTeams(5);

      const body = getCalledBody();
      expect(body.query).toContain("ListTeams");
      expect(body.variables).toEqual({ first: 5 });
      expect(result).toEqual(teamsData);
    });

    it("uses default limit of 25", async () => {
      mockGraphQLResponse({ teams: { nodes: [] } });
      await service.listTeams();

      const body = getCalledBody();
      expect(body.variables).toEqual({ first: 25 });
    });
  });
});
