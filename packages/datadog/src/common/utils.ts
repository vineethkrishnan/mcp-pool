import { McpToolResponse } from "./types";

const DATADOG_STRIP_KEYS = [
  "creator",
  "matching_downtimes",
  "restricted_roles",
  "org_id",
  "deleted",
  "modified",
];

const DASHBOARD_WIDGET_STRIP_KEYS = [
  "style",
  "yaxis",
  "markers",
  "events",
  "layout",
  "conditional_formats",
  "autoscale",
  "custom_unit",
  "precision",
  "text_align",
  "legend_size",
  "show_legend",
  "legend_layout",
  "legend_columns",
  "right_yaxis",
  "has_search_bar",
];

const MAX_DATAPOINTS = 50;

/**
 * Recursively removes specified keys from an object.
 */
export function stripDatadogMetadata(obj: unknown, keys: string[] = DATADOG_STRIP_KEYS): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripDatadogMetadata(item, keys));
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (keys.includes(key)) continue;
    result[key] = stripDatadogMetadata(value, keys);
  }
  return result;
}

/**
 * Simplifies dashboard widgets by removing complex visual definitions
 * and keeping only title, type, and query information.
 */
export function stripDashboardWidgets(dashboard: unknown): unknown {
  if (dashboard === null || dashboard === undefined || typeof dashboard !== "object") {
    return dashboard;
  }

  const record = dashboard as Record<string, unknown>;
  if (!record.widgets || !Array.isArray(record.widgets)) return dashboard;

  const simplifiedWidgets = (record.widgets as unknown[]).map(simplifyWidget);

  return {
    ...record,
    widgets: simplifiedWidgets,
    _widgetCount: simplifiedWidgets.length,
  };
}

function simplifyWidget(widget: unknown): unknown {
  if (widget === null || widget === undefined || typeof widget !== "object") return widget;

  const w = widget as Record<string, unknown>;
  const definition = w.definition as Record<string, unknown> | undefined;
  if (!definition) return { id: w.id };

  const simplified: Record<string, unknown> = {
    id: w.id,
    type: definition.type,
  };

  if (definition.title) simplified.title = definition.title;

  // Extract queries from requests
  if (definition.requests && Array.isArray(definition.requests)) {
    simplified.queries = (definition.requests as Record<string, unknown>[])
      .map((req) => req.q ?? req.query)
      .filter(Boolean);
  }

  // Recurse into group widgets
  if (definition.widgets && Array.isArray(definition.widgets)) {
    simplified.widgets = (definition.widgets as unknown[]).map(simplifyWidget);
  }

  // Strip visual-only keys from remaining definition
  for (const key of DASHBOARD_WIDGET_STRIP_KEYS) {
    delete (definition as Record<string, unknown>)[key];
  }

  return simplified;
}

/**
 * Truncates metric series data points to MAX_DATAPOINTS and adds summary stats.
 */
export function truncateMetricSeries(data: unknown): unknown {
  if (data === null || data === undefined || typeof data !== "object") return data;

  const record = data as Record<string, unknown>;
  if (!record.series || !Array.isArray(record.series)) return data;

  const simplifiedSeries = (record.series as unknown[]).map((series) => {
    if (series === null || series === undefined || typeof series !== "object") return series;

    const s = series as Record<string, unknown>;
    const pointlist = s.pointlist as number[][] | undefined;

    if (!pointlist || !Array.isArray(pointlist) || pointlist.length === 0) return series;

    const values = pointlist.map((point) => point[1]).filter((v) => v !== null && v !== undefined);
    const summary = {
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
      count: pointlist.length,
      start: pointlist[0]?.[0] ?? null,
      end: pointlist[pointlist.length - 1]?.[0] ?? null,
    };

    if (pointlist.length <= MAX_DATAPOINTS) {
      return { ...s, _summary: summary };
    }

    // Downsample by picking evenly spaced points
    const step = (pointlist.length - 1) / (MAX_DATAPOINTS - 1);
    const downsampled: number[][] = [];
    for (let i = 0; i < MAX_DATAPOINTS; i++) {
      const index = Math.round(i * step);
      downsampled.push(pointlist[index]);
    }

    return {
      ...s,
      pointlist: downsampled,
      _summary: summary,
      _truncated: { kept: MAX_DATAPOINTS, total: pointlist.length },
    };
  });

  return { ...record, series: simplifiedSeries };
}

/**
 * Composes all Datadog-specific transformations for LLM optimization.
 */
export function transformDatadogResponse(data: unknown, resourceType?: string): unknown {
  let result = stripDatadogMetadata(data);
  if (resourceType === "dashboard") result = stripDashboardWidgets(result);
  if (resourceType === "metrics") result = truncateMetricSeries(result);
  return result;
}

/**
 * Transforms Datadog data and wraps it in the MCP tool response format.
 * When actionMessage is provided, it is prepended as a summary line for write operations.
 */
export function formatMcpResponse(
  data: unknown,
  resourceType?: string,
  actionMessage?: string,
): McpToolResponse {
  const transformed = transformDatadogResponse(data, resourceType);
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
