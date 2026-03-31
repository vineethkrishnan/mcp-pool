import {
  decodeBase64Url,
  extractEmailBody,
  simplifyEmailHeaders,
  simplifyCalendarEvent,
  simplifyDriveFile,
  stripGoogleMetadata,
  transformGoogleResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";
import { GmailMessagePart, CalendarEvent, DriveFile } from "./types";

// ===========================================================================
// decodeBase64Url
// ===========================================================================

describe("decodeBase64Url", () => {
  it("decodes standard base64url-encoded string", () => {
    // "Hello, World!" in base64url
    const encoded = Buffer.from("Hello, World!").toString("base64url");
    expect(decodeBase64Url(encoded)).toBe("Hello, World!");
  });

  it("handles padding correctly", () => {
    const encoded = Buffer.from("test").toString("base64url");
    expect(decodeBase64Url(encoded)).toBe("test");
  });

  it("handles characters that differ between base64 and base64url", () => {
    // base64url uses - instead of + and _ instead of /
    const original = "subjects+topics/items";
    const encoded = Buffer.from(original).toString("base64url");
    expect(decodeBase64Url(encoded)).toBe(original);
  });

  it("handles empty string", () => {
    expect(decodeBase64Url("")).toBe("");
  });
});

// ===========================================================================
// extractEmailBody
// ===========================================================================

describe("extractEmailBody", () => {
  it("returns empty string for undefined payload", () => {
    expect(extractEmailBody(undefined)).toBe("");
  });

  it("extracts text/plain body from direct payload", () => {
    const payload: GmailMessagePart = {
      mimeType: "text/plain",
      body: {
        data: Buffer.from("Hello from email").toString("base64url"),
      },
    };
    expect(extractEmailBody(payload)).toBe("Hello from email");
  });

  it("strips HTML tags from text/html body", () => {
    const html = "<html><body><p>Hello <b>World</b></p></body></html>";
    const payload: GmailMessagePart = {
      mimeType: "text/html",
      body: {
        data: Buffer.from(html).toString("base64url"),
      },
    };
    const result = extractEmailBody(payload);
    expect(result).toContain("Hello");
    expect(result).toContain("World");
    expect(result).not.toContain("<p>");
    expect(result).not.toContain("<b>");
  });

  it("prefers text/plain over text/html in multipart", () => {
    const payload: GmailMessagePart = {
      mimeType: "multipart/alternative",
      parts: [
        {
          mimeType: "text/plain",
          body: { data: Buffer.from("Plain text body").toString("base64url") },
        },
        {
          mimeType: "text/html",
          body: { data: Buffer.from("<p>HTML body</p>").toString("base64url") },
        },
      ],
    };
    expect(extractEmailBody(payload)).toBe("Plain text body");
  });

  it("falls back to text/html when no text/plain part exists", () => {
    const payload: GmailMessagePart = {
      mimeType: "multipart/alternative",
      parts: [
        {
          mimeType: "text/html",
          body: { data: Buffer.from("<p>Only HTML</p>").toString("base64url") },
        },
      ],
    };
    expect(extractEmailBody(payload)).toContain("Only HTML");
  });

  it("recurses into nested multipart structures", () => {
    const payload: GmailMessagePart = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "multipart/alternative",
          parts: [
            {
              mimeType: "text/plain",
              body: { data: Buffer.from("Nested plain text").toString("base64url") },
            },
          ],
        },
      ],
    };
    expect(extractEmailBody(payload)).toBe("Nested plain text");
  });

  it("returns empty string when no text parts exist", () => {
    const payload: GmailMessagePart = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "application/pdf",
          body: { data: Buffer.from("pdf data").toString("base64url") },
        },
      ],
    };
    expect(extractEmailBody(payload)).toBe("");
  });
});

// ===========================================================================
// simplifyEmailHeaders
// ===========================================================================

