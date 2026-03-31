import { McpToolResponse, GmailMessagePart, GmailHeader, CalendarEvent, DriveFile } from "./types";

const GOOGLE_STRIP_KEYS = ["kind", "etag", "nextPageToken"];

/**
 * Decode Gmail base64url-encoded body content.
 */
export function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

/**
 * Strip HTML tags from a string, leaving plain text.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Recursively walk MIME parts to find and decode the email body.
 * Prefers text/plain over text/html.
 */
export function extractEmailBody(payload: GmailMessagePart | undefined): string {
  if (!payload) return "";

  // Check for direct body content
  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") {
      return stripHtmlTags(decoded);
    }
    return decoded;
  }

  // Recursively search parts
  if (payload.parts && payload.parts.length > 0) {
    // Prefer text/plain
    const plainPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plainPart) {
      return extractEmailBody(plainPart);
    }

    // Fall back to text/html
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart) {
      return extractEmailBody(htmlPart);
    }

    // Recurse into multipart/* parts
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith("multipart/")) {
        const body = extractEmailBody(part);
        if (body) return body;
      }
    }
  }

  return "";
}

/**
 * Extract key headers (From, To, Subject, Date) from Gmail header array.
 */
export function simplifyEmailHeaders(headers: GmailHeader[] | undefined): Record<string, string> {
  if (!headers) return {};

  const targetHeaders = ["From", "To", "Subject", "Date", "Cc", "Bcc"];
  const result: Record<string, string> = {};

  for (const header of headers) {
    if (targetHeaders.includes(header.name)) {
      result[header.name.toLowerCase()] = header.value;
    }
  }

  return result;
}

/**
 * Flatten a Calendar event to essential fields.
 */
export function simplifyCalendarEvent(event: CalendarEvent): Record<string, unknown> {
  return {
    id: event.id,
    summary: event.summary ?? "(no title)",
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    location: event.location ?? null,
    organizer: event.organizer?.displayName ?? event.organizer?.email ?? null,
    attendees: event.attendees?.map((a) => a.displayName ?? a.email ?? "unknown") ?? [],
    status: event.status ?? null,
    htmlLink: event.htmlLink ?? null,
  };
}

/**
 * Flatten a Drive file to essential fields.
 */
export function simplifyDriveFile(file: DriveFile): Record<string, unknown> {
  return {
    id: file.id,
    name: file.name ?? "(untitled)",
    mimeType: file.mimeType ?? null,
    modifiedTime: file.modifiedTime ?? null,
    size: file.size ?? null,
    webViewLink: file.webViewLink ?? null,
    owners: file.owners?.map((o) => o.displayName ?? o.emailAddress ?? "unknown") ?? [],
  };
}

/**
 * Recursively remove Google API metadata keys (kind, etag, nextPageToken).
 */
export function stripGoogleMetadata(obj: unknown, keys: string[] = GOOGLE_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripGoogleMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripGoogleMetadata(value, keys);
  }
  return result;
}

/**
 * Compose all Google-specific transformations.
 */
export function transformGoogleResponse(data: unknown): unknown {
  return stripGoogleMetadata(data);
}

/**
 * Transform data and wrap in MCP tool response format.
 */
export function formatMcpResponse(data: unknown): McpToolResponse {
  const transformed = transformGoogleResponse(data);
  return {
    content: [{ type: "text", text: JSON.stringify(transformed, null, 2) }],
  };
}

/**
 * Wrap an error in the MCP tool error response format.
 */
export function formatMcpError(error: unknown): McpToolResponse {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
