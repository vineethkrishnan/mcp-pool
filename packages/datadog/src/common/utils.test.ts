import {
  stripDatadogMetadata,
  stripDashboardWidgets,
  truncateMetricSeries,
  transformDatadogResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

describe("stripDatadogMetadata", () => {
  it("removes default internal keys from a flat object", () => {
    const input = {
      id: 123,
      name: "CPU Monitor",
      creator: { handle: "user@example.com", id: 1 },
      matching_downtimes: [{ id: 1 }],
      restricted_roles: ["role-1"],
      org_id: 12345,
      deleted: null,
      modified: "2026-01-01T00:00:00Z",
    };

    const result = stripDatadogMetadata(input) as Record<string, unknown>;

    expect(result).toEqual({ id: 123, name: "CPU Monitor" });
    expect(result).not.toHaveProperty("creator");
    expect(result).not.toHaveProperty("matching_downtimes");
    expect(result).not.toHaveProperty("restricted_roles");
    expect(result).not.toHaveProperty("org_id");
    expect(result).not.toHaveProperty("deleted");
    expect(result).not.toHaveProperty("modified");
  });

  it("preserves keys that are not in the strip list", () => {
    const input = { name: "My Monitor", status: "OK", query: "avg:cpu{*}" };
    expect(stripDatadogMetadata(input)).toEqual(input);
  });

  it("handles nested objects recursively", () => {
    const input = {
      monitor: {
        id: 1,
        creator: { email: "user@test.com" },
        options: {
          org_id: 999,
          thresholds: { critical: 90 },
        },
      },
    };

    const result = stripDatadogMetadata(input) as Record<string, unknown>;
    const monitor = result.monitor as Record<string, unknown>;

    expect(monitor).not.toHaveProperty("creator");
    expect(monitor.id).toBe(1);

    const options = monitor.options as Record<string, unknown>;
    expect(options).not.toHaveProperty("org_id");
    expect((options.thresholds as Record<string, unknown>).critical).toBe(90);
  });

  it("handles arrays by stripping keys from each element", () => {
    const input = [
      { id: 1, creator: { id: 10 }, name: "Monitor A" },
      { id: 2, restricted_roles: [], name: "Monitor B" },
    ];

    const result = stripDatadogMetadata(input) as Record<string, unknown>[];
    expect(result).toEqual([
      { id: 1, name: "Monitor A" },
      { id: 2, name: "Monitor B" },
    ]);
  });

  it("returns null unchanged", () => {
    expect(stripDatadogMetadata(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(stripDatadogMetadata(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(stripDatadogMetadata(42)).toBe(42);
    expect(stripDatadogMetadata("hello")).toBe("hello");
    expect(stripDatadogMetadata(true)).toBe(true);
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripDatadogMetadata(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

describe("stripDashboardWidgets", () => {
  it("simplifies widgets to title, type, and queries", () => {
    const dashboard = {
      id: "dash-1",
      title: "My Dashboard",
      widgets: [
        {
          id: 1,
          definition: {
            type: "timeseries",
            title: "CPU Usage",
            requests: [{ q: "avg:system.cpu.user{*}" }],
            style: { palette: "dog_classic" },
            yaxis: { min: 0 },
            markers: [],
          },
        },
      ],
    };

    const result = stripDashboardWidgets(dashboard) as Record<string, unknown>;

    expect(result._widgetCount).toBe(1);
    const widgets = result.widgets as Record<string, unknown>[];
    expect(widgets[0]).toEqual({
      id: 1,
      type: "timeseries",
      title: "CPU Usage",
      queries: ["avg:system.cpu.user{*}"],
    });
  });

  it("handles group widgets with nested children", () => {
    const dashboard = {
      title: "Grouped",
      widgets: [
        {
          id: 10,
          definition: {
            type: "group",
            title: "Host Metrics",
            widgets: [
              {
                id: 11,
                definition: {
                  type: "query_value",
                  title: "Memory",
                  requests: [{ q: "avg:system.mem.used{*}" }],
                },
              },
            ],
          },
        },
      ],
    };

    const result = stripDashboardWidgets(dashboard) as Record<string, unknown>;
    const widgets = result.widgets as Record<string, unknown>[];
    const group = widgets[0];
    expect(group.type).toBe("group");
    expect((group.widgets as Record<string, unknown>[]).length).toBe(1);
  });

  it("handles widget without definition", () => {
    const dashboard = {
      title: "Empty",
      widgets: [{ id: 1 }],
    };

    const result = stripDashboardWidgets(dashboard) as Record<string, unknown>;
    const widgets = result.widgets as Record<string, unknown>[];
    expect(widgets[0]).toEqual({ id: 1 });
  });

  it("returns non-dashboard objects unchanged", () => {
    expect(stripDashboardWidgets({ name: "not a dashboard" })).toEqual({
      name: "not a dashboard",
    });
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(stripDashboardWidgets(null)).toBeNull();
    expect(stripDashboardWidgets(undefined)).toBeUndefined();
    expect(stripDashboardWidgets("string")).toBe("string");
  });
});

describe("truncateMetricSeries", () => {
  const makePointlist = (count: number): number[][] =>
    Array.from({ length: count }, (_, i) => [1000 + i * 60, i + 1]);

  it("downsamples series with more than 50 data points and adds summary", () => {
    const data = {
      status: "ok",
      series: [
        {
          metric: "system.cpu.user",
          scope: "host:web-01",
          pointlist: makePointlist(100),
        },
      ],
    };

    const result = truncateMetricSeries(data) as Record<string, unknown>;
    const series = (result.series as Record<string, unknown>[])[0];
    const pointlist = series.pointlist as number[][];
    const summary = series._summary as Record<string, unknown>;
    const truncated = series._truncated as Record<string, unknown>;

    expect(pointlist).toHaveLength(50);
    expect(summary.count).toBe(100);
    expect(summary.min).toBe(1);
    expect(summary.max).toBe(100);
    expect(summary.avg).toBe(50.5);
    expect(truncated).toEqual({ kept: 50, total: 100 });
  });

  it("keeps series with 50 or fewer points unchanged but adds summary", () => {
    const data = {
      series: [
        {
          metric: "system.mem.used",
          pointlist: makePointlist(30),
        },
      ],
    };

    const result = truncateMetricSeries(data) as Record<string, unknown>;
    const series = (result.series as Record<string, unknown>[])[0];
    const pointlist = series.pointlist as number[][];

    expect(pointlist).toHaveLength(30);
    expect(series._summary).toBeDefined();
    expect(series._truncated).toBeUndefined();
  });

  it("handles exactly 50 points without truncation", () => {
    const data = {
      series: [{ metric: "test", pointlist: makePointlist(50) }],
    };

    const result = truncateMetricSeries(data) as Record<string, unknown>;
    const series = (result.series as Record<string, unknown>[])[0];
    expect((series.pointlist as number[][]).length).toBe(50);
    expect(series._truncated).toBeUndefined();
  });

  it("handles empty pointlist", () => {
    const data = {
      series: [{ metric: "test", pointlist: [] }],
    };

    const result = truncateMetricSeries(data) as Record<string, unknown>;
    const series = (result.series as Record<string, unknown>[])[0];
    expect(series.pointlist).toEqual([]);
  });

  it("handles missing pointlist", () => {
    const data = {
      series: [{ metric: "test" }],
    };

    const result = truncateMetricSeries(data) as Record<string, unknown>;
    const series = (result.series as Record<string, unknown>[])[0];
    expect(series.metric).toBe("test");
  });

  it("returns data without series unchanged", () => {
    const data = { status: "ok", message: "no data" };
    expect(truncateMetricSeries(data)).toEqual(data);
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(truncateMetricSeries(null)).toBeNull();
    expect(truncateMetricSeries(undefined)).toBeUndefined();
    expect(truncateMetricSeries(42)).toBe(42);
  });
});

describe("transformDatadogResponse", () => {
  it("strips internal keys by default", () => {
    const input = { id: 1, name: "Test", creator: { id: 10 }, org_id: 99 };
    const result = transformDatadogResponse(input) as Record<string, unknown>;

    expect(result).toEqual({ id: 1, name: "Test" });
  });

  it("applies dashboard widget stripping when resourceType is dashboard", () => {
    const input = {
      title: "Dash",
      creator: { id: 1 },
      widgets: [
        {
          id: 1,
          definition: {
            type: "timeseries",
            requests: [{ q: "avg:cpu{*}" }],
            style: {},
          },
        },
      ],
    };

    const result = transformDatadogResponse(input, "dashboard") as Record<string, unknown>;
    expect(result._widgetCount).toBe(1);
    expect(result).not.toHaveProperty("creator");
  });

  it("applies metric truncation when resourceType is metrics", () => {
    const points = Array.from({ length: 100 }, (_, i) => [1000 + i, i]);
    const input = {
      series: [{ metric: "cpu", pointlist: points, creator: { id: 1 } }],
    };

    const result = transformDatadogResponse(input, "metrics") as Record<string, unknown>;
    const series = (result.series as Record<string, unknown>[])[0];
    expect((series.pointlist as number[][]).length).toBe(50);
    expect(series).not.toHaveProperty("creator");
  });

  it("handles null input", () => {
    expect(transformDatadogResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformDatadogResponse(undefined)).toBeUndefined();
  });
});

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = { id: 1, name: "Monitor", creator: { id: 10 } };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: 1, name: "Monitor" });
  });

  it("returns JSON pretty-printed with 2-space indent", () => {
    const input = { a: 1, b: { c: 2 } };
    const result = formatMcpResponse(input);
    const expectedJson = JSON.stringify({ a: 1, b: { c: 2 } }, null, 2);
    expect(result.content[0].text).toBe(expectedJson);
  });

  it("handles null input", () => {
    const result = formatMcpResponse(null);
    expect(result.content[0].text).toBe("null");
  });

  it("passes resourceType through to transform", () => {
    const points = Array.from({ length: 100 }, (_, i) => [1000 + i, i]);
    const input = { series: [{ metric: "cpu", pointlist: points }] };
    const result = formatMcpResponse(input, "metrics");

    const parsed = JSON.parse(result.content[0].text);
    const series = parsed.series[0];
    expect(series.pointlist.length).toBe(50);
  });
});

describe("formatMcpError", () => {
  it("returns error format with isError true", () => {
    const error = new Error("Something went wrong");
    const result = formatMcpError(error);

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Error: Something went wrong");
  });

  it("handles string errors", () => {
    const result = formatMcpError("network failure");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: network failure");
  });

  it("handles non-string non-Error values", () => {
    const result = formatMcpError(404);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: 404");
  });

  it("handles null error", () => {
    const result = formatMcpError(null);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: null");
  });
});