describe("simplifyEmailHeaders", () => {
  it("extracts key headers from header array", () => {
    const headers = [
      { name: "From", value: "alice@example.com" },
      { name: "To", value: "bob@example.com" },
      { name: "Subject", value: "Test email" },
      { name: "Date", value: "Mon, 1 Jan 2025 12:00:00 +0000" },
      { name: "X-Custom-Header", value: "should be ignored" },
    ];
    const result = simplifyEmailHeaders(headers);
    expect(result).toEqual({
      from: "alice@example.com",
      to: "bob@example.com",
      subject: "Test email",
      date: "Mon, 1 Jan 2025 12:00:00 +0000",
    });
  });

  it("returns empty object for undefined headers", () => {
    expect(simplifyEmailHeaders(undefined)).toEqual({});
  });

  it("returns empty object for empty array", () => {
    expect(simplifyEmailHeaders([])).toEqual({});
  });

  it("includes Cc and Bcc when present", () => {
    const headers = [
      { name: "Cc", value: "charlie@example.com" },
      { name: "Bcc", value: "dave@example.com" },
    ];
    const result = simplifyEmailHeaders(headers);
    expect(result).toEqual({
      cc: "charlie@example.com",
      bcc: "dave@example.com",
    });
  });
});

// ===========================================================================
// simplifyCalendarEvent
// ===========================================================================

describe("simplifyCalendarEvent", () => {
  it("flattens a full calendar event", () => {
    const event: CalendarEvent = {
      id: "evt-1",
      summary: "Team Standup",
      start: { dateTime: "2025-01-01T10:00:00Z" },
      end: { dateTime: "2025-01-01T10:30:00Z" },
      location: "Room 101",
      organizer: { displayName: "Alice", email: "alice@example.com" },
      attendees: [
        { displayName: "Bob", email: "bob@example.com" },
        { email: "charlie@example.com" },
      ],
      status: "confirmed",
      htmlLink: "https://calendar.google.com/event/evt-1",
    };
    const result = simplifyCalendarEvent(event);
    expect(result).toEqual({
      id: "evt-1",
      summary: "Team Standup",
      start: "2025-01-01T10:00:00Z",
      end: "2025-01-01T10:30:00Z",
      location: "Room 101",
      organizer: "Alice",
      attendees: ["Bob", "charlie@example.com"],
      status: "confirmed",
      htmlLink: "https://calendar.google.com/event/evt-1",
    });
  });

  it("handles all-day events with date instead of dateTime", () => {
    const event: CalendarEvent = {
      summary: "Holiday",
      start: { date: "2025-12-25" },
      end: { date: "2025-12-26" },
    };
    const result = simplifyCalendarEvent(event);
    expect(result.start).toBe("2025-12-25");
    expect(result.end).toBe("2025-12-26");
  });

  it("uses email as organizer fallback when displayName is missing", () => {
    const event: CalendarEvent = {
      organizer: { email: "alice@example.com" },
    };
    const result = simplifyCalendarEvent(event);
    expect(result.organizer).toBe("alice@example.com");
  });

  it("defaults summary to (no title) when missing", () => {
    const event: CalendarEvent = {};
    const result = simplifyCalendarEvent(event);
    expect(result.summary).toBe("(no title)");
  });

  it("returns null for missing optional fields", () => {
    const event: CalendarEvent = {};
    const result = simplifyCalendarEvent(event);
    expect(result.location).toBeNull();
    expect(result.start).toBeNull();
    expect(result.end).toBeNull();
    expect(result.status).toBeNull();
    expect(result.htmlLink).toBeNull();
  });
});

// ===========================================================================
// simplifyDriveFile
// ===========================================================================

