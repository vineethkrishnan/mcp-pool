import { CalendarService } from "./calendar.service";
import { GoogleAuthService } from "./auth.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("./auth.service");

describe("CalendarService", () => {
  let service: CalendarService;
  let mockAuth: jest.Mocked<GoogleAuthService>;

  beforeEach(() => {
    mockFetch.mockReset();
    mockAuth = new GoogleAuthService({ accessToken: "fake" }) as jest.Mocked<GoogleAuthService>;
    mockAuth.getAccessToken = jest.fn().mockResolvedValue("test-token");
    service = new CalendarService(mockAuth);
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
      mockResponse({ items: [] });
      await service.listCalendars();

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
      await expect(service.listCalendars()).rejects.toThrow("Calendar authentication failed");
    });

    it("throws on 403", async () => {
      mockErrorResponse(403);
      await expect(service.listCalendars()).rejects.toThrow("Calendar access denied");
    });

    it("throws on 404", async () => {
      mockErrorResponse(404);
      await expect(service.getEvent("primary", "bad-id")).rejects.toThrow(
        "Calendar resource not found",
      );
    });

    it("throws on 429", async () => {
      mockErrorResponse(429);
      await expect(service.listCalendars()).rejects.toThrow("Calendar API rate limit exceeded");
    });

    it("throws generic error on 500", async () => {
      mockErrorResponse(500, "Server Error");
      await expect(service.listCalendars()).rejects.toThrow("Calendar API error (500)");
    });
  });

  // =========================================================================
  // listCalendars
  // =========================================================================

  describe("listCalendars()", () => {
    it("calls correct endpoint", async () => {
      mockResponse({
        items: [
          { id: "primary", summary: "My Calendar", primary: true, accessRole: "owner" },
          { id: "holidays", summary: "Holidays", description: "US Holidays" },
        ],
      });

      const result = (await service.listCalendars()) as { calendars: unknown[] };

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/calendar/v3/users/me/calendarList");
      expect(result.calendars).toHaveLength(2);
    });

    it("returns empty array when no calendars", async () => {
      mockResponse({ items: undefined });
      const result = (await service.listCalendars()) as { calendars: unknown[] };
      expect(result.calendars).toEqual([]);
    });
  });

  // =========================================================================
  // listEvents
  // =========================================================================

  describe("listEvents()", () => {
    it("calls correct endpoint with default calendar", async () => {
      mockResponse({ items: [], summary: "My Calendar" });
      await service.listEvents();

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/calendar/v3/calendars/primary/events");
      expect(url.searchParams.get("maxResults")).toBe("10");
      expect(url.searchParams.get("singleEvents")).toBe("true");
      expect(url.searchParams.get("orderBy")).toBe("startTime");
    });

    it("includes time range params when provided", async () => {
      mockResponse({ items: [] });
      await service.listEvents("primary", "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z", 25);

      const url = new URL(getCalledUrl());
      expect(url.searchParams.get("timeMin")).toBe("2025-01-01T00:00:00Z");
      expect(url.searchParams.get("timeMax")).toBe("2025-01-31T23:59:59Z");
      expect(url.searchParams.get("maxResults")).toBe("25");
    });

    it("encodes special characters in calendar ID", async () => {
      mockResponse({ items: [] });
      await service.listEvents("user@example.com");

      const url = getCalledUrl();
      expect(url).toContain(encodeURIComponent("user@example.com"));
    });

    it("simplifies event data in response", async () => {
      mockResponse({
        summary: "My Calendar",
        items: [
          {
            id: "evt-1",
            summary: "Standup",
            start: { dateTime: "2025-01-01T10:00:00Z" },
            end: { dateTime: "2025-01-01T10:30:00Z" },
            kind: "calendar#event",
            etag: '"abc"',
          },
        ],
      });

      const result = (await service.listEvents()) as {
        calendar: string;
        events: Array<Record<string, unknown>>;
      };
      expect(result.calendar).toBe("My Calendar");
      expect(result.events).toHaveLength(1);
      expect(result.events[0].summary).toBe("Standup");
    });
  });

  // =========================================================================
  // getEvent
  // =========================================================================

  describe("getEvent()", () => {
    it("calls correct endpoint with calendar and event IDs", async () => {
      mockResponse({
        id: "evt-1",
        summary: "Meeting",
        start: { dateTime: "2025-01-01T14:00:00Z" },
        end: { dateTime: "2025-01-01T15:00:00Z" },
      });

      const result = (await service.getEvent("primary", "evt-1")) as Record<string, unknown>;

      const url = new URL(getCalledUrl());
      expect(url.pathname).toBe("/calendar/v3/calendars/primary/events/evt-1");
      expect(result.summary).toBe("Meeting");
    });
  });
});
