import { SheetsService } from "./sheets.service";
import { GoogleAuthService } from "./auth.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("./auth.service");

describe("SheetsService", () => {
  let service: SheetsService;
  let mockAuth: jest.Mocked<GoogleAuthService>;

  beforeEach(() => {
    mockFetch.mockReset();
    mockAuth = new GoogleAuthService({ accessToken: "fake" }) as jest.Mocked<GoogleAuthService>;
    mockAuth.getAccessToken = jest.fn().mockResolvedValue("test-token");
    service = new SheetsService(mockAuth);
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

  function getCalledUrl(): string {
    return mockFetch.mock.calls[0][0] as string;
  }

  function getCalledHeaders(): Record<string, string> {
    return mockFetch.mock.calls[0][1].headers;
  }

  // =========================================================================
  // Auth header
  // =========================================================================

  describe("request()", () => {
    it("sets correct Authorization bearer header", async () => {
      mockResponse({ spreadsheetId: "abc", properties: { title: "Test" }, sheets: [] });
      await service.getSpreadsheet("abc");

      const headers = getCalledHeaders();
      expect(headers["Authorization"]).toBe("Bearer test-token");
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws on 401", async () => {
      mockErrorResponse(401);
      await expect(service.getSpreadsheet("abc")).rejects.toThrow("Sheets authentication failed");
    });

    it("throws on 403", async () => {
      mockErrorResponse(403);
      await expect(service.getSpreadsheet("abc")).rejects.toThrow("Sheets access denied");
    });

    it("throws on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getSpreadsheet("bad-id")).rejects.toThrow("Spreadsheet not found");
    });

    it("throws on 429", async () => {
      mockErrorResponse(429);
      await expect(service.getSpreadsheet("abc")).rejects.toThrow("Sheets API rate limit exceeded");
    });

    it("throws generic error on 500", async () => {
      mockErrorResponse(500, "Server Error");
      await expect(service.getSpreadsheet("abc")).rejects.toThrow("Sheets API error (500)");
    });
  });

  // =========================================================================
  // getSpreadsheet
  // =========================================================================

  describe("getSpreadsheet()", () => {
    it("calls correct endpoint with spreadsheet ID", async () => {
      mockResponse({
        spreadsheetId: "sheet-123",
        properties: { title: "Budget Tracker" },
        sheets: [
          {
            properties: {
              sheetId: 0,
              title: "Sheet1",
              index: 0,
              gridProperties: { rowCount: 100, columnCount: 26 },
            },
          },
        ],
      });

      const result = (await service.getSpreadsheet("sheet-123")) as Record<string, unknown>;

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/v4/spreadsheets/sheet-123");
      expect(url.searchParams.has("fields")).toBe(true);
      expect(result.spreadsheetId).toBe("sheet-123");
      expect(result.title).toBe("Budget Tracker");
      expect((result.sheets as unknown[]).length).toBe(1);
    });

    it("handles missing properties", async () => {
      mockResponse({ spreadsheetId: "abc", sheets: [] });
      const result = (await service.getSpreadsheet("abc")) as Record<string, unknown>;
      expect(result.title).toBe("(untitled)");
    });
  });

  // =========================================================================
  // getSheetValues
  // =========================================================================

  describe("getSheetValues()", () => {
    it("calls correct endpoint with spreadsheet ID and range", async () => {
      mockResponse({
        range: "Sheet1!A1:D10",
        majorDimension: "ROWS",
        values: [
          ["Name", "Age", "City"],
          ["Alice", "30", "NYC"],
        ],
      });

      const result = (await service.getSheetValues("sheet-123", "Sheet1!A1:D10")) as Record<
        string,
        unknown
      >;

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/v4/spreadsheets/sheet-123/values/Sheet1!A1%3AD10");
      expect(result.range).toBe("Sheet1!A1:D10");
      expect((result.values as unknown[][]).length).toBe(2);
    });

    it("returns empty values when no data", async () => {
      mockResponse({ range: "Sheet1!A1:Z100" });
      const result = (await service.getSheetValues("abc", "Sheet1!A1:Z100")) as Record<
        string,
        unknown
      >;
      expect(result.values).toEqual([]);
    });
  });

  // =========================================================================
  // listSheets
  // =========================================================================

  describe("listSheets()", () => {
    it("calls correct endpoint and returns sheet list", async () => {
      mockResponse({
        sheets: [
          {
            properties: {
              sheetId: 0,
              title: "Summary",
              index: 0,
              gridProperties: { rowCount: 50, columnCount: 10 },
            },
          },
          {
            properties: {
              sheetId: 1,
              title: "Data",
              index: 1,
              gridProperties: { rowCount: 1000, columnCount: 26 },
            },
          },
        ],
      });

      const result = (await service.listSheets("sheet-123")) as {
        sheets: Array<Record<string, unknown>>;
      };

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/v4/spreadsheets/sheet-123");
      expect(result.sheets).toHaveLength(2);
      expect(result.sheets[0].title).toBe("Summary");
      expect(result.sheets[1].title).toBe("Data");
    });

    it("returns empty array when no sheets", async () => {
      mockResponse({ sheets: undefined });
      const result = (await service.listSheets("abc")) as { sheets: unknown[] };
      expect(result.sheets).toEqual([]);
    });
  });
});
