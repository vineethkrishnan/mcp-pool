import {
  stripHtml,
  flattenConversationParts,
  truncateConversationParts,
  stripIntercomMetadata,
  transformIntercomResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// =========================================================================
// stripHtml
// =========================================================================

describe("stripHtml", () => {
  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns empty string for null/undefined", () => {
    expect(stripHtml(null as unknown as string)).toBe("");
    expect(stripHtml(undefined as unknown as string)).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("Hello world")).toBe("Hello world");
  });

  it("converts <br> tags to newlines", () => {
    expect(stripHtml("Hello<br>World")).toBe("Hello\nWorld");
    expect(stripHtml("Hello<br/>World")).toBe("Hello\nWorld");
    expect(stripHtml("Hello<br />World")).toBe("Hello\nWorld");
  });

  it("converts </p> to double newlines", () => {
    expect(stripHtml("<p>First paragraph</p><p>Second paragraph</p>")).toBe(
      "First paragraph\n\nSecond paragraph",
    );
  });

  it("converts <li> to bullet points", () => {
    expect(stripHtml("<ul><li>Item 1</li><li>Item 2</li></ul>")).toBe("- Item 1\n- Item 2");
  });

  it("strips inline formatting tags", () => {
    expect(stripHtml("<b>Bold</b> and <em>italic</em>")).toBe("Bold and italic");
  });

  it("strips anchor tags", () => {
    expect(stripHtml('<a href="https://example.com">Link</a>')).toBe("Link");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("&amp; &lt; &gt; &nbsp;")).toBe("& < >");
  });

  it("collapses excessive newlines", () => {
    expect(stripHtml("<p>A</p><p></p><p>B</p>")).toBe("A\n\nB");
  });

  it("strips heading tags", () => {
    expect(stripHtml("<h1>Title</h1><h2>Subtitle</h2>")).toBe("TitleSubtitle");
  });

  it("handles complex nested HTML", () => {
    const html = "<div><p>Hello <strong>world</strong></p><ul><li>One</li><li>Two</li></ul></div>";
    const result = stripHtml(html);
    expect(result).toBe("Hello world\n\n- One\n- Two");
  });
});

// =========================================================================
// flattenConversationParts
// =========================================================================

describe("flattenConversationParts", () => {
  it("includes source as the first part", () => {
    const conversation = {
      created_at: 1700000000,
      source: {
        author: { type: "user", id: "u1", name: "Alice" },
        delivered_as: "customer_initiated",
        body: "<p>Help me please</p>",
      },
      conversation_parts: { conversation_parts: [] },
    };

    const result = flattenConversationParts(conversation);

    expect(result).toHaveLength(1);
    expect(result[0].author).toBe("Alice (user #u1)");
    expect(result[0].type).toBe("customer_initiated");
    expect(result[0].body).toBe("Help me please");
    expect(result[0].timestamp).toBe("2023-11-14T22:13:20.000Z");
  });

  it("flattens conversation parts with source", () => {
    const conversation = {
      created_at: 1700000000,
      source: {
        author: { type: "user", id: "u1", name: "Alice" },
        delivered_as: "customer_initiated",
        body: "Hello",
      },
      conversation_parts: {
        conversation_parts: [
          {
            author: { type: "admin", id: "a1", name: "Bob" },
            part_type: "comment",
            body: "<p>Hi Alice!</p>",
            created_at: 1700000060,
          },
          {
            author: { type: "admin", id: "a1", name: "Bob" },
            part_type: "assignment",
            body: null,
            created_at: 1700000120,
          },
        ],
      },
    };

    const result = flattenConversationParts(conversation);

    expect(result).toHaveLength(3);
    expect(result[1].author).toBe("Bob (admin #a1)");
    expect(result[1].type).toBe("comment");
    expect(result[1].body).toBe("Hi Alice!");
    expect(result[2].type).toBe("assignment");
    expect(result[2].body).toBe("");
  });

  it("handles conversation with no parts", () => {
    const conversation = {
      created_at: 1700000000,
      source: {
        author: { type: "user", id: "u1", name: "Alice" },
        delivered_as: "customer_initiated",
        body: "Hello",
      },
    };

    const result = flattenConversationParts(conversation);
    expect(result).toHaveLength(1);
  });

  it("handles missing author gracefully", () => {
    const conversation = {
      created_at: 1700000000,
      source: {
        author: null,
        delivered_as: "automated",
        body: "Automated message",
      },
      conversation_parts: { conversation_parts: [] },
    };

    const result = flattenConversationParts(conversation);
    expect(result[0].author).toBe("unknown");
  });
});

// =========================================================================
// truncateConversationParts
// =========================================================================

