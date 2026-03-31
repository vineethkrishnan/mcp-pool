import {
  stripPagerDutyMetadata,
  flattenEscalationPolicy,
  truncateLogEntries,
  transformPagerDutyResponse,
  formatMcpResponse,
  formatMcpError,
} from "./utils";

// ===========================================================================
// stripPagerDutyMetadata
// ===========================================================================

describe("stripPagerDutyMetadata", () => {
  it("removes default internal keys from a flat object", () => {
    const input = {
      id: "P123",
      summary: "Server down",
      self: "https://api.pagerduty.com/incidents/P123",
      privilege: { role: "admin" },
      alert_counts: { triggered: 1, resolved: 0 },
      incident_key: "dedup-key-123",
      is_mergeable: true,
      conference_bridge: null,
      last_status_change_by: { id: "U1", summary: "Alice" },
    };

    const result = stripPagerDutyMetadata(input) as Record<string, unknown>;

    expect(result).toEqual({ id: "P123", summary: "Server down" });
    expect(result).not.toHaveProperty("self");
    expect(result).not.toHaveProperty("privilege");
    expect(result).not.toHaveProperty("alert_counts");
    expect(result).not.toHaveProperty("incident_key");
    expect(result).not.toHaveProperty("is_mergeable");
    expect(result).not.toHaveProperty("conference_bridge");
    expect(result).not.toHaveProperty("last_status_change_by");
  });

  it("preserves html_url (useful for linking)", () => {
    const input = {
      id: "P123",
      html_url: "https://app.pagerduty.com/incidents/P123",
    };

    const result = stripPagerDutyMetadata(input) as Record<string, unknown>;
    expect(result.html_url).toBe("https://app.pagerduty.com/incidents/P123");
  });

  it("strips type fields that end with _reference", () => {
    const input = {
      id: "SVC1",
      type: "service_reference",
      summary: "My Service",
    };

    const result = stripPagerDutyMetadata(input) as Record<string, unknown>;
    expect(result).toEqual({ id: "SVC1", summary: "My Service" });
    expect(result).not.toHaveProperty("type");
  });

  it("preserves type fields that are not reference discriminators", () => {
    const input = {
      id: "P123",
      type: "incident",
      summary: "Server down",
    };

    const result = stripPagerDutyMetadata(input) as Record<string, unknown>;
    expect(result.type).toBe("incident");
  });

  it("handles nested objects recursively", () => {
    const input = {
      incident: {
        id: "P1",
        self: "https://api.pagerduty.com/incidents/P1",
        service: {
          id: "SVC1",
          self: "https://api.pagerduty.com/services/SVC1",
          type: "service_reference",
          summary: "API",
        },
      },
    };

    const result = stripPagerDutyMetadata(input) as Record<string, unknown>;
    const incident = result.incident as Record<string, unknown>;
    expect(incident).not.toHaveProperty("self");
    const service = incident.service as Record<string, unknown>;
    expect(service).not.toHaveProperty("self");
    expect(service).not.toHaveProperty("type");
    expect(service.summary).toBe("API");
  });

  it("handles arrays by stripping keys from each element", () => {
    const input = [
      { id: "1", self: "/1", summary: "A" },
      { id: "2", privilege: {}, summary: "B" },
    ];

    const result = stripPagerDutyMetadata(input) as Record<string, unknown>[];
    expect(result).toEqual([
      { id: "1", summary: "A" },
      { id: "2", summary: "B" },
    ]);
  });

  it("returns null unchanged", () => {
    expect(stripPagerDutyMetadata(null)).toBeNull();
  });

  it("returns undefined unchanged", () => {
    expect(stripPagerDutyMetadata(undefined)).toBeUndefined();
  });

  it("returns primitives unchanged", () => {
    expect(stripPagerDutyMetadata(42)).toBe(42);
    expect(stripPagerDutyMetadata("hello")).toBe("hello");
    expect(stripPagerDutyMetadata(true)).toBe(true);
  });

  it("accepts custom keys to strip", () => {
    const input = { a: 1, b: 2, c: 3 };
    expect(stripPagerDutyMetadata(input, ["b", "c"])).toEqual({ a: 1 });
  });
});