describe("simplifyDriveFile", () => {
  it("flattens a full drive file", () => {
    const file: DriveFile = {
      id: "file-1",
      name: "Q4 Report.pdf",
      mimeType: "application/pdf",
      modifiedTime: "2025-01-01T12:00:00Z",
      size: "1048576",
      webViewLink: "https://drive.google.com/file/d/file-1/view",
      owners: [{ displayName: "Alice", emailAddress: "alice@example.com" }],
    };
    const result = simplifyDriveFile(file);
    expect(result).toEqual({
      id: "file-1",
      name: "Q4 Report.pdf",
      mimeType: "application/pdf",
      modifiedTime: "2025-01-01T12:00:00Z",
      size: "1048576",
      webViewLink: "https://drive.google.com/file/d/file-1/view",
      owners: ["Alice"],
    });
  });

  it("uses email as owner fallback when displayName is missing", () => {
    const file: DriveFile = {
      owners: [{ emailAddress: "alice@example.com" }],
    };
    const result = simplifyDriveFile(file);
    expect(result.owners).toEqual(["alice@example.com"]);
  });

  it("defaults name to (untitled) when missing", () => {
    const file: DriveFile = {};
    const result = simplifyDriveFile(file);
    expect(result.name).toBe("(untitled)");
  });

  it("returns null for missing optional fields", () => {
    const file: DriveFile = {};
    const result = simplifyDriveFile(file);
    expect(result.mimeType).toBeNull();
    expect(result.modifiedTime).toBeNull();
    expect(result.size).toBeNull();
    expect(result.webViewLink).toBeNull();
  });
});

// ===========================================================================
// stripGoogleMetadata
// ===========================================================================

describe("stripGoogleMetadata", () => {
  it("removes kind, etag, and nextPageToken from objects", () => {
    const input = {
      kind: "calendar#event",
      etag: '"abc123"',
      nextPageToken: "token123",
      id: "evt-1",
      summary: "Meeting",
    };
    expect(stripGoogleMetadata(input)).toEqual({
      id: "evt-1",
      summary: "Meeting",
    });
  });

  it("recursively strips metadata from nested objects", () => {
    const input = {
      kind: "calendar#events",
      items: [
        { kind: "calendar#event", id: "1", summary: "A" },
        { kind: "calendar#event", id: "2", summary: "B" },
      ],
    };
    const result = stripGoogleMetadata(input) as Record<string, unknown>;
    expect(result.kind).toBeUndefined();
    const items = result.items as Array<Record<string, unknown>>;
    expect(items[0].kind).toBeUndefined();
    expect(items[0].id).toBe("1");
  });

  it("handles null and undefined", () => {
    expect(stripGoogleMetadata(null)).toBeNull();
    expect(stripGoogleMetadata(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(stripGoogleMetadata("hello")).toBe("hello");
    expect(stripGoogleMetadata(42)).toBe(42);
    expect(stripGoogleMetadata(true)).toBe(true);
  });

  it("handles arrays", () => {
    const input = [
      { kind: "a", id: "1" },
      { kind: "b", id: "2" },
    ];
    const result = stripGoogleMetadata(input) as Array<Record<string, unknown>>;
    expect(result).toEqual([{ id: "1" }, { id: "2" }]);
  });
});

// ===========================================================================
// transformGoogleResponse
// ===========================================================================

describe("transformGoogleResponse", () => {
  it("composes all Google transforms", () => {
    const input = {
      kind: "drive#fileList",
      etag: '"xyz"',
      files: [{ kind: "drive#file", name: "test.txt" }],
    };
    const result = transformGoogleResponse(input) as Record<string, unknown>;
    expect(result.kind).toBeUndefined();
    expect(result.etag).toBeUndefined();
    const files = result.files as Array<Record<string, unknown>>;
    expect(files[0].kind).toBeUndefined();
    expect(files[0].name).toBe("test.txt");
  });
});

// ===========================================================================
// formatMcpResponse / formatMcpError
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns transformed data in MCP format", () => {
    const result = formatMcpResponse({ kind: "test", id: "1" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.kind).toBeUndefined();
    expect(parsed.id).toBe("1");
  });

  it("does not set isError", () => {
    const result = formatMcpResponse({ data: "test" });
    expect(result.isError).toBeUndefined();
  });
});

describe("formatMcpError", () => {
  it("wraps Error instance in MCP error format", () => {
    const result = formatMcpError(new Error("Something failed"));
    expect(result.content[0].text).toBe("Error: Something failed");
    expect(result.isError).toBe(true);
  });

  it("wraps string error in MCP error format", () => {
    const result = formatMcpError("string error");
    expect(result.content[0].text).toBe("Error: string error");
    expect(result.isError).toBe(true);
  });
});
