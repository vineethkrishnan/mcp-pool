import { McpToolResponse } from "./types";

const PAGERDUTY_STRIP_KEYS = [
  "self",
  "privilege",
  "alert_counts",
  "incident_key",
  "is_mergeable",
  "conference_bridge",
  "last_status_change_by",
];

const MAX_LOG_ENTRIES = 25;

/**
 * Recursively removes specified keys from an object.
 * Keeps html_url (useful for linking) but strips internal metadata.
 */
export function stripPagerDutyMetadata(
  obj: unknown,
  keys: string[] = PAGERDUTY_STRIP_KEYS,
): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripPagerDutyMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;

    // Strip redundant "type" fields that are PagerDuty reference discriminators
    // (e.g., "incident_reference", "service_reference", "user_reference")
    if (key === "type" && typeof value === "string" && value.endsWith("_reference")) continue;

    result[key] = stripPagerDutyMetadata(value, keys);
  }
  return result;
}

/**
 * Flattens PagerDuty escalation policy chains into simple level-based lists.
 * Input: full escalation policy object with nested escalation_rules[].targets[]
 * Output: simplified { name, escalation_rules: [{ level, targets: ["User: Alice", "Schedule: Primary"] }] }
 */
export function flattenEscalationPolicy(policy: unknown): unknown {
  if (policy === null || policy === undefined || typeof policy !== "object") return policy;

  const record = policy as Record<string, unknown>;
  const rules = record.escalation_rules;
  if (!Array.isArray(rules)) return policy;

  const flatRules = rules.map((rule) => {
    const ruleRecord = rule as Record<string, unknown>;
    const targets = Array.isArray(ruleRecord.targets)
      ? (ruleRecord.targets as Record<string, unknown>[]).map((target) => {
          const targetType = typeof target.type === "string" ? target.type : "";
          const summary = typeof target.summary === "string" ? target.summary : "Unknown";

          if (targetType.includes("user")) return `User: ${summary}`;
          if (targetType.includes("schedule")) return `Schedule: ${summary}`;
          return summary;
        })
      : [];

    return {
      escalation_level: ruleRecord.escalation_delay_in_minutes
        ? {
            level: ruleRecord.escalation_delay_in_minutes,
          }
        : undefined,
      level:
        typeof ruleRecord.escalation_level === "number" ? ruleRecord.escalation_level : undefined,
      targets,
    };
  });

  return {
    id: record.id,
    name: record.name ?? record.summary,
    description: record.description,
    escalation_rules: flatRules,
  };
}

/**
 * Truncates log entries to the most recent MAX_LOG_ENTRIES.
 * Flattens each entry to: { timestamp, type, summary, agent }
 */
export function truncateLogEntries(logEntries: unknown[]): unknown[] {
  if (!Array.isArray(logEntries)) return logEntries;

  // Sort by created_at descending (most recent first)
  const sorted = [...logEntries].sort((a, b) => {
    const aTime = (a as Record<string, unknown>).created_at as string;
    const bTime = (b as Record<string, unknown>).created_at as string;
    if (!aTime || !bTime) return 0;
    return bTime.localeCompare(aTime);
  });

  const total = sorted.length;
  const truncated = sorted.slice(0, MAX_LOG_ENTRIES);

  const simplified = truncated.map((entry) => {
    const record = entry as Record<string, unknown>;
    const agent = record.agent as Record<string, unknown> | undefined;

    return {
      timestamp: record.created_at,
      type: record.type,
      summary: record.summary,
      agent: agent ? { name: agent.summary ?? agent.name } : undefined,
    };
  });

  if (total > MAX_LOG_ENTRIES) {
    return [{ _truncated: true, showing: MAX_LOG_ENTRIES, total }, ...simplified];
  }

  return simplified;
}

/**
 * Composes PagerDuty-specific transformations for LLM optimization.
 */
export function transformPagerDutyResponse(data: unknown, resourceType?: string): unknown {
  // Flatten escalation policy before stripping metadata, since flattening
  // relies on type fields (e.g., "user_reference") for target classification
  let result = data;

  if (resourceType === "escalationPolicy") {
    result = flattenEscalationPolicy(result);
  }

  result = stripPagerDutyMetadata(result);
  return result;
}

/**
 * Transforms PagerDuty data and wraps it in the MCP tool response format.
 */
export function formatMcpResponse(
  data: unknown,
  actionMessage?: string,
  resourceType?: string,
): McpToolResponse {
  const transformed = transformPagerDutyResponse(data, resourceType);
  const result = actionMessage
    ? { _action: actionMessage, ...(transformed as object) }
    : transformed;
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