// ===========================================================================
// flattenEscalationPolicy
// ===========================================================================

describe("flattenEscalationPolicy", () => {
  it("flattens a full escalation policy into simple level + targets", () => {
    const input = {
      id: "EP1",
      name: "Default Policy",
      description: "The default escalation",
      escalation_rules: [
        {
          escalation_level: 1,
          escalation_delay_in_minutes: 30,
          targets: [
            { type: "user_reference", summary: "Alice Smith" },
            { type: "schedule_reference", summary: "Primary On-Call" },
          ],
        },
        {
          escalation_level: 2,
          escalation_delay_in_minutes: 15,
          targets: [{ type: "user_reference", summary: "Bob Manager" }],
        },
      ],
    };

    const result = flattenEscalationPolicy(input) as Record<string, unknown>;

    expect(result.id).toBe("EP1");
    expect(result.name).toBe("Default Policy");
    expect(result.description).toBe("The default escalation");

    const rules = result.escalation_rules as Array<Record<string, unknown>>;
    expect(rules).toHaveLength(2);
    expect(rules[0].level).toBe(1);
    expect(rules[0].targets).toEqual(["User: Alice Smith", "Schedule: Primary On-Call"]);
    expect(rules[1].level).toBe(2);
    expect(rules[1].targets).toEqual(["User: Bob Manager"]);
  });

  it("uses summary as name fallback", () => {
    const input = {
      id: "EP2",
      summary: "Fallback Name",
      escalation_rules: [],
    };

    const result = flattenEscalationPolicy(input) as Record<string, unknown>;
    expect(result.name).toBe("Fallback Name");
  });

  it("handles targets with unknown types", () => {
    const input = {
      id: "EP3",
      name: "Policy",
      escalation_rules: [
        {
          escalation_level: 1,
          targets: [{ type: "custom_thing", summary: "Custom Target" }],
        },
      ],
    };

    const result = flattenEscalationPolicy(input) as Record<string, unknown>;
    const rules = result.escalation_rules as Array<Record<string, unknown>>;
    expect(rules[0].targets).toEqual(["Custom Target"]);
  });

  it("handles missing targets gracefully", () => {
    const input = {
      id: "EP4",
      name: "Empty Policy",
      escalation_rules: [{ escalation_level: 1 }],
    };

    const result = flattenEscalationPolicy(input) as Record<string, unknown>;
    const rules = result.escalation_rules as Array<Record<string, unknown>>;
    expect(rules[0].targets).toEqual([]);
  });

  it("returns null/undefined/primitives unchanged", () => {
    expect(flattenEscalationPolicy(null)).toBeNull();
    expect(flattenEscalationPolicy(undefined)).toBeUndefined();
    expect(flattenEscalationPolicy("string")).toBe("string");
  });

  it("returns object unchanged when no escalation_rules array", () => {
    const input = { id: "EP5", name: "No Rules" };
    expect(flattenEscalationPolicy(input)).toEqual(input);
  });
});

// ===========================================================================
// truncateLogEntries
// ===========================================================================

