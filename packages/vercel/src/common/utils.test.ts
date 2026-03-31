import {
  stripVercelMetadata,
  stripAnsiCodes,
  truncateBuildLogs,
  transformVercelResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// ===========================================================================
// stripVercelMetadata
// ===========================================================================

describe("stripVercelMetadata", () => {
  it("removes default internal keys from a flat object", () => {
    const input = {
      id: "prj_123",
      name: "my-app",
      ownerId: "owner_abc",
      accountId: "acct_xyz",
      plan: "pro",
      analytics: { id: "an_1" },
      speedInsights: { enabled: true },
      autoExposeSystemEnvs: true,
      directoryListing: false,
      skewProtection: { enabled: false },
    };

    const result = stripVercelMetadata(input) as Record<string, unknown>;

    expect(result).toEqual({ id: "prj_123", name: "my-app" });
    expect(result).not.toHaveProperty("ownerId");
    expect(result).not.toHaveProperty("accountId");
    expect(result).not.toHaveProperty("plan");
    expect(result).not.toHaveProperty("analytics");
    expect(result).not.toHaveProperty("speedInsights");
    expect(result).not.toHaveProperty("autoExposeSystemEnvs");
    expect(result).not.toHaveProperty("directoryListing");
    expect(result).not.toHaveProperty("skewProtection");
  });

  it("preserves keys that are not in the strip list", () => {
    const input = { name: "my-app", framework: "nextjs", nodeVersion: "20.x" };
    expect(stripVercelMetadata(input)).toEqual(input);
  });

  it("handles nested objects recursively", () => {
    const input = {
      project: {
        id: "prj_1",
        ownerId: "owner_1",
        settings: {
          accountId: "acct_1",
          buildCommand: "npm run build",
        },
      },
    };

    const result = stripVercelMetadata(input) as Record<string, unknown>;
    const project = result.project as Record<string, unknown>;

    expect(project).not.toHaveProperty("ownerId");
    expect(project.id).toBe("prj_1");

    const settings = project.settings as Record<string, unknown>;
    expect(settings).not.toHaveProperty("accountId");
    expect(settings.buildCommand).toBe("npm run build");
  });

  it("handles arrays by stripping keys from each element", () => {
    const input = [
      { id: "1", ownerId: "o1", name: "App A" },
      { id: "2", accountId: "a2", name: "App B" },
    ];

    const result = stripVercelMetadata(input) as Record<string, unknown>[];
    expect(result).toEqual([
      { id: "1", name: "App A" },
      { id: "2", name: "App B" },
    ]);
  });

  it("returns null unchanged", () => {
    expect(stripVercelMetadata(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(stripVercelMetadata(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(stripVercelMetadata(42)).toBe(42);
    expect(stripVercelMetadata("hello")).toBe("hello");
    expect(stripVercelMetadata(true)).toBe(true);
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripVercelMetadata(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

// ===========================================================================
// stripAnsiCodes
// ===========================================================================

describe("stripAnsiCodes", () => {
  it("strips color codes from text", () => {
    const input = "\x1b[31mError:\x1b[0m Something failed";
    expect(stripAnsiCodes(input)).toBe("Error: Something failed");
  });

  it("strips bold and underline codes", () => {
    const input = "\x1b[1mBold\x1b[0m and \x1b[4mUnderline\x1b[0m";
    expect(stripAnsiCodes(input)).toBe("Bold and Underline");
  });

  it("strips multiple ANSI codes in sequence", () => {
    const input = "\x1b[32m\x1b[1mSuccess\x1b[0m";
    expect(stripAnsiCodes(input)).toBe("Success");
  });

  it("returns plain text unchanged", () => {
    const input = "No ANSI codes here";
    expect(stripAnsiCodes(input)).toBe("No ANSI codes here");
  });

  it("handles empty string", () => {
    expect(stripAnsiCodes("")).toBe("");
  });

  it("strips complex SGR parameters", () => {
    const input = "\x1b[38;5;196mRed text\x1b[0m";
    expect(stripAnsiCodes(input)).toBe("Red text");
  });
});

// ===========================================================================
// truncateBuildLogs
// ===========================================================================

describe("truncateBuildLogs", () => {
  it("returns all lines when under the limit", () => {
    const lines = ["line 1", "line 2", "line 3"];
    const result = truncateBuildLogs(lines);
    expect(result).toBe("line 1\nline 2\nline 3");
  });

  it("returns all lines when exactly at the limit", () => {
    const lines = Array.from({ length: 150 }, (_, i) => `line ${i}`);
    const result = truncateBuildLogs(lines);
    expect(result).toBe(lines.join("\n"));
    expect(result).not.toContain("[truncated");
  });

  it("truncates lines over the limit and adds a marker", () => {
    const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`);
    const result = truncateBuildLogs(lines);

    expect(result).toContain("[truncated — showing last 150 of 200 lines]");
    expect(result).toContain("line 50");
    expect(result).toContain("line 199");
    expect(result).not.toContain("line 49\n");
  });

  it("respects custom max lines parameter", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i}`);
    const result = truncateBuildLogs(lines, 5);

    expect(result).toContain("[truncated — showing last 5 of 20 lines]");
    expect(result).toContain("line 15");
    expect(result).toContain("line 19");
  });

  it("handles empty array", () => {
    expect(truncateBuildLogs([])).toBe("");
  });

  it("handles single line", () => {
    expect(truncateBuildLogs(["only line"])).toBe("only line");
  });
});

// ===========================================================================
// transformVercelResponse
// ===========================================================================

describe("transformVercelResponse", () => {
  it("strips internal metadata keys", () => {
    const input = {
      id: "prj_1",
      name: "my-app",
      ownerId: "owner_abc",
      accountId: "acct_xyz",
      framework: "nextjs",
    };

    const result = transformVercelResponse(input) as Record<string, unknown>;

    expect(result).not.toHaveProperty("ownerId");
    expect(result).not.toHaveProperty("accountId");
    expect(result.id).toBe("prj_1");
    expect(result.name).toBe("my-app");
    expect(result.framework).toBe("nextjs");
  });

  it("handles null input", () => {
    expect(transformVercelResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformVercelResponse(undefined)).toBeUndefined();
  });

  it("handles array of projects", () => {
    const input = [
      { id: "1", name: "App A", ownerId: "o1" },
      { id: "2", name: "App B", plan: "hobby" },
    ];

    const result = transformVercelResponse(input) as Record<string, unknown>[];
    expect(result).toEqual([
      { id: "1", name: "App A" },
      { id: "2", name: "App B" },
    ]);
  });
});

// ===========================================================================
// formatMcpResponse
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = { id: "1", name: "my-app", ownerId: "owner_abc" };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: "1", name: "my-app" });
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

// ===========================================================================
// formatMcpError
// ===========================================================================

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
