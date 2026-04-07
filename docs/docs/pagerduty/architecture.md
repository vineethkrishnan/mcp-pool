---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the PagerDuty MCP server.
---

# Architecture

## Layered Design

The server follows a **modular with clean principles** approach, separating concerns across three layers:

```
┌─────────────────────────────────────┐
│  Transport Layer (src/index.ts)     │  MCP stdio JSON-RPC
├─────────────────────────────────────┤
│  Tool Layer (src/tools/)            │  Zod schemas + LLM descriptions
├─────────────────────────────────────┤
│  Service Layer (src/services/)      │  PagerDuty REST API wrapper
├─────────────────────────────────────┤
│  Common Layer (src/common/)         │  Types + data transformation
└─────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers tool schemas, and routes incoming tool calls to the appropriate handler. This is the entry point.

### Tool Layer (`src/tools/`)

Each file defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the service layer and return MCP-formatted responses

### Service Layer (`src/services/`)

Wraps the PagerDuty REST API v2. All HTTP calls, error handling, and URL construction lives here. The tool layer never touches the API directly.

Key design decisions:
- **`Token token=` auth format** — PagerDuty uses a non-standard `Authorization: Token token=<key>` header, not Bearer tokens
- **Configurable base URL** — defaults to `https://api.pagerduty.com`, but can be switched to `https://api.eu.pagerduty.com` for EU accounts
- **Array parameter handling** — PagerDuty uses repeated params for arrays (e.g., `statuses[]=triggered&statuses[]=acknowledged`), which the service handles transparently
- **Structured error handling** — maps HTTP status codes (401, 403, 404, 429) to clear, actionable error messages with region-specific hints

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces (`PagerDutyConfig`, `McpToolResponse`)
- **`utils.ts`** — data transformation pipeline

## Response Transformation

All PagerDuty API responses pass through an automatic transformation pipeline before being returned to the AI assistant:

### 1. Escalation Policy Flattening

PagerDuty escalation policies contain deeply nested structures. The server flattens them into simple level-based lists:

```
Before: { escalation_rules: [{ targets: [{ type: "user_reference", summary: "Alice" }] }] }
After:  { escalation_rules: [{ level: 1, targets: ["User: Alice"] }] }
```

This runs **before** metadata stripping because it relies on `type` fields (e.g., `user_reference`, `schedule_reference`) to classify targets.

### 2. Key Stripping

Internal PagerDuty fields that waste tokens and add no value for AI context are recursively removed:

- `self` — API self-reference URL
- `privilege` — access level metadata
- `alert_counts` — redundant counts
- `incident_key` — internal dedup key
- `is_mergeable` — merge capability flag
- `conference_bridge` — conference bridge config
- `last_status_change_by` — redundant actor info

Additionally, `type` fields ending in `_reference` (e.g., `incident_reference`, `service_reference`) are stripped as they are PagerDuty-specific discriminators with no value for AI context.

### 3. Log Entry Truncation

Incident log entries are truncated to the most recent 25 entries, sorted by timestamp descending, and simplified to: `{ timestamp, type, summary, agent }`.

## Security Model

- **API key auth** — uses PagerDuty REST API keys (read-only keys are sufficient)
- **No data persistence** — the server is stateless and does not store any PagerDuty data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