describe("truncateLogEntries", () => {
  const makeEntries = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      created_at: `2024-01-01T${String(i).padStart(2, "0")}:00:00Z`,
      type: "acknowledge_log_entry",
      summary: `Entry ${i}`,
      agent: { summary: `User ${i}`, type: "user_reference" },
    }));

  it("truncates entries longer than 25 and adds truncation marker", () => {
    const entries = makeEntries(40);
    const result = truncateLogEntries(entries) as unknown[];

    // First element is truncation marker
    expect(result[0]).toEqual({ _truncated: true, showing: 25, total: 40 });
    // 25 simplified entries follow
    expect(result).toHaveLength(26); // 1 marker + 25 entries
  });

  it("sorts entries by created_at descending (most recent first)", () => {
    const entries = [
      { created_at: "2024-01-01T01:00:00Z", type: "ack", summary: "First" },
      { created_at: "2024-01-01T03:00:00Z", type: "ack", summary: "Third" },
      { created_at: "2024-01-01T02:00:00Z", type: "ack", summary: "Second" },
    ];

    const result = truncateLogEntries(entries) as Array<Record<string, unknown>>;
    expect(result[0].summary).toBe("Third");
    expect(result[1].summary).toBe("Second");
    expect(result[2].summary).toBe("First");
  });

  it("simplifies entries to timestamp, type, summary, agent", () => {
    const entries = [
      {
        created_at: "2024-01-01T00:00:00Z",
        type: "escalate_log_entry",
        summary: "Escalated to level 2",
        agent: { summary: "System", type: "service_reference", id: "S1" },
        channel: { type: "auto" },
        html_url: "https://app.pagerduty.com/...",
        extra_field: "should be stripped",
      },
    ];

    const result = truncateLogEntries(entries) as Array<Record<string, unknown>>;
    expect(result[0]).toEqual({
      timestamp: "2024-01-01T00:00:00Z",
      type: "escalate_log_entry",
      summary: "Escalated to level 2",
      agent: { name: "System" },
    });
  });

  it("handles entries without agent", () => {
    const entries = [{ created_at: "2024-01-01T00:00:00Z", type: "notify", summary: "Notified" }];

    const result = truncateLogEntries(entries) as Array<Record<string, unknown>>;
    expect(result[0].agent).toBeUndefined();
  });

  it("passes through exactly 25 entries without truncation marker", () => {
    const entries = makeEntries(25);
    const result = truncateLogEntries(entries) as unknown[];
    expect(result).toHaveLength(25);
    expect((result[0] as Record<string, unknown>)._truncated).toBeUndefined();
  });

  it("passes through fewer than 25 entries without truncation marker", () => {
    const entries = makeEntries(5);
    const result = truncateLogEntries(entries) as unknown[];
    expect(result).toHaveLength(5);
  });

  it("handles empty array", () => {
    expect(truncateLogEntries([])).toEqual([]);
  });

  it("returns non-array input unchanged", () => {
    expect(truncateLogEntries("not an array" as unknown as unknown[])).toBe("not an array");
  });
});

// ===========================================================================
// transformPagerDutyResponse
// ===========================================================================

describe("transformPagerDutyResponse", () => {
  it("strips metadata by default", () => {
    const input = {
      id: "P1",
      self: "https://api.pagerduty.com/incidents/P1",
      summary: "Alert",
    };

    const result = transformPagerDutyResponse(input) as Record<string, unknown>;
    expect(result).not.toHaveProperty("self");
    expect(result.id).toBe("P1");
  });

  it("flattens escalation policy when resourceType is escalationPolicy", () => {
    const input = {
      id: "EP1",
      name: "Policy",
      self: "https://api.pagerduty.com/escalation_policies/EP1",
      escalation_rules: [
        {
          escalation_level: 1,
          targets: [{ type: "user_reference", summary: "Alice" }],
        },
      ],
    };

    const result = transformPagerDutyResponse(input, "escalationPolicy") as Record<string, unknown>;
    expect(result).not.toHaveProperty("self");
    expect(result.name).toBe("Policy");
    const rules = result.escalation_rules as Array<Record<string, unknown>>;
    expect(rules[0].targets).toEqual(["User: Alice"]);
  });

  it("handles null input", () => {
    expect(transformPagerDutyResponse(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(transformPagerDutyResponse(undefined)).toBeUndefined();
  });
});

// ===========================================================================
// formatMcpResponse
// ===========================================================================

describe("formatMcpResponse", () => {
  it("returns proper MCP content format with transformed data", () => {
    const input = { id: "P1", summary: "Alert", self: "/incidents/P1" };
    const result = formatMcpResponse(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ id: "P1", summary: "Alert" });
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
