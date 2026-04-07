import { McpToolResponse } from "./types";

const INTERCOM_STRIP_KEYS = [
  "statistics",
  "sla_applied",
  "linked_objects",
  "conversation_rating",
  "teammates",
];

const MAX_CONVERSATION_PARTS = 50;

// =========================================================================
// HTML stripping
// =========================================================================

/**
 * Strips HTML tags from Intercom message bodies, converting structural
 * elements (br, p, li) to newlines for LLM readability.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/?(div|span|a|b|i|em|strong|ul|ol|h[1-6])[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// =========================================================================
// Author formatting
// =========================================================================

interface IntercomAuthor {
  type?: string;
  id?: string;
  name?: string;
}

function formatAuthor(author: IntercomAuthor | null | undefined): string {
  if (!author) return "unknown";
  const name = author.name ?? "Unknown";
  return `${name} (${author.type ?? "unknown"} #${author.id ?? "?"})`;
}

// =========================================================================
// Timestamp normalization
// =========================================================================

function toIsoTimestamp(unixTimestamp: number | null | undefined): string {
  if (!unixTimestamp) return "";
  return new Date(unixTimestamp * 1000).toISOString();
}

// =========================================================================
// Conversation parts flattening
// =========================================================================

interface FlattenedPart {
  author: string;
  type: string;
  body: string;
  timestamp: string;
}

/**
 * Extracts a readable chronological timeline from conversation parts.
 * Includes the source message as the first entry.
 */
export function flattenConversationParts(conversation: Record<string, unknown>): FlattenedPart[] {
  const parts: FlattenedPart[] = [];

  // Include the source (first message) as part 0
  const source = conversation.source as Record<string, unknown> | undefined;
  if (source) {
    parts.push({
      author: formatAuthor(source.author as IntercomAuthor),
      type: (source.delivered_as as string) ?? "message",
      body: stripHtml((source.body as string) ?? ""),
      timestamp: toIsoTimestamp(conversation.created_at as number),
    });
  }

  // Flatten all conversation parts
  const conversationParts = conversation.conversation_parts as Record<string, unknown> | undefined;
  const partsArray =
    (conversationParts?.conversation_parts as Array<Record<string, unknown>>) ?? [];

  for (const part of partsArray) {
    parts.push({
      author: formatAuthor(part.author as IntercomAuthor),
      type: (part.part_type as string) ?? "unknown",
      body: stripHtml((part.body as string) ?? ""),
      timestamp: toIsoTimestamp(part.created_at as number),
    });
  }

  return parts;
}

// =========================================================================
// Conversation parts truncation
// =========================================================================

/**
 * Truncates conversation parts to MAX_CONVERSATION_PARTS (50), keeping
 * the first 5 (opening context) and last 44 (recent context).
 */
export function truncateConversationParts(parts: FlattenedPart[]): FlattenedPart[] {
  if (parts.length <= MAX_CONVERSATION_PARTS) return parts;

  const firstN = 5;
  const lastM = 44;

  return [
    ...parts.slice(0, firstN),
    {
      author: "system",
      type: "truncated",
      body: `--- ${parts.length - firstN - lastM} parts omitted ---`,
      timestamp: "",
    },
    ...parts.slice(parts.length - lastM),
  ];
}

// =========================================================================
// Metadata stripping
// =========================================================================

/**
 * Recursively removes specified keys from an object to reduce token waste.
 * Also strips the "type" key when it is redundant (e.g., on nested objects
 * where the parent already conveys the type).
 */
export function stripIntercomMetadata(obj: unknown, keys: string[] = INTERCOM_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripIntercomMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripIntercomMetadata(value, keys);
  }
  return result;
}

// =========================================================================
// Composed transforms
// =========================================================================

/**
 * Transforms an Intercom API response by stripping internal metadata.
 */
export function transformIntercomResponse(data: unknown): unknown {
  return stripIntercomMetadata(data);
}

/**
 * Transforms data and wraps it in the MCP tool response format.
 * Optionally prepends an action message (e.g., confirmation of a write operation).
 */
export function formatMcpResponse(data: unknown, actionMessage?: string): McpToolResponse {
  const transformed = transformIntercomResponse(data);
  const content: McpToolResponse["content"] = [];

  if (actionMessage) {
    content.push({ type: "text", text: actionMessage });
  }

  content.push({ type: "text", text: JSON.stringify(transformed, null, 2) });

  return { content };
}

/**
 * Wraps an error in the MCP tool error response format.
 */
export function formatMcpError(error: unknown): McpToolResponse {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
