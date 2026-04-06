import { McpToolResponse } from "./types";

const VERCEL_STRIP_KEYS = [
  "ownerId",
  "accountId",
  "plan",
  "analytics",
  "speedInsights",
  "autoExposeSystemEnvs",
  "directoryListing",
  "skewProtection",
];

const MAX_BUILD_LOG_LINES = 150;

/**
 * Recursively removes specified keys from an object.
 */
export function stripVercelMetadata(obj: unknown, keys: string[] = VERCEL_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripVercelMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripVercelMetadata(value, keys);
  }
  return result;
}

/**
 * Strips ANSI escape codes from a string.
 */
export function stripAnsiCodes(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

/**
 * Truncates build log lines to the last MAX_BUILD_LOG_LINES lines.
 * Returns the truncated string with a marker if truncation occurred.
 */
export function truncateBuildLogs(lines: string[], maxLines: number = MAX_BUILD_LOG_LINES): string {
  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  const totalLines = lines.length;
  const truncatedLines = lines.slice(-maxLines);
  const marker = `[truncated — showing last ${maxLines} of ${totalLines} lines]`;
  return [marker, ...truncatedLines].join("\n");
}

/**
 * Composes all Vercel-specific transformations for LLM optimization.
 * Strips internal metadata keys from the response data.
 */
export function transformVercelResponse(data: unknown): unknown {
  return stripVercelMetadata(data);
}

/**
 * Transforms Vercel data and wraps it in the MCP tool response format.
 * When actionMessage is provided, it is prepended as a summary line for write operations.
 */
export function formatMcpResponse(data: unknown, actionMessage?: string): McpToolResponse {
  const transformed = transformVercelResponse(data);
  const json = JSON.stringify(transformed, null, 2);
  const text = actionMessage ? `${actionMessage}\n\n${json}` : json;
  return {
    content: [{ type: "text", text }],
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
