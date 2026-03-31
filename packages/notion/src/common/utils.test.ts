import {
  flattenRichText,
  flattenBlocks,
  stripNotionMetadata,
  truncateBlocks,
  transformNotionResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// ===========================================================================
// flattenRichText
// ===========================================================================

describe("flattenRichText", () => {
  it("flattens plain text segments into a single string", () => {
    const richText = [
      { type: "text", plain_text: "Hello ", text: { content: "Hello " } },
      { type: "text", plain_text: "world", text: { content: "world" } },
    ];
    expect(flattenRichText(richText)).toBe("Hello world");
  });

  it("handles mention segments with user name", () => {
    const richText = [
      { type: "text", plain_text: "Assigned to " },
      {
        type: "mention",
        plain_text: "@Alice",
        mention: { type: "user", user: { name: "Alice" } },
      },
    ];
    expect(flattenRichText(richText)).toBe("Assigned to @Alice");
  });

  it("handles equation segments", () => {
    const richText = [
      {
        type: "equation",
        plain_text: "E = mc^2",
        equation: { expression: "E = mc^2" },
      },
    ];
    expect(flattenRichText(richText)).toBe("E = mc^2");
  });

  it("handles date mentions", () => {
    const richText = [
      {
        type: "mention",
        mention: { type: "date", date: { start: "2024-01-15" } },
      },
    ];
    expect(flattenRichText(richText)).toBe("2024-01-15");
  });

  it("handles page mentions", () => {
    const richText = [
      {
        type: "mention",
        mention: { type: "page", page: { id: "abc123" } },
      },
    ];
    expect(flattenRichText(richText)).toBe("[page mention]");
  });

  it("returns empty string for non-array input", () => {
    expect(flattenRichText(null as unknown as unknown[])).toBe("");
    expect(flattenRichText(undefined as unknown as unknown[])).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(flattenRichText([])).toBe("");
  });

  it("skips null/undefined segments", () => {
    const richText = [null, { type: "text", plain_text: "hello" }, undefined];
    expect(flattenRichText(richText)).toBe("hello");
  });
});

// ===========================================================================
// flattenBlocks
// ===========================================================================

describe("flattenBlocks", () => {
  it("renders paragraph blocks", () => {
    const blocks = [
      { type: "paragraph", paragraph: { rich_text: [{ plain_text: "Hello world" }] }, _depth: 0 },
    ];
    expect(flattenBlocks(blocks)).toEqual(["Hello world"]);
  });

  it("renders heading blocks with correct markdown levels", () => {
    const blocks = [
      { type: "heading_1", heading_1: { rich_text: [{ plain_text: "Title" }] }, _depth: 0 },
      { type: "heading_2", heading_2: { rich_text: [{ plain_text: "Subtitle" }] }, _depth: 0 },
      { type: "heading_3", heading_3: { rich_text: [{ plain_text: "Section" }] }, _depth: 0 },
    ];
    expect(flattenBlocks(blocks)).toEqual(["# Title", "## Subtitle", "### Section"]);
  });

  it("renders bulleted and numbered list items", () => {
    const blocks = [
      {
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [{ plain_text: "Bullet" }] },
        _depth: 0,
      },
      {
        type: "numbered_list_item",
        numbered_list_item: { rich_text: [{ plain_text: "Number" }] },
        _depth: 0,
      },
    ];
    expect(flattenBlocks(blocks)).toEqual(["- Bullet", "1. Number"]);
  });

  it("renders to_do blocks with checked/unchecked state", () => {
    const blocks = [
      { type: "to_do", to_do: { rich_text: [{ plain_text: "Done" }], checked: true }, _depth: 0 },
      {
        type: "to_do",
        to_do: { rich_text: [{ plain_text: "Pending" }], checked: false },
        _depth: 0,
      },
    ];
    expect(flattenBlocks(blocks)).toEqual(["[x] Done", "[ ] Pending"]);
  });

  it("renders code blocks with language", () => {
    const blocks = [
      {
        type: "code",
        code: { rich_text: [{ plain_text: "console.log(1)" }], language: "javascript" },
        _depth: 0,
      },
    ];
    expect(flattenBlocks(blocks)).toEqual(["```javascript\nconsole.log(1)\n```"]);
  });

  it("renders divider blocks", () => {
    const blocks = [{ type: "divider", divider: {}, _depth: 0 }];
    expect(flattenBlocks(blocks)).toEqual(["---"]);
  });

  it("renders quote blocks", () => {
    const blocks = [
      { type: "quote", quote: { rich_text: [{ plain_text: "A quote" }] }, _depth: 0 },
    ];
    expect(flattenBlocks(blocks)).toEqual(["> A quote"]);
  });

  it("renders callout blocks with emoji", () => {
    const blocks = [
      {
        type: "callout",
        callout: {
          rich_text: [{ plain_text: "Important" }],
          icon: { type: "emoji", emoji: "💡" },
        },
        _depth: 0,
      },
    ];
    expect(flattenBlocks(blocks)).toEqual(["💡 Important"]);
  });

  it("renders bookmark blocks", () => {
    const blocks = [{ type: "bookmark", bookmark: { url: "https://example.com" }, _depth: 0 }];
    expect(flattenBlocks(blocks)).toEqual(["[Bookmark: https://example.com]"]);
  });

  it("renders table_row blocks", () => {
    const blocks = [
      {
        type: "table_row",
        table_row: {
          cells: [[{ plain_text: "A" }], [{ plain_text: "B" }]],
        },
        _depth: 0,
      },
    ];
    expect(flattenBlocks(blocks)).toEqual(["| A | B |"]);
  });

  it("indents nested blocks based on depth", () => {
    const blocks = [
      { type: "paragraph", paragraph: { rich_text: [{ plain_text: "Top" }] }, _depth: 0 },
      { type: "paragraph", paragraph: { rich_text: [{ plain_text: "Nested" }] }, _depth: 1 },
      { type: "paragraph", paragraph: { rich_text: [{ plain_text: "Deep" }] }, _depth: 2 },
    ];
    expect(flattenBlocks(blocks)).toEqual(["Top", "  Nested", "    Deep"]);
  });

  it("returns empty array for non-array input", () => {
    expect(flattenBlocks(null as unknown as unknown[])).toEqual([]);
  });

  it("skips null/undefined blocks", () => {
    const blocks = [
      null,
      { type: "paragraph", paragraph: { rich_text: [{ plain_text: "Valid" }] }, _depth: 0 },
    ];
    expect(flattenBlocks(blocks)).toEqual(["Valid"]);
  });

  it("renders child_page blocks", () => {
    const blocks = [{ type: "child_page", child_page: { title: "Sub Page" }, _depth: 0 }];
    expect(flattenBlocks(blocks)).toEqual(["[Child page: Sub Page]"]);
  });
});

