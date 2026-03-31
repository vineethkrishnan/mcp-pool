import {
  flattenProperties,
  stripHubSpotMetadata,
  simplifyAssociations,
  transformHubSpotResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// ===========================================================================
// flattenProperties
// ===========================================================================

describe("flattenProperties", () => {
  it("flattens properties object to top-level fields", () => {
    const input = {
      id: "123",
      properties: { firstname: "John", lastname: "Doe", email: "john@example.com" },
    };

    const result = flattenProperties(input) as Record<string, unknown>;

    expect(result.id).toBe("123");
    expect(result.firstname).toBe("John");
    expect(result.lastname).toBe("Doe");
    expect(result.email).toBe("john@example.com");
    expect(result).not.toHaveProperty("properties");
  });

  it("preserves non-properties fields alongside flattened properties", () => {
    const input = {
      id: "456",
      properties: { dealname: "Big Deal" },
      associations: { contacts: { results: [] } },
    };

    const result = flattenProperties(input) as Record<string, unknown>;

    expect(result.id).toBe("456");
    expect(result.dealname).toBe("Big Deal");
    expect(result.associations).toBeDefined();
  });

  it("handles arrays by flattening each element", () => {
    const input = [
      { id: "1", properties: { firstname: "Alice" } },
      { id: "2", properties: { firstname: "Bob" } },
    ];

    const result = flattenProperties(input) as Record<string, unknown>[];

    expect(result[0]).toEqual({ id: "1", firstname: "Alice" });
    expect(result[1]).toEqual({ id: "2", firstname: "Bob" });
  });

  it("returns objects without properties key unchanged", () => {
    const input = { id: "789", name: "Test" };
    expect(flattenProperties(input)).toEqual(input);
  });

  it("returns null unchanged", () => {
    expect(flattenProperties(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(flattenProperties(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(flattenProperties(42)).toBe(42);
    expect(flattenProperties("hello")).toBe("hello");
    expect(flattenProperties(true)).toBe(true);
  });

  it("handles null properties value", () => {
    const input = { id: "123", properties: null };
    expect(flattenProperties(input)).toEqual(input);
  });

  it("handles empty properties object", () => {
    const input = { id: "123", properties: {} };
    const result = flattenProperties(input) as Record<string, unknown>;
    expect(result).toEqual({ id: "123" });
  });
});

// ===========================================================================
// stripHubSpotMetadata
// ===========================================================================

describe("stripHubSpotMetadata", () => {
  it("removes default HubSpot metadata keys", () => {
    const input = {
      id: "123",
      firstname: "John",
      archived: false,
      archivedAt: null,
      propertiesWithHistory: { firstname: [{ value: "John" }] },
      properties_with_history: { firstname: [{ value: "John" }] },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    const result = stripHubSpotMetadata(input) as Record<string, unknown>;

    expect(result).toEqual({ id: "123", firstname: "John" });
    expect(result).not.toHaveProperty("archived");
    expect(result).not.toHaveProperty("archivedAt");
    expect(result).not.toHaveProperty("propertiesWithHistory");
    expect(result).not.toHaveProperty("properties_with_history");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("updatedAt");
  });

  it("preserves keys not in the strip list", () => {
    const input = { id: "123", firstname: "John", email: "john@example.com" };
    expect(stripHubSpotMetadata(input)).toEqual(input);
  });

  it("handles nested objects recursively", () => {
    const input = {
      record: {
        id: "1",
        archived: true,
        data: {
          createdAt: "2024-01-01",
          value: "important",
        },
      },
    };

    const result = stripHubSpotMetadata(input) as Record<string, unknown>;
    const record = result.record as Record<string, unknown>;

    expect(record).not.toHaveProperty("archived");
    expect(record.id).toBe("1");

    const data = record.data as Record<string, unknown>;
    expect(data).not.toHaveProperty("createdAt");
    expect(data.value).toBe("important");
  });

  it("handles arrays by stripping keys from each element", () => {
    const input = [
      { id: "1", archived: false, firstname: "Alice" },
      { id: "2", archived: true, firstname: "Bob" },
    ];

    const result = stripHubSpotMetadata(input) as Record<string, unknown>[];
    expect(result).toEqual([
      { id: "1", firstname: "Alice" },
      { id: "2", firstname: "Bob" },
    ]);
  });

  it("returns null unchanged", () => {
    expect(stripHubSpotMetadata(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(stripHubSpotMetadata(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(stripHubSpotMetadata(42)).toBe(42);
    expect(stripHubSpotMetadata("hello")).toBe("hello");
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripHubSpotMetadata(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

// ===========================================================================
// simplifyAssociations
// ===========================================================================

describe("simplifyAssociations", () => {
  it("simplifies associations to ID arrays with capitalized key names", () => {
    const input = {
      id: "123",
      firstname: "John",
      associations: {
        companies: {
          results: [
            { id: "456", type: "contact_to_company" },
            { id: "789", type: "contact_to_company" },
          ],
        },
        deals: {
          results: [{ id: "111", type: "contact_to_deal" }],
        },
      },
    };

    const result = simplifyAssociations(input) as Record<string, unknown>;

    expect(result.id).toBe("123");
    expect(result.firstname).toBe("John");
    expect(result.associatedCompaniesIds).toEqual(["456", "789"]);
    expect(result.associatedDealsIds).toEqual(["111"]);
    expect(result).not.toHaveProperty("associations");
  });

  it("handles empty association results", () => {
    const input = {
      id: "123",
      associations: {
        companies: { results: [] },
      },
    };

    const result = simplifyAssociations(input) as Record<string, unknown>;
    expect(result.associatedCompaniesIds).toEqual([]);
  });

  it("handles arrays by simplifying each element", () => {
    const input = [
      {
        id: "1",
        associations: {
          companies: { results: [{ id: "10", type: "t" }] },
        },
      },
      {
        id: "2",
        associations: {
          deals: { results: [{ id: "20", type: "t" }] },
        },
      },
    ];

    const result = simplifyAssociations(input) as Record<string, unknown>[];
    expect(result[0]).toEqual({ id: "1", associatedCompaniesIds: ["10"] });
    expect(result[1]).toEqual({ id: "2", associatedDealsIds: ["20"] });
  });

  it("returns objects without associations unchanged", () => {
    const input = { id: "123", name: "Test" };
    expect(simplifyAssociations(input)).toEqual(input);
  });

  it("returns null unchanged", () => {
    expect(simplifyAssociations(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(simplifyAssociations(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(simplifyAssociations(42)).toBe(42);
    expect(simplifyAssociations("hello")).toBe("hello");
  });

  it("handles null associations value", () => {
    const input = { id: "123", associations: null };
    expect(simplifyAssociations(input)).toEqual(input);
  });
});

// ===========================================================================
// transformHubSpotResponse
// ===========================================================================

describe("transformHubSpotResponse", () => {
  it("composes flatten, strip, and simplify transforms", () => {
    const input = {
      id: "123",
      properties: { firstname: "John", lastname: "Doe" },
      archived: false,
      archivedAt: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      associations: {
        companies: {
          results: [{ id: "456", type: "contact_to_company" }],
        },
      },
    };

    const result = transformHubSpotResponse(input) as Record<string, unknown>;

    // Properties flattened
    expect(result.id).toBe("123");
    expect(result.firstname).toBe("John");
    expect(result.lastname).toBe("Doe");
    expect(result).not.toHaveProperty("properties");

    // Metadata stripped
    expect(result).not.toHaveProperty("archived");
    expect(result).not.toHaveProperty("archivedAt");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("updatedAt");

    // Associations simplified
    expect(result.associatedCompaniesIds).toEqual(["456"]);
    expect(result).not.toHaveProperty("associations");
  });

  it("handles array of records", () => {
    const input = [
      {
        id: "1",
        properties: { firstname: "Alice" },
        archived: false,
      },
      {
        id: "2",
        properties: { firstname: "Bob" },
        archived: true,
      },
    ];

    const result = transformHubSpotResponse(input) as Record<string, unknown>[];

    expect(result[0]).toEqual({ id: "1", firstname: "Alice" });
    expect(result[1]).toEqual({ id: "2", firstname: "Bob" });
  });

  it("handles null input", () => {
    expect(transformHubSpotResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformHubSpotResponse(undefined)).toBeUndefined();
  });
});

// ===========================================================================
// formatMcpResponse
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = {
      id: "1",
      properties: { firstname: "John" },
      archived: false,
    };

    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: "1", firstname: "John" });
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
