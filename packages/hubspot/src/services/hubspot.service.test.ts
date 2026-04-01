import { HubSpotService } from "./hubspot.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("HubSpotService", () => {
  let service: HubSpotService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new HubSpotService({
      tokenProvider: { getAccessToken: jest.fn().mockResolvedValue("test-token") },
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

  // ===========================================================================
  // Request headers
  // ===========================================================================

  describe("request()", () => {
    it("sets correct Authorization bearer header", async () => {
      mockResponse({ results: [] });
      await service.listContacts();

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("uses https://api.hubapi.com as base URL", async () => {
      mockResponse({ results: [] });
      await service.listContacts();

      expect(getCalledUrl()).toContain("https://api.hubapi.com");
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe("error handling", () => {
    it("throws descriptive error on 401", async () => {
      mockErrorResponse(401);
      await expect(service.listContacts()).rejects.toThrow(
        "Authentication failed. Check your HUBSPOT_ACCESS_TOKEN.",
      );
    });

    it("throws scope hint on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listContacts()).rejects.toThrow(
        "Access denied. Token may lack required scopes (crm.objects.contacts.read, crm.objects.deals.read).",
      );
    });

    it("throws not found on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getContact("999")).rejects.toThrow(
        "Not found. Check the ID and ensure you have access.",
      );
    });

    it("throws rate limit error with Retry-After on 429", async () => {
      mockErrorResponse(429, "", { "Retry-After": "10" });
      await expect(service.listContacts()).rejects.toThrow(
        "Rate limited by HubSpot (100 requests/10 seconds). Retry after 10 seconds.",
      );
    });

    it("throws rate limit error with unknown when Retry-After is missing", async () => {
      mockErrorResponse(429);
      await expect(service.listContacts()).rejects.toThrow(
        "Rate limited by HubSpot (100 requests/10 seconds). Retry after unknown seconds.",
      );
    });

    it("throws generic error with body on 5xx", async () => {
      mockErrorResponse(500, "Internal Server Error");
      await expect(service.listContacts()).rejects.toThrow(
        "HubSpot API error (500): Internal Server Error",
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
      await expect(service.listContacts()).rejects.toThrow("HubSpot API error (502): Bad Gateway");
    });
  });

  // ===========================================================================
  // Contacts
  // ===========================================================================

  describe("listContacts()", () => {
    it("calls correct endpoint with default properties and limit", async () => {
      mockResponse({ results: [] });
      await service.listContacts();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/crm/v3/objects/contacts");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.getAll("properties")).toContain("firstname");
      expect(url.searchParams.getAll("properties")).toContain("email");
    });

    it("respects custom limit and properties", async () => {
      mockResponse({ results: [] });
      await service.listContacts(20, ["email", "phone"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("20");
      expect(url.searchParams.getAll("properties")).toEqual(["email", "phone"]);
    });

    it("includes after parameter for pagination", async () => {
      mockResponse({ results: [] });
      await service.listContacts(10, undefined, "cursor123");

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("after")).toBe("cursor123");
    });

    it("returns response data", async () => {
      const data = { results: [{ id: "1", properties: { firstname: "John" } }] };
      mockResponse(data);

      const result = await service.listContacts();
      expect(result).toEqual(data);
    });
  });

  describe("getContact()", () => {
    it("calls correct endpoint with contact ID and default properties", async () => {
      mockResponse({ id: "123", properties: {} });
      await service.getContact("123");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/crm/v3/objects/contacts/123");
      expect(url.searchParams.getAll("properties")).toContain("firstname");
    });

    it("includes associations parameter when provided", async () => {
      mockResponse({ id: "123", properties: {} });
      await service.getContact("123", undefined, ["companies", "deals"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.getAll("associations")).toEqual(["companies", "deals"]);
    });

    it("uses custom properties when provided", async () => {
      mockResponse({ id: "123", properties: {} });
      await service.getContact("123", ["email"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.getAll("properties")).toEqual(["email"]);
    });
  });

  describe("searchContacts()", () => {
    it("sends POST request to search endpoint with query", async () => {
      mockResponse({ results: [] });
      await service.searchContacts("John");

      const url = getCalledUrl();
      expect(url).toBe("https://api.hubapi.com/crm/v3/objects/contacts/search");

      const options = getCalledOptions();
      expect(options.method).toBe("POST");

      const body = JSON.parse(options.body as string);
      expect(body.query).toBe("John");
      expect(body.limit).toBe(10);
      expect(body.properties).toContain("firstname");
    });

    it("respects custom properties and limit", async () => {
      mockResponse({ results: [] });
      await service.searchContacts("test", ["email"], 5);

      const options = getCalledOptions();
      const body = JSON.parse(options.body as string);
      expect(body.properties).toEqual(["email"]);
      expect(body.limit).toBe(5);
    });
  });

  // ===========================================================================
  // Deals
  // ===========================================================================

  describe("listDeals()", () => {
    it("calls correct endpoint with default properties and limit", async () => {
      mockResponse({ results: [] });
      await service.listDeals();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/crm/v3/objects/deals");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.getAll("properties")).toContain("dealname");
      expect(url.searchParams.getAll("properties")).toContain("amount");
    });

    it("respects custom limit and after cursor", async () => {
      mockResponse({ results: [] });
      await service.listDeals(50, undefined, "abc");

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("50");
      expect(url.searchParams.get("after")).toBe("abc");
    });
  });

  describe("getDeal()", () => {
    it("calls correct endpoint with deal ID", async () => {
      mockResponse({ id: "456", properties: {} });
      await service.getDeal("456");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/crm/v3/objects/deals/456");
      expect(url.searchParams.getAll("properties")).toContain("dealname");
    });

    it("includes associations when provided", async () => {
      mockResponse({ id: "456", properties: {} });
      await service.getDeal("456", undefined, ["contacts", "companies"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.getAll("associations")).toEqual(["contacts", "companies"]);
    });
  });

  // ===========================================================================
  // Companies
  // ===========================================================================

  describe("listCompanies()", () => {
    it("calls correct endpoint with default properties and limit", async () => {
      mockResponse({ results: [] });
      await service.listCompanies();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/crm/v3/objects/companies");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.getAll("properties")).toContain("name");
      expect(url.searchParams.getAll("properties")).toContain("domain");
    });

    it("respects custom limit and properties", async () => {
      mockResponse({ results: [] });
      await service.listCompanies(30, ["name", "industry"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("limit")).toBe("30");
      expect(url.searchParams.getAll("properties")).toEqual(["name", "industry"]);
    });
  });

  describe("getCompany()", () => {
    it("calls correct endpoint with company ID", async () => {
      mockResponse({ id: "789", properties: {} });
      await service.getCompany("789");

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/crm/v3/objects/companies/789");
      expect(url.searchParams.getAll("properties")).toContain("name");
    });

    it("includes associations when provided", async () => {
      mockResponse({ id: "789", properties: {} });
      await service.getCompany("789", undefined, ["contacts", "deals"]);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.getAll("associations")).toEqual(["contacts", "deals"]);
    });
  });
});
