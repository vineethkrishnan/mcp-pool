import {
  stripInternalKeys,
  truncateStackFrames,
  truncateBreadcrumbs,
  transformSentryResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

describe("stripInternalKeys", () => {
  it("removes default internal keys from a flat object", () => {
    const input = {
      id: "123",
      title: "Error",
      pluginActions: [],
      pluginContexts: [],
      pluginIssues: [],
      seenBy: [{ id: "user1" }],
      activity: [{ type: "note" }],
      participants: [{ id: "user2" }],
      dist: "abc",
    };

    const result = stripInternalKeys(input) as Record<string, unknown>;

    expect(result).toEqual({ id: "123", title: "Error" });
    expect(result).not.toHaveProperty("pluginActions");
    expect(result).not.toHaveProperty("pluginContexts");
    expect(result).not.toHaveProperty("pluginIssues");
    expect(result).not.toHaveProperty("seenBy");
    expect(result).not.toHaveProperty("activity");
    expect(result).not.toHaveProperty("participants");
    expect(result).not.toHaveProperty("dist");
  });

  it("preserves keys that are not in the strip list", () => {
    const input = { title: "Bug", status: "unresolved", level: "error" };
    expect(stripInternalKeys(input)).toEqual(input);
  });

  it("handles nested objects recursively", () => {
    const input = {
      issue: {
        id: "1",
        seenBy: ["user1"],
        metadata: {
          activity: [{ note: "test" }],
          value: "NullPointerException",
        },
      },
    };

    const result = stripInternalKeys(input) as Record<string, unknown>;
    const issue = result.issue as Record<string, unknown>;

    expect(issue).not.toHaveProperty("seenBy");
    expect(issue.id).toBe("1");

    const metadata = issue.metadata as Record<string, unknown>;
    expect(metadata).not.toHaveProperty("activity");
    expect(metadata.value).toBe("NullPointerException");
  });

  it("handles arrays by stripping keys from each element", () => {
    const input = [
      { id: "1", pluginActions: [], title: "Error A" },
      { id: "2", participants: [], title: "Error B" },
    ];

    const result = stripInternalKeys(input) as Record<string, unknown>[];
    expect(result).toEqual([
      { id: "1", title: "Error A" },
      { id: "2", title: "Error B" },
    ]);
  });

  it("returns null unchanged", () => {
    expect(stripInternalKeys(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(stripInternalKeys(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(stripInternalKeys(42)).toBe(42);
    expect(stripInternalKeys("hello")).toBe("hello");
    expect(stripInternalKeys(true)).toBe(true);
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripInternalKeys(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

describe("truncateStackFrames", () => {
  const makeFrames = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ filename: `file${i}.js`, lineno: i + 1 }));

  it("truncates frames longer than 15 and adds _truncated metadata", () => {
    const frames = makeFrames(30);
    const input = {
      exception: {
        values: [
          {
            type: "TypeError",
            stacktrace: { frames },
          },
        ],
      },
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const values = (result.exception as Record<string, unknown>).values as Record<
      string,
      unknown
    >[];
    const stacktrace = values[0].stacktrace as Record<string, unknown>;
    const resultFrames = stacktrace.frames as unknown[];

    expect(resultFrames).toHaveLength(15);
    expect(resultFrames[0]).toEqual({ filename: "file15.js", lineno: 16 });
    expect(resultFrames[14]).toEqual({ filename: "file29.js", lineno: 30 });
    expect(stacktrace._truncated).toEqual({ kept: 15, total: 30 });
  });

  it("handles entries[].data.values[].stacktrace.frames format", () => {
    const frames = makeFrames(20);
    const input = {
      entries: [
        {
          type: "exception",
          data: {
            values: [
              {
                type: "RuntimeError",
                stacktrace: { frames },
              },
            ],
          },
        },
      ],
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const entries = result.entries as Record<string, unknown>[];
    const data = entries[0].data as Record<string, unknown>;
    const values = data.values as Record<string, unknown>[];
    const stacktrace = values[0].stacktrace as Record<string, unknown>;
    const resultFrames = stacktrace.frames as unknown[];

    expect(resultFrames).toHaveLength(15);
    expect(stacktrace._truncated).toEqual({ kept: 15, total: 20 });
  });

  it("passes through events with fewer than 15 frames unchanged", () => {
    const frames = makeFrames(10);
    const input = {
      exception: {
        values: [
          {
            type: "Error",
            stacktrace: { frames },
          },
        ],
      },
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const values = (result.exception as Record<string, unknown>).values as Record<
      string,
      unknown
    >[];
    const stacktrace = values[0].stacktrace as Record<string, unknown>;

    expect((stacktrace.frames as unknown[]).length).toBe(10);
    expect(stacktrace._truncated).toBeUndefined();
  });

  it("passes through exactly 15 frames unchanged", () => {
    const frames = makeFrames(15);
    const input = {
      exception: {
        values: [{ type: "Error", stacktrace: { frames } }],
      },
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const values = (result.exception as Record<string, unknown>).values as Record<
      string,
      unknown
    >[];
    const stacktrace = values[0].stacktrace as Record<string, unknown>;

    expect((stacktrace.frames as unknown[]).length).toBe(15);
    expect(stacktrace._truncated).toBeUndefined();
  });

  it("handles missing stacktrace gracefully", () => {
    const input = {
      exception: {
        values: [{ type: "Error", value: "oops" }],
      },
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const values = (result.exception as Record<string, unknown>).values as Record<
      string,
      unknown
    >[];
    expect(values[0]).toEqual({ type: "Error", value: "oops" });
  });

  it("handles null stacktrace gracefully", () => {
    const input = {
      exception: {
        values: [{ type: "Error", stacktrace: null }],
      },
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const values = (result.exception as Record<string, unknown>).values as Record<
      string,
      unknown
    >[];
    expect(values[0]).toEqual({ type: "Error", stacktrace: null });
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(truncateStackFrames(null)).toBeNull();
    expect(truncateStackFrames(undefined)).toBeUndefined();
    expect(truncateStackFrames("string")).toBe("string");
  });

  it("skips non-exception entries", () => {
    const input = {
      entries: [
        { type: "breadcrumbs", data: { values: [] } },
        {
          type: "exception",
          data: {
            values: [{ type: "Error", stacktrace: { frames: makeFrames(20) } }],
          },
        },
      ],
    };

    const result = truncateStackFrames(input) as Record<string, unknown>;
    const entries = result.entries as Record<string, unknown>[];

    expect(entries[0].type).toBe("breadcrumbs");
    const exceptionData = entries[1].data as Record<string, unknown>;
    const values = exceptionData.values as Record<string, unknown>[];
    const stacktrace = values[0].stacktrace as Record<string, unknown>;
    expect((stacktrace.frames as unknown[]).length).toBe(15);
  });
});

describe("truncateBreadcrumbs", () => {
  const makeBreadcrumbs = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      category: "console",
      message: `crumb-${i}`,
      timestamp: `2024-01-01T00:00:${String(i).padStart(2, "0")}`,
    }));

  it("truncates top-level breadcrumbs longer than 20 and adds metadata", () => {
    const input = {
      breadcrumbs: makeBreadcrumbs(35),
    };

    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    const breadcrumbs = result.breadcrumbs as unknown[];

    expect(breadcrumbs).toHaveLength(20);
    expect((breadcrumbs[0] as Record<string, unknown>).message).toBe("crumb-15");
    expect((breadcrumbs[19] as Record<string, unknown>).message).toBe("crumb-34");
    expect(result._breadcrumbsTruncated).toEqual({ kept: 20, total: 35 });
  });

  it("handles entries-based breadcrumb format", () => {
    const input = {
      entries: [
        {
          type: "breadcrumbs",
          data: {
            values: makeBreadcrumbs(25),
          },
        },
      ],
    };

    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    const entries = result.entries as Record<string, unknown>[];
    const data = entries[0].data as Record<string, unknown>;
    const values = data.values as unknown[];

    expect(values).toHaveLength(20);
    expect((values[0] as Record<string, unknown>).message).toBe("crumb-5");
    expect(data._truncated).toEqual({ kept: 20, total: 25 });
  });

  it("passes through events with fewer than 20 breadcrumbs unchanged", () => {
    const input = {
      breadcrumbs: makeBreadcrumbs(10),
    };

    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    expect((result.breadcrumbs as unknown[]).length).toBe(10);
    expect(result._breadcrumbsTruncated).toBeUndefined();
  });

  it("passes through exactly 20 breadcrumbs unchanged", () => {
    const input = {
      breadcrumbs: makeBreadcrumbs(20),
    };

    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    expect((result.breadcrumbs as unknown[]).length).toBe(20);
    expect(result._breadcrumbsTruncated).toBeUndefined();
  });

  it("passes through entries-based breadcrumbs with 20 or fewer values", () => {
    const input = {
      entries: [
        {
          type: "breadcrumbs",
          data: { values: makeBreadcrumbs(15) },
        },
      ],
    };

    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    const entries = result.entries as Record<string, unknown>[];
    const data = entries[0].data as Record<string, unknown>;
    expect((data.values as unknown[]).length).toBe(15);
    expect(data._truncated).toBeUndefined();
  });

  it("handles missing breadcrumbs gracefully", () => {
    const input = { title: "Event without breadcrumbs" };
    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    expect(result).toEqual({ title: "Event without breadcrumbs" });
  });

  it("handles null breadcrumbs gracefully", () => {
    const input = { breadcrumbs: null };
    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    expect(result.breadcrumbs).toBeNull();
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(truncateBreadcrumbs(null)).toBeNull();
    expect(truncateBreadcrumbs(undefined)).toBeUndefined();
    expect(truncateBreadcrumbs(42)).toBe(42);
  });

  it("skips non-breadcrumb entries", () => {
    const input = {
      entries: [
        { type: "exception", data: { values: [] } },
        {
          type: "breadcrumbs",
          data: { values: makeBreadcrumbs(25) },
        },
      ],
    };

    const result = truncateBreadcrumbs(input) as Record<string, unknown>;
    const entries = result.entries as Record<string, unknown>[];
    expect(entries[0].type).toBe("exception");
    const data = entries[1].data as Record<string, unknown>;
    expect((data.values as unknown[]).length).toBe(20);
  });
});

describe("transformSentryResponse", () => {
  it("composes all three transforms", () => {
    const makeFrames = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ filename: `f${i}.js` }));
    const makeBreadcrumbs = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ message: `bc-${i}` }));

    const input = {
      id: "event-1",
      pluginActions: [],
      seenBy: [],
      participants: [],
      exception: {
        values: [
          {
            type: "Error",
            stacktrace: { frames: makeFrames(20) },
          },
        ],
      },
      breadcrumbs: makeBreadcrumbs(30),
    };

    const result = transformSentryResponse(input) as Record<string, unknown>;

    // Internal keys stripped
    expect(result).not.toHaveProperty("pluginActions");
    expect(result).not.toHaveProperty("seenBy");
    expect(result).not.toHaveProperty("participants");
    expect(result.id).toBe("event-1");

    // Stack frames truncated
    const values = (result.exception as Record<string, unknown>).values as Record<
      string,
      unknown
    >[];
    const stacktrace = values[0].stacktrace as Record<string, unknown>;
    expect((stacktrace.frames as unknown[]).length).toBe(15);
    expect(stacktrace._truncated).toEqual({ kept: 15, total: 20 });

    // Breadcrumbs truncated
    expect((result.breadcrumbs as unknown[]).length).toBe(20);
    expect(result._breadcrumbsTruncated).toEqual({ kept: 20, total: 30 });
  });

  it("handles null input", () => {
    expect(transformSentryResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformSentryResponse(undefined)).toBeUndefined();
  });
});

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = { id: "1", title: "Bug", pluginActions: [] };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    // Internal keys should be stripped in the output
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: "1", title: "Bug" });
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