describe("truncateConversationParts", () => {
  function makeParts(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      author: `user-${i}`,
      type: "message",
      body: `Message ${i}`,
      timestamp: `2023-01-01T00:00:${String(i).padStart(2, "0")}.000Z`,
    }));
  }

  it("returns parts unchanged when under the limit", () => {
    const parts = makeParts(30);
    expect(truncateConversationParts(parts)).toEqual(parts);
  });

  it("returns parts unchanged at exactly the limit", () => {
    const parts = makeParts(50);
    expect(truncateConversationParts(parts)).toEqual(parts);
  });

  it("truncates parts over the limit", () => {
    const parts = makeParts(100);
    const result = truncateConversationParts(parts);

    // 5 first + 1 truncation marker + 44 last = 50
    expect(result).toHaveLength(50);
    expect(result[0].body).toBe("Message 0");
    expect(result[4].body).toBe("Message 4");
    expect(result[5].type).toBe("truncated");
    expect(result[5].body).toBe("--- 51 parts omitted ---");
    expect(result[6].body).toBe("Message 56");
    expect(result[49].body).toBe("Message 99");
  });
});

// =========================================================================
// stripIntercomMetadata
// =========================================================================

describe("stripIntercomMetadata", () => {
  it("strips default keys from objects", () => {
    const input = {
      id: "123",
      statistics: { time_to_reply: 60 },
      sla_applied: { sla_name: "Premium" },
      linked_objects: { data: [] },
      conversation_rating: { rating: 5 },
      teammates: [{ id: "admin1" }],
      state: "open",
    };

    const result = stripIntercomMetadata(input) as Record<string, unknown>;

    expect(result.id).toBe("123");
    expect(result.state).toBe("open");
    expect(result.statistics).toBeUndefined();
    expect(result.sla_applied).toBeUndefined();
    expect(result.linked_objects).toBeUndefined();
    expect(result.conversation_rating).toBeUndefined();
    expect(result.teammates).toBeUndefined();
  });

  it("strips keys recursively in nested objects", () => {
    const input = {
      data: {
        inner: {
          statistics: { count: 5 },
          value: "keep",
        },
      },
    };

    const result = stripIntercomMetadata(input) as Record<string, unknown>;
    const inner = (result.data as Record<string, unknown>).inner as Record<string, unknown>;

    expect(inner.statistics).toBeUndefined();
    expect(inner.value).toBe("keep");
  });

  it("strips keys from arrays", () => {
    const input = [
      { id: "1", statistics: {} },
      { id: "2", statistics: {} },
    ];

    const result = stripIntercomMetadata(input) as Array<Record<string, unknown>>;

    expect(result[0].statistics).toBeUndefined();
    expect(result[1].statistics).toBeUndefined();
    expect(result[0].id).toBe("1");
  });

  it("handles null and undefined", () => {
    expect(stripIntercomMetadata(null)).toBeNull();
    expect(stripIntercomMetadata(undefined)).toBeUndefined();
  });

  it("handles primitives", () => {
    expect(stripIntercomMetadata("hello")).toBe("hello");
    expect(stripIntercomMetadata(42)).toBe(42);
    expect(stripIntercomMetadata(true)).toBe(true);
  });

  it("strips custom keys when provided", () => {
    const input = { foo: 1, bar: 2, baz: 3 };
    const result = stripIntercomMetadata(input, ["foo", "baz"]) as Record<string, unknown>;

    expect(result.foo).toBeUndefined();
    expect(result.bar).toBe(2);
    expect(result.baz).toBeUndefined();
  });
});

// =========================================================================
// transformIntercomResponse
// =========================================================================

describe("transformIntercomResponse", () => {
  it("strips internal keys from response data", () => {
    const input = { id: "conv_1", state: "open", statistics: { replies: 5 } };
    const result = transformIntercomResponse(input) as Record<string, unknown>;

    expect(result.id).toBe("conv_1");
    expect(result.state).toBe("open");
    expect(result.statistics).toBeUndefined();
  });
});

// =========================================================================
// formatMcpResponse
// =========================================================================

describe("formatMcpResponse", () => {
  it("wraps transformed data in MCP content format", () => {
    const result = formatMcpResponse({ id: "123", statistics: {} });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe("123");
    expect(parsed.statistics).toBeUndefined();
  });

  it("does not set isError", () => {
    const result = formatMcpResponse({ id: "123" });
    expect(result.isError).toBeUndefined();
  });
});

// =========================================================================
// formatMcpError
// =========================================================================

describe("formatMcpError", () => {
  it("wraps Error instance in MCP error format", () => {
    const result = formatMcpError(new Error("Something failed"));

    expect(result.content[0].text).toBe("Error: Something failed");
    expect(result.isError).toBe(true);
  });

  it("wraps string error in MCP error format", () => {
    const result = formatMcpError("string error");

    expect(result.content[0].text).toBe("Error: string error");
    expect(result.isError).toBe(true);
  });
});
