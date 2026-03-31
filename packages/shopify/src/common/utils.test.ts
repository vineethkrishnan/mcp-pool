import {
  formatMoney,
  simplifyVariants,
  simplifyLineItems,
  stripShopifyMetadata,
  transformShopifyResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// ===========================================================================
// formatMoney
// ===========================================================================

describe("formatMoney", () => {
  it("formats USD with dollar sign", () => {
    expect(formatMoney("19.99", "USD")).toBe("$19.99 USD");
  });

  it("formats EUR with euro sign", () => {
    expect(formatMoney("29.99", "EUR")).toBe("\u20AC29.99 EUR");
  });

  it("formats GBP with pound sign", () => {
    expect(formatMoney("15.50", "GBP")).toBe("\u00A315.50 GBP");
  });

  it("formats CAD with CA$ prefix", () => {
    expect(formatMoney("42.00", "CAD")).toBe("CA$42.00 CAD");
  });

  it("formats AUD with A$ prefix", () => {
    expect(formatMoney("33.10", "AUD")).toBe("A$33.10 AUD");
  });

  it("formats JPY without decimal places", () => {
    expect(formatMoney("1500", "JPY")).toBe("\u00A51500 JPY");
  });

  it("rounds JPY correctly", () => {
    expect(formatMoney("1500.75", "JPY")).toBe("\u00A51501 JPY");
  });

  it("handles unknown currency without symbol", () => {
    expect(formatMoney("10.00", "SEK")).toBe("10.00 SEK");
  });

  it("returns empty string for null amount", () => {
    expect(formatMoney(null, "USD")).toBe("");
  });

  it("returns empty string for undefined amount", () => {
    expect(formatMoney(undefined, "USD")).toBe("");
  });

  it("returns empty string for empty string amount", () => {
    expect(formatMoney("", "USD")).toBe("");
  });

  it("returns empty string for non-numeric amount", () => {
    expect(formatMoney("abc", "USD")).toBe("");
  });

  it("pads decimal places for whole numbers", () => {
    expect(formatMoney("10", "USD")).toBe("$10.00 USD");
  });
});

// ===========================================================================
// simplifyVariants
// ===========================================================================

describe("simplifyVariants", () => {
  it("extracts essential variant fields", () => {
    const variants = [
      {
        id: 123,
        title: "Large / Red",
        price: "29.99",
        sku: "SHIRT-LG-RED",
        inventory_quantity: 15,
        option1: "Large",
        option2: "Red",
        weight: 0.5,
        admin_graphql_api_id: "gid://shopify/ProductVariant/123",
      },
    ];

    const result = simplifyVariants(variants, "USD");

    expect(result).toEqual([
      {
        title: "Large / Red",
        price: "$29.99 USD",
        sku: "SHIRT-LG-RED",
        inventory_quantity: 15,
      },
    ]);
  });

  it("handles multiple variants", () => {
    const variants = [
      { title: "Small", price: "19.99", sku: "SM", inventory_quantity: 5 },
      { title: "Large", price: "24.99", sku: "LG", inventory_quantity: 10 },
    ];

    const result = simplifyVariants(variants, "EUR");

    expect(result).toHaveLength(2);
    expect(result[0].price).toBe("\u20AC19.99 EUR");
    expect(result[1].price).toBe("\u20AC24.99 EUR");
  });

  it("returns empty array for non-array input", () => {
    expect(simplifyVariants(null as unknown as Record<string, unknown>[], "USD")).toEqual([]);
  });
});

// ===========================================================================
// simplifyLineItems
// ===========================================================================

describe("simplifyLineItems", () => {
  it("extracts essential line item fields", () => {
    const lineItems = [
      {
        id: 789,
        variant_id: 456,
        title: "Classic T-Shirt",
        variant_title: "Large / Red",
        quantity: 2,
        price: "29.99",
        sku: "SHIRT-LG-RED",
        vendor: "MyBrand",
        product_id: 123,
        fulfillment_service: "manual",
        tax_lines: [{ rate: 0.08 }],
      },
    ];

    const result = simplifyLineItems(lineItems, "USD");

    expect(result).toEqual([
      {
        product: "Classic T-Shirt",
        variant: "Large / Red",
        quantity: 2,
        price: "$29.99 USD",
        sku: "SHIRT-LG-RED",
      },
    ]);
  });

  it("returns empty array for non-array input", () => {
    expect(simplifyLineItems(null as unknown as Record<string, unknown>[], "USD")).toEqual([]);
  });
});

// ===========================================================================
// stripShopifyMetadata
// ===========================================================================

describe("stripShopifyMetadata", () => {
  it("removes admin_graphql_api_id from objects", () => {
    const input = {
      id: 1,
      title: "Test",
      admin_graphql_api_id: "gid://shopify/Product/1",
    };

    const result = stripShopifyMetadata(input) as Record<string, unknown>;

    expect(result.id).toBe(1);
    expect(result.title).toBe("Test");
    expect(result).not.toHaveProperty("admin_graphql_api_id");
  });

  it("removes presentment_prices from nested objects", () => {
    const input = {
      variants: [
        {
          id: 1,
          price: "10.00",
          presentment_prices: [{ price: { amount: "10.00", currency_code: "USD" } }],
        },
      ],
    };

    const result = stripShopifyMetadata(input) as Record<string, unknown>;
    const variants = result.variants as Record<string, unknown>[];

    expect(variants[0]).not.toHaveProperty("presentment_prices");
    expect(variants[0].price).toBe("10.00");
  });

  it("removes tax_lines from objects", () => {
    const input = {
      line_items: [{ title: "Shirt", tax_lines: [{ rate: 0.08 }] }],
    };

    const result = stripShopifyMetadata(input) as Record<string, unknown>;
    const items = result.line_items as Record<string, unknown>[];

    expect(items[0]).not.toHaveProperty("tax_lines");
  });

  it("removes discount_allocations", () => {
    const input = { discount_allocations: [{ amount: "5.00" }], total: "15.00" };
    const result = stripShopifyMetadata(input) as Record<string, unknown>;

    expect(result).not.toHaveProperty("discount_allocations");
    expect(result.total).toBe("15.00");
  });

  it("handles null and undefined", () => {
    expect(stripShopifyMetadata(null)).toBeNull();
    expect(stripShopifyMetadata(undefined)).toBeUndefined();
  });

  it("handles primitives", () => {
    expect(stripShopifyMetadata("hello")).toBe("hello");
    expect(stripShopifyMetadata(42)).toBe(42);
    expect(stripShopifyMetadata(true)).toBe(true);
  });

  it("handles arrays recursively", () => {
    const input = [
      { id: 1, admin_graphql_api_id: "gid://1" },
      { id: 2, admin_graphql_api_id: "gid://2" },
    ];

    const result = stripShopifyMetadata(input) as Record<string, unknown>[];

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("admin_graphql_api_id");
    expect(result[1]).not.toHaveProperty("admin_graphql_api_id");
  });
});

// ===========================================================================
// transformShopifyResponse
// ===========================================================================

describe("transformShopifyResponse", () => {
  it("strips metadata from response data", () => {
    const input = {
      id: 1,
      admin_graphql_api_id: "gid://shopify/Order/1",
      name: "#1001",
    };

    const result = transformShopifyResponse(input) as Record<string, unknown>;

    expect(result).not.toHaveProperty("admin_graphql_api_id");
    expect(result.name).toBe("#1001");
  });
});

// ===========================================================================
// formatMcpResponse
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns transformed data in MCP format", () => {
    const input = { id: 1, admin_graphql_api_id: "gid://shopify/Order/1" };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).not.toHaveProperty("admin_graphql_api_id");
    expect(parsed.id).toBe(1);
  });

  it("does not set isError", () => {
    const result = formatMcpResponse({ test: true });
    expect(result.isError).toBeUndefined();
  });
});

// ===========================================================================
// formatMcpError
// ===========================================================================

describe("formatMcpError", () => {
  it("formats Error instance", () => {
    const result = formatMcpError(new Error("Something went wrong"));

    expect(result.content[0].text).toBe("Error: Something went wrong");
    expect(result.isError).toBe(true);
  });

  it("formats string error", () => {
    const result = formatMcpError("string error");

    expect(result.content[0].text).toBe("Error: string error");
    expect(result.isError).toBe(true);
  });
});
