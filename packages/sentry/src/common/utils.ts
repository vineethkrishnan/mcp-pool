import { McpToolResponse } from "./types";

const SENTRY_STRIP_KEYS = [
  "pluginActions",
  "pluginContexts",
  "pluginIssues",
  "seenBy",
  "activity",
  "participants",
  "dist",
];

const MAX_STACK_FRAMES = 15;
const MAX_BREADCRUMBS = 20;

/**
 * Recursively removes specified keys from an object.
 */
export function stripInternalKeys(obj: unknown, keys: string[] = SENTRY_STRIP_KEYS): unknown {
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
 * Truncates stack frames in Sentry event exceptions to reduce token usage.
 * Keeps the most recent MAX_STACK_FRAMES frames per exception.
 */
export function truncateStackFrames(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(truncateStackFrames);

  const record = obj as Record<string, unknown>;

  // Handle exception.values[].stacktrace.frames
  if (record.entries && Array.isArray(record.entries)) {
    record.entries = (record.entries as unknown[]).map((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>).type === "exception"
      ) {
        return truncateExceptionEntry(entry as Record<string, unknown>);
      }
      return entry;
    });
  }

  // Handle top-level exception format
  if (record.exception && typeof record.exception === "object") {
    const exception = record.exception as Record<string, unknown>;
    if (Array.isArray(exception.values)) {
      exception.values = (exception.values as unknown[]).map((val) =>
        truncateExceptionValue(val as Record<string, unknown>),
      );
    }
  }

  return record;
}

function truncateExceptionEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const data = entry.data as Record<string, unknown> | undefined;
  if (!data || !data.values || !Array.isArray(data.values)) return entry;

  return {
    ...entry,
    data: {
      ...data,
      values: (data.values as unknown[]).map((val) =>
        truncateExceptionValue(val as Record<string, unknown>),
      ),
    },
  };
}

function truncateExceptionValue(val: Record<string, unknown>): Record<string, unknown> {
  if (!val || !val.stacktrace || typeof val.stacktrace !== "object") return val;

  const stacktrace = val.stacktrace as Record<string, unknown>;
  if (!Array.isArray(stacktrace.frames)) return val;

  const frames = stacktrace.frames as unknown[];
  if (frames.length <= MAX_STACK_FRAMES) return val;

  const totalFrames = frames.length;
  const truncatedFrames = frames.slice(-MAX_STACK_FRAMES);

  return {
    ...val,
    stacktrace: {
      ...stacktrace,
      frames: truncatedFrames,
      _truncated: { kept: MAX_STACK_FRAMES, total: totalFrames },
    },
  };
}

/**
 * Truncates breadcrumbs to reduce token usage.
 * Keeps the most recent MAX_BREADCRUMBS entries.
 */
export function truncateBreadcrumbs(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(truncateBreadcrumbs);

  const record = obj as Record<string, unknown>;

  // Handle entries-based breadcrumbs (event detail format)
  if (record.entries && Array.isArray(record.entries)) {
    record.entries = (record.entries as unknown[]).map((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>).type === "breadcrumbs"
      ) {
        return truncateBreadcrumbEntry(entry as Record<string, unknown>);
      }
      return entry;
    });
  }

  // Handle top-level breadcrumbs array
  if (record.breadcrumbs && Array.isArray(record.breadcrumbs)) {
    const breadcrumbs = record.breadcrumbs as unknown[];
    if (breadcrumbs.length > MAX_BREADCRUMBS) {
      const totalBreadcrumbs = breadcrumbs.length;
      record.breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
      record._breadcrumbsTruncated = { kept: MAX_BREADCRUMBS, total: totalBreadcrumbs };
    }
  }

  return record;
}

function truncateBreadcrumbEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const data = entry.data as Record<string, unknown> | undefined;
  if (!data || !data.values || !Array.isArray(data.values)) return entry;

  const values = data.values as unknown[];
  if (values.length <= MAX_BREADCRUMBS) return entry;

  const totalBreadcrumbs = values.length;
  return {
    ...entry,
    data: {
      ...data,
      values: values.slice(-MAX_BREADCRUMBS),
      _truncated: { kept: MAX_BREADCRUMBS, total: totalBreadcrumbs },
    },
  };
}

/**
 * Composes all Sentry-specific transformations for LLM optimization.
 */
export function transformSentryResponse(data: unknown): unknown {
  let result = stripInternalKeys(data);
  result = truncateStackFrames(result);
  result = truncateBreadcrumbs(result);
  return result;
}

/**
 * Transforms Sentry data and wraps it in the MCP tool response format.
 */
export function formatMcpResponse(data: unknown): McpToolResponse {
  const transformed = transformSentryResponse(data);
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