// ===========================================================================
// stripNotionMetadata
// ===========================================================================

describe("stripNotionMetadata", () => {
  it("removes default Notion metadata keys", () => {
    const input = {
      id: "abc",
      object: "page",
      request_id: "req-123",
      developer_survey: "https://...",
      public_url: null,
      title: "My Page",
    };
    const result = stripNotionMetadata(input) as Record<string, unknown>;
    expect(result).toEqual({ id: "abc", title: "My Page" });
  });

  it("handles nested objects recursively", () => {
    const input = {
      id: "1",
      parent: { object: "workspace", type: "workspace" },
    };
    const result = stripNotionMetadata(input) as Record<string, unknown>;
    expect(result).toEqual({ id: "1", parent: { type: "workspace" } });
  });

  it("handles arrays", () => {
    const input = [
      { id: "1", object: "page" },
      { id: "2", object: "database" },
    ];
    const result = stripNotionMetadata(input) as Record<string, unknown>[];
    expect(result).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(stripNotionMetadata(null)).toBeNull();
    expect(stripNotionMetadata(undefined)).toBeUndefined();
    expect(stripNotionMetadata(42)).toBe(42);
    expect(stripNotionMetadata("hello")).toBe("hello");
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripNotionMetadata(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

// ===========================================================================
// truncateBlocks
// ===========================================================================

describe("truncateBlocks", () => {
  it("returns blocks unchanged when under the limit", () => {
    const blocks = [{ type: "paragraph" }, { type: "paragraph" }];
    expect(truncateBlocks(blocks, 100)).toEqual(blocks);
  });

  it("truncates blocks exceeding the limit and adds marker", () => {
    const blocks = Array.from({ length: 150 }, (_, i) => ({ type: "paragraph", id: i }));
    const result = truncateBlocks(blocks, 100);

    expect(result).toHaveLength(101);
    const marker = result[100] as Record<string, unknown>;
    expect(marker._truncated).toBe(true);
    expect(marker.message).toBe("[Truncated: showing 100 of 150 total blocks]");
  });

  it("uses default max of 100", () => {
    const blocks = Array.from({ length: 110 }, () => ({ type: "paragraph" }));
    const result = truncateBlocks(blocks);
    expect(result).toHaveLength(101);
  });

  it("returns non-array input unchanged", () => {
    expect(truncateBlocks(null as unknown as unknown[])).toBeNull();
  });
});

// ===========================================================================
// transformNotionResponse
// ===========================================================================

describe("transformNotionResponse", () => {
  it("strips metadata from Notion response", () => {
    const input = { id: "123", object: "page", request_id: "req-1", title: "Test" };
    const result = transformNotionResponse(input) as Record<string, unknown>;
    expect(result).toEqual({ id: "123", title: "Test" });
  });

  it("handles null input", () => {
    expect(transformNotionResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformNotionResponse(undefined)).toBeUndefined();
  });
});

// ===========================================================================
// formatMcpResponse
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = { id: "1", object: "page", title: "Bug" };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

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
