import {
  flattenConnection,
  flattenNode,
  mapPriority,
  mapPriorities,
  stripGraphQLMetadata,
  transformLinearResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// ===========================================================================
// flattenConnection
// ===========================================================================

describe("flattenConnection", () => {
  it("converts {nodes: [...]} to a plain array", () => {
    const input = {
      labels: {
        nodes: [
          { id: "l1", name: "Bug" },
          { id: "l2", name: "Feature" },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    };

    const result = flattenConnection(input) as Record<string, unknown>;
    expect(result.labels).toEqual([
      { id: "l1", name: "Bug" },
      { id: "l2", name: "Feature" },
    ]);
  });

  it("flattens nested connections recursively", () => {
    const input = {
      issues: {
        nodes: [
          {
            id: "i1",
            labels: {
              nodes: [{ name: "Bug" }],
            },
          },
        ],
      },
    };

    const result = flattenConnection(input) as Record<string, unknown>;
    const issues = result.issues as Record<string, unknown>[];
    expect(issues[0].labels).toEqual([{ name: "Bug" }]);
  });

  it("leaves non-connection objects unchanged", () => {
    const input = { id: "123", title: "Test", assignee: { name: "Alice" } };
    expect(flattenConnection(input)).toEqual(input);
  });

  it("handles arrays by mapping each element", () => {
    const input = [
      { teams: { nodes: [{ name: "Engineering" }] } },
      { teams: { nodes: [{ name: "Design" }] } },
    ];

    const result = flattenConnection(input) as Record<string, unknown>[];
    expect(result[0].teams).toEqual([{ name: "Engineering" }]);
    expect(result[1].teams).toEqual([{ name: "Design" }]);
  });

  it("returns null unchanged", () => {
    expect(flattenConnection(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(flattenConnection(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(flattenConnection(42)).toBe(42);
    expect(flattenConnection("hello")).toBe("hello");
    expect(flattenConnection(true)).toBe(true);
  });

  it("handles empty nodes array", () => {
    const input = { labels: { nodes: [] } };
    const result = flattenConnection(input) as Record<string, unknown>;
    expect(result.labels).toEqual([]);
  });
});

// ===========================================================================
// flattenNode
// ===========================================================================

describe("flattenNode", () => {
  it("strips __typename from objects", () => {
    const input = { id: "1", name: "Bug", __typename: "Label" };
    expect(flattenNode(input)).toEqual({ id: "1", name: "Bug" });
  });

  it("strips __typename recursively from nested objects", () => {
    const input = {
      id: "i1",
      __typename: "Issue",
      assignee: { name: "Alice", __typename: "User" },
    };

    const result = flattenNode(input) as Record<string, unknown>;
    expect(result).toEqual({
      id: "i1",
      assignee: { name: "Alice" },
    });
  });

  it("handles arrays", () => {
    const input = [
      { id: "1", __typename: "Issue" },
      { id: "2", __typename: "Issue" },
    ];

    expect(flattenNode(input)).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(flattenNode(null)).toBeNull();
    expect(flattenNode(undefined)).toBeUndefined();
    expect(flattenNode(42)).toBe(42);
  });
});

// ===========================================================================
// mapPriority
// ===========================================================================

describe("mapPriority", () => {
  it("maps 0 to No Priority", () => {
    expect(mapPriority(0)).toBe("No Priority");
  });

  it("maps 1 to Urgent", () => {
    expect(mapPriority(1)).toBe("Urgent");
  });

  it("maps 2 to High", () => {
    expect(mapPriority(2)).toBe("High");
  });

  it("maps 3 to Medium", () => {
    expect(mapPriority(3)).toBe("Medium");
  });

  it("maps 4 to Low", () => {
    expect(mapPriority(4)).toBe("Low");
  });

  it("handles unknown priority values", () => {
    expect(mapPriority(99)).toBe("Unknown (99)");
  });
});

// ===========================================================================
// mapPriorities
// ===========================================================================

describe("mapPriorities", () => {
  it("replaces numeric priority with level and label object", () => {
    const input = { id: "i1", priority: 2, title: "Bug" };
    const result = mapPriorities(input) as Record<string, unknown>;

    expect(result.priority).toEqual({ level: 2, label: "High" });
    expect(result.title).toBe("Bug");
  });

  it("maps priorities recursively in nested objects", () => {
    const input = {
      issues: [
        { priority: 1, title: "Urgent bug" },
        { priority: 4, title: "Low issue" },
      ],
    };

    const result = mapPriorities(input) as Record<string, unknown>;
    const issues = result.issues as Record<string, unknown>[];
    expect(issues[0].priority).toEqual({ level: 1, label: "Urgent" });
    expect(issues[1].priority).toEqual({ level: 4, label: "Low" });
  });

  it("leaves non-numeric priority values unchanged", () => {
    const input = { priority: "high" };
    const result = mapPriorities(input) as Record<string, unknown>;
    expect(result.priority).toBe("high");
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(mapPriorities(null)).toBeNull();
    expect(mapPriorities(undefined)).toBeUndefined();
    expect(mapPriorities(42)).toBe(42);
  });
});

// ===========================================================================
// stripGraphQLMetadata
// ===========================================================================

describe("stripGraphQLMetadata", () => {
  it("removes __typename from a flat object", () => {
    const input = { id: "1", name: "Bug", __typename: "Label" };
    const result = stripGraphQLMetadata(input) as Record<string, unknown>;

    expect(result).toEqual({ id: "1", name: "Bug" });
    expect(result).not.toHaveProperty("__typename");
  });

  it("removes pageInfo from objects", () => {
    const input = {
      id: "1",
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    const result = stripGraphQLMetadata(input) as Record<string, unknown>;
    expect(result).toEqual({ id: "1" });
  });

  it("removes all LINEAR_STRIP_KEYS from nested objects", () => {
    const input = {
      issue: {
        id: "i1",
        __typename: "Issue",
        sortOrder: 1.5,
        boardOrder: 2.0,
        archivedAt: null,
        trashed: false,
        title: "Bug fix",
      },
    };

    const result = stripGraphQLMetadata(input) as Record<string, unknown>;
    const issue = result.issue as Record<string, unknown>;

    expect(issue).toEqual({ id: "i1", title: "Bug fix" });
  });

  it("handles arrays by stripping keys from each element", () => {
    const input = [
      { id: "1", __typename: "Issue" },
      { id: "2", __typename: "Issue" },
    ];

    expect(stripGraphQLMetadata(input)).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(stripGraphQLMetadata(null)).toBeNull();
    expect(stripGraphQLMetadata(undefined)).toBeUndefined();
    expect(stripGraphQLMetadata(42)).toBe(42);
    expect(stripGraphQLMetadata("hello")).toBe("hello");
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripGraphQLMetadata(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

// ===========================================================================
// transformLinearResponse
// ===========================================================================

describe("transformLinearResponse", () => {
  it("composes connection flattening, metadata stripping, and priority mapping", () => {
    const input = {
      id: "i1",
      __typename: "Issue",
      priority: 2,
      sortOrder: 1.5,
      labels: {
        nodes: [{ name: "Bug", __typename: "Label" }],
        pageInfo: { hasNextPage: false },
      },
    };

    const result = transformLinearResponse(input) as Record<string, unknown>;

    // Connection flattened
    expect(result.labels).toEqual([{ name: "Bug" }]);
    // Metadata stripped
    expect(result).not.toHaveProperty("__typename");
    expect(result).not.toHaveProperty("sortOrder");
    // Priority mapped
    expect(result.priority).toEqual({ level: 2, label: "High" });
  });

  it("handles null input", () => {
    expect(transformLinearResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformLinearResponse(undefined)).toBeUndefined();
  });

  it("handles array of issues", () => {
    const input = [
      { id: "i1", priority: 1, __typename: "Issue" },
      { id: "i2", priority: 4, __typename: "Issue" },
    ];

    const result = transformLinearResponse(input) as Record<string, unknown>[];
    expect(result[0].priority).toEqual({ level: 1, label: "Urgent" });
    expect(result[1].priority).toEqual({ level: 4, label: "Low" });
    expect(result[0]).not.toHaveProperty("__typename");
  });
});

// ===========================================================================
// formatMcpResponse
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = { id: "1", title: "Bug", __typename: "Issue", priority: 2 };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).not.toHaveProperty("__typename");
    expect(parsed.priority).toEqual({ level: 2, label: "High" });
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
