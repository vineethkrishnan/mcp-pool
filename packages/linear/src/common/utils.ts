import { McpToolResponse } from "./types";

const LINEAR_STRIP_KEYS = [
  "__typename",
  "pageInfo",
  "archivedAt",
  "trashed",
  "autoArchivedAt",
  "autoClosedAt",
  "snoozedUntilAt",
  "sortOrder",
  "boardOrder",
  "subIssueSortOrder",
];

const PRIORITY_MAP: Record<number, string> = {
  0: "No Priority",
  1: "Urgent",
  2: "High",
  3: "Medium",
  4: "Low",
};

/**
 * Converts GraphQL connection structures ({nodes: [...], pageInfo: {...}})
 * to plain arrays. Handles nested connections recursively.
 */
export function flattenConnection(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(flattenConnection);
  if (typeof data !== "object") return data;

  const record = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "nodes" in (value as Record<string, unknown>)
    ) {
      const connection = value as Record<string, unknown>;
      const nodes = connection.nodes as unknown[];
      result[key] = nodes.map(flattenConnection);
    } else {
      result[key] = flattenConnection(value);
    }
  }

  return result;
}

/**
 * Simplifies nested references on a node by stripping __typename fields.
 * Preserves structure like {assignee: {id, name}} but removes GraphQL metadata.
 */
export function flattenNode(node: unknown): unknown {
  if (node === null || node === undefined) return node;
  if (Array.isArray(node)) return node.map(flattenNode);
  if (typeof node !== "object") return node;

  const record = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === "__typename") continue;
    result[key] = flattenNode(value);
  }

  return result;
}

/**
 * Maps numeric priority values to human-readable labels.
 * Returns the label string, or the original value if not a known priority.
 */
export function mapPriority(priority: number): string {
  return PRIORITY_MAP[priority] ?? `Unknown (${priority})`;
}

/**
 * Recursively maps priority fields in an object from numeric to labeled format.
 */
export function mapPriorities(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(mapPriorities);
  if (typeof data !== "object") return data;

  const record = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === "priority" && typeof value === "number") {
      result[key] = { level: value, label: mapPriority(value) };
    } else {
      result[key] = mapPriorities(value);
    }
  }

  return result;
}

/**
 * Recursively removes __typename, pageInfo, and other GraphQL metadata
 * from all levels of an object.
 */
export function stripGraphQLMetadata(obj: unknown, keys: string[] = LINEAR_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripGraphQLMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripGraphQLMetadata(value, keys);
  }
  return result;
}

/**
 * Composes all Linear-specific transformations for LLM optimization.
 * Order: flatten connections -> strip metadata -> map priorities
 */
export function transformLinearResponse(data: unknown): unknown {
  let result = flattenConnection(data);
  result = stripGraphQLMetadata(result);
  result = mapPriorities(result);
  return result;
}

/**
 * Transforms Linear data and wraps it in the MCP tool response format.
 */
export function formatMcpResponse(data: unknown): McpToolResponse {
  const transformed = transformLinearResponse(data);
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
