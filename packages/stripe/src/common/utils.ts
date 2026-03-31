import { McpToolResponse } from "./types";

const DEFAULT_STRIP_KEYS = [
  "object",
  "livemode",
  "request",
  "pending_webhooks",
  "api_version",
  "lastResponse",
];

const TIMESTAMP_FIELD_PATTERN = /(_at|_date|^created$|^date$)$/;
const MIN_REASONABLE_TIMESTAMP = 1_000_000_000; // ~2001-09-09

/**
 * Recursively removes specified keys from an object.
 */
export function stripInternalKeys(obj: unknown, keys: string[] = DEFAULT_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripInternalKeys(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripInternalKeys(value, keys);
  }
  return result;
}

/**
 * Recursively converts numeric Unix timestamp fields to ISO 8601 strings.
 * Targets fields ending in `_at`, `_date`, or named exactly `created` or `date`.
 */
export function convertTimestamps(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => convertTimestamps(item));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (
      typeof value === "number" &&
      TIMESTAMP_FIELD_PATTERN.test(key) &&
      value > MIN_REASONABLE_TIMESTAMP
    ) {
      result[key] = new Date(value * 1000).toISOString();
    } else {
      result[key] = convertTimestamps(value);
    }
  }
  return result;
}

/**
 * Composes stripInternalKeys and convertTimestamps to produce a cleaned
 * Stripe response optimized for LLM consumption.
 */
export function transformStripeResponse(data: unknown): unknown {
  const stripped = stripInternalKeys(data);
  return convertTimestamps(stripped);
}

/**
 * Transforms Stripe data and wraps it in the MCP tool response format.
 */
export function formatMcpResponse(data: unknown): McpToolResponse {
  const transformed = transformStripeResponse(data);
  return {
    content: [{ type: "text", text: JSON.stringify(transformed, null, 2) }],
  };
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
