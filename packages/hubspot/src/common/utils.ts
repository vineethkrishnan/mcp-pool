import { McpToolResponse } from "./types";

const HUBSPOT_STRIP_KEYS = [
  "archived",
  "archivedAt",
  "propertiesWithHistory",
  "properties_with_history",
  "createdAt",
  "updatedAt",
];

/**
 * Flattens HubSpot's nested properties object to top-level fields.
 * Input:  { id: "123", properties: { firstname: "John", lastname: "Doe" }, ... }
 * Output: { id: "123", firstname: "John", lastname: "Doe" }
 */
export function flattenProperties(record: unknown): unknown {
  if (record === null || record === undefined) return record;
  if (Array.isArray(record)) return record.map(flattenProperties);
  if (typeof record !== "object") return record;

  const obj = record as Record<string, unknown>;
  if (!("properties" in obj) || typeof obj.properties !== "object" || obj.properties === null) {
    return record;
  }

  const { properties, ...rest } = obj;
  return { ...rest, ...(properties as Record<string, unknown>) };
}

/**
 * Removes HubSpot internal metadata keys that waste LLM tokens.
 */
export function stripHubSpotMetadata(obj: unknown, keys: string[] = HUBSPOT_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripHubSpotMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripHubSpotMetadata(value, keys);
  }
  return result;
}

/**
 * Simplifies HubSpot association responses from verbose objects to ID arrays.
 * Input:  { associations: { companies: { results: [{ id: "456", type: "contact_to_company" }] } } }
 * Output: { associatedCompanyIds: ["456"] } merged into the record
 */
export function simplifyAssociations(record: unknown): unknown {
  if (record === null || record === undefined) return record;
  if (Array.isArray(record)) return record.map(simplifyAssociations);
  if (typeof record !== "object") return record;

  const obj = record as Record<string, unknown>;
  if (
    !("associations" in obj) ||
    typeof obj.associations !== "object" ||
    obj.associations === null
  ) {
    return record;
  }

  const { associations, ...rest } = obj;
  const simplified: Record<string, string[]> = {};

  for (const [objectType, data] of Object.entries(associations as Record<string, unknown>)) {
    if (data && typeof data === "object" && "results" in (data as Record<string, unknown>)) {
      const results = (data as Record<string, unknown>).results;
      if (Array.isArray(results)) {
        const capitalizedType = objectType.charAt(0).toUpperCase() + objectType.slice(1);
        simplified[`associated${capitalizedType}Ids`] = results.map((r: Record<string, unknown>) =>
          String(r.id),
        );
      }
    }
  }

  return { ...rest, ...simplified };
}

/**
 * Composes all HubSpot-specific transformations for LLM optimization.
 */
export function transformHubSpotResponse(data: unknown): unknown {
  let result = flattenProperties(data);
  result = stripHubSpotMetadata(result);
  result = simplifyAssociations(result);
  return result;
}

/**
 * Transforms HubSpot data and wraps it in the MCP tool response format.
 * Optionally prepends an action message (e.g., "Contact created successfully.")
 * before the JSON payload.
 */
export function formatMcpResponse(data: unknown, actionMessage?: string): McpToolResponse {
  const transformed = transformHubSpotResponse(data);
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
