import { DriveService } from "./drive.service";
import { GoogleAuthService } from "./auth.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("./auth.service");

describe("DriveService", () => {
  let service: DriveService;
  let mockAuth: jest.Mocked<GoogleAuthService>;

  beforeEach(() => {
    mockFetch.mockReset();
    mockAuth = new GoogleAuthService({ accessToken: "fake" }) as jest.Mocked<GoogleAuthService>;
    mockAuth.getAccessToken = jest.fn().mockResolvedValue("test-token");
    service = new DriveService(mockAuth);
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
      mockResponse({ files: [] });
      await service.listFiles();

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
      await expect(service.listFiles()).rejects.toThrow("Drive authentication failed");
    });

    it("throws on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listFiles()).rejects.toThrow("Drive access denied");
    });

    it("throws on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getFile("bad-id")).rejects.toThrow("Drive resource not found");
    });

    it("throws on 429", async () => {
      mockErrorResponse(429);
      await expect(service.listFiles()).rejects.toThrow("Drive API rate limit exceeded");
    });

    it("throws generic error on 500", async () => {
      mockErrorResponse(500, "Server Error");
      await expect(service.listFiles()).rejects.toThrow("Drive API error (500)");
    });
  });

  // =========================================================================
  // listFiles
  // =========================================================================

  describe("listFiles()", () => {
    it("calls correct endpoint with default params", async () => {
      mockResponse({ files: [] });
      await service.listFiles();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/drive/v3/files");
      expect(url.searchParams.get("pageSize")).toBe("10");
      expect(url.searchParams.has("fields")).toBe(true);
    });

    it("includes query param when provided", async () => {
      mockResponse({ files: [] });
      await service.listFiles("name contains 'report'", 20);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("q")).toBe("name contains 'report'");
      expect(url.searchParams.get("pageSize")).toBe("20");
    });

    it("returns empty array when no files", async () => {
      mockResponse({ files: undefined });
      const result = (await service.listFiles()) as { files: unknown[] };
      expect(result.files).toEqual([]);
    });

    it("simplifies file data in response", async () => {
      mockResponse({
        files: [
          {
            id: "file-1",
            name: "Report.pdf",
            mimeType: "application/pdf",
            modifiedTime: "2025-01-01T12:00:00Z",
            size: "1024",
            webViewLink: "https://drive.google.com/file/d/file-1/view",
            owners: [{ displayName: "Alice" }],
            kind: "drive#file",
          },
        ],
      });

      const result = (await service.listFiles()) as { files: Array<Record<string, unknown>> };
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("Report.pdf");
      expect(result.files[0].owners).toEqual(["Alice"]);
    });
  });

  // =========================================================================
  // getFile
  // =========================================================================

  describe("getFile()", () => {
    it("calls correct endpoint with file ID", async () => {
      mockResponse({
        id: "file-1",
        name: "Doc.pdf",
        mimeType: "application/pdf",
      });

      const result = (await service.getFile("file-1")) as Record<string, unknown>;

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/drive/v3/files/file-1");
      expect(url.searchParams.has("fields")).toBe(true);
      expect(result.name).toBe("Doc.pdf");
    });
  });

  // =========================================================================
  // searchFiles
  // =========================================================================

  describe("searchFiles()", () => {
    it("delegates to listFiles with query", async () => {
      mockResponse({ files: [] });
      await service.searchFiles("mimeType='application/pdf'", 15);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("q")).toBe("mimeType='application/pdf'");
      expect(url.searchParams.get("pageSize")).toBe("15");
    });
  });
});
