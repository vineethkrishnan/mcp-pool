import {
  stripInternalKeys,
  convertTimestamps,
  transformStripeResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

describe("stripInternalKeys", () => {
  it("should strip default internal keys from a flat object", () => {
    const input = {
      id: "cus_123",
      object: "customer",
      livemode: false,
      email: "test@example.com",
      request: { id: "req_abc" },
      pending_webhooks: 0,
      api_version: "2025-02-24",
      lastResponse: { headers: {} },
    };

    const result = stripInternalKeys(input);

    expect(result).toEqual({
      id: "cus_123",
      email: "test@example.com",
    });
  });

  it("should handle nested objects recursively", () => {
    const input = {
      id: "sub_123",
      object: "subscription",
      plan: {
        id: "plan_abc",
        object: "plan",
        livemode: true,
        amount: 999,
      },
    };

    const result = stripInternalKeys(input);

    expect(result).toEqual({
      id: "sub_123",
      plan: {
        id: "plan_abc",
        amount: 999,
      },
    });
  });

  it("should handle arrays of objects", () => {
    const input = [
      { id: "item_1", object: "line_item", amount: 100 },
      { id: "item_2", object: "line_item", amount: 200 },
    ];

    const result = stripInternalKeys(input);

    expect(result).toEqual([
      { id: "item_1", amount: 100 },
      { id: "item_2", amount: 200 },
    ]);
  });

  it("should not modify keys that are not in the strip list", () => {
    const input = {
      id: "pi_123",
      amount: 5000,
      currency: "usd",
      status: "succeeded",
    };

    const result = stripInternalKeys(input);

    expect(result).toEqual(input);
  });

  it("should return null and undefined as-is", () => {
    expect(stripInternalKeys(null)).toBeNull();
    expect(stripInternalKeys(undefined)).toBeUndefined();
  });

  it("should return primitives as-is", () => {
    expect(stripInternalKeys("hello")).toBe("hello");
    expect(stripInternalKeys(42)).toBe(42);
    expect(stripInternalKeys(true)).toBe(true);
  });

  it("should accept custom keys to strip", () => {
    const input = { id: "x", secret: "hidden", name: "visible" };
    const result = stripInternalKeys(input, ["secret"]);

    expect(result).toEqual({ id: "x", name: "visible" });
  });
});

describe("convertTimestamps", () => {
  it('should convert "created" field from Unix to ISO string', () => {
    const input = { id: "cus_123", created: 1700000000 };
    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.created).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it("should convert fields ending in _at", () => {
    const input = {
      id: "sub_123",
      canceled_at: 1700000000,
      current_period_end_at: 1701000000,
    };

    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.canceled_at).toBe(new Date(1700000000 * 1000).toISOString());
    expect(result.current_period_end_at).toBe(new Date(1701000000 * 1000).toISOString());
  });

  it("should convert fields ending in _date", () => {
    const input = { billing_date: 1700000000 };
    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.billing_date).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('should convert "date" field', () => {
    const input = { date: 1700000000 };
    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.date).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it("should handle nested objects", () => {
    const input = {
      id: "in_123",
      created: 1700000000,
      lines: {
        data: [{ created: 1700000000, amount: 100 }],
      },
    };

    const result = convertTimestamps(input) as any;

    expect(result.created).toBe(new Date(1700000000 * 1000).toISOString());
    expect(result.lines.data[0].created).toBe(new Date(1700000000 * 1000).toISOString());
    expect(result.lines.data[0].amount).toBe(100);
  });

  it("should skip non-numeric values for timestamp fields", () => {
    const input = { created: "not-a-number", canceled_at: null };
    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.created).toBe("not-a-number");
    expect(result.canceled_at).toBeNull();
  });

  it("should skip values below the minimum reasonable timestamp", () => {
    const input = { created: 500 };
    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.created).toBe(500);
  });

  it("should not convert fields that do not match the pattern", () => {
    const input = { amount: 1700000000, id: "cus_123" };
    const result = convertTimestamps(input) as Record<string, unknown>;

    expect(result.amount).toBe(1700000000);
    expect(result.id).toBe("cus_123");
  });

  it("should return null and undefined as-is", () => {
    expect(convertTimestamps(null)).toBeNull();
    expect(convertTimestamps(undefined)).toBeUndefined();
  });
});

describe("transformStripeResponse", () => {
  it("should compose stripInternalKeys and convertTimestamps", () => {
    const input = {
      id: "cus_123",
      object: "customer",
      livemode: false,
      created: 1700000000,
      email: "test@example.com",
      lastResponse: { headers: {} },
    };

    const result = transformStripeResponse(input);

    expect(result).toEqual({
      id: "cus_123",
      created: new Date(1700000000 * 1000).toISOString(),
      email: "test@example.com",
    });
  });

  it("should handle null input", () => {
    expect(transformStripeResponse(null)).toBeNull();
  });

  it("should handle undefined input", () => {
    expect(transformStripeResponse(undefined)).toBeUndefined();
  });
});

describe("formatMcpResponse", () => {
  it("should return properly structured MCP content", () => {
    const input = { id: "cus_123", email: "test@example.com" };

    const result = formatMcpResponse(input);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.any(String),
        },
      ],
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe("cus_123");
    expect(parsed.email).toBe("test@example.com");
  });

  it("should apply transformation before formatting", () => {
    const input = {
      id: "pi_123",
      object: "payment_intent",
      created: 1700000000,
      amount: 5000,
    };

    const result = formatMcpResponse(input);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.object).toBeUndefined();
    expect(parsed.created).toBe(new Date(1700000000 * 1000).toISOString());
    expect(parsed.amount).toBe(5000);
  });

  it("should not set isError", () => {
    const result = formatMcpResponse({ id: "x" });

    expect(result.isError).toBeUndefined();
  });
});

describe("formatMcpError", () => {
  it("should format an Error instance", () => {
    const error = new Error("Something went wrong");

    const result = formatMcpError(error);

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: Something went wrong" }],
      isError: true,
    });
  });

  it("should format a string error", () => {
    const result = formatMcpError("connection failed");

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: connection failed" }],
      isError: true,
    });
  });

  it("should handle non-string, non-Error values", () => {
    const result = formatMcpError(404);

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: 404" }],
      isError: true,
    });
  });
});
