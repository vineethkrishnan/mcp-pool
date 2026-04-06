---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Datadog MCP server.
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
│  Service Layer (src/services/)      │  Datadog REST API wrapper
├─────────────────────────────────────┤
│  Common Layer (src/common/)         │  Types + data transformation
└─────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers tool schemas, and routes incoming tool calls to the appropriate handler. Reads `DD_API_KEY`, `DD_APP_KEY`, and optional `DD_SITE` from environment variables at startup. Validates that both required keys are present and warns if `DD_SITE` is not a recognized value.

### Tool Layer (`src/tools/`)

Each file defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the service layer and return MCP-formatted responses

### Service Layer (`src/services/`)

Wraps the Datadog REST API. All HTTP calls, error handling, and query parameter construction lives here. The tool layer never touches the Datadog API directly. Includes structured error messages for common failure modes (401, 403, 404, 429).

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — metadata stripping, dashboard widget simplification, metric series truncation

## Dual-Key Authentication

Datadog uses a two-key authentication model:

| Header | Source | Purpose |
|--------|--------|---------|
| `DD-API-KEY` | `DD_API_KEY` env var | Identifies your Datadog organization |
| `DD-APPLICATION-KEY` | `DD_APP_KEY` env var | Authorizes access to specific resources and scopes |

Both keys are sent as custom headers on every request. This differs from Bearer token authentication used by most APIs.

## Multi-Site Support

Datadog operates across 6 independent regions. Each region has its own API endpoint, and keys created in one region cannot be used in another.

The server constructs the base URL dynamically from the `DD_SITE` environment variable:

```
DD_SITE=datadoghq.com    → https://api.datadoghq.com
DD_SITE=datadoghq.eu     → https://api.datadoghq.eu
DD_SITE=us3.datadoghq.com → https://api.us3.datadoghq.com
DD_SITE=us5.datadoghq.com → https://api.us5.datadoghq.com
DD_SITE=ap1.datadoghq.com → https://api.ap1.datadoghq.com
DD_SITE=ddog-gov.com      → https://api.ddog-gov.com
```

If `DD_SITE` is not set, it defaults to `datadoghq.com` (US1). The server logs a warning at startup if the site value is not in the recognized list, but still proceeds with the provided value.

## Metric Query Passthrough

The `query_metrics` tool passes Datadog's native metric query syntax directly to the API without modification. This means the AI assistant can construct any valid Datadog metric query:

```
avg:system.cpu.user{host:web-01}
sum:trace.servlet.request.hits{service:web-app}.as_count()
max:system.mem.used{env:prod} by {host}
```

The server handles the time range parameters (`from`, `to`) as UNIX epoch seconds and passes them as query parameters alongside the metric query string.

## Response Transformation

All Datadog API responses pass through a transformation pipeline before being returned to the AI assistant:

### 1. Metadata Stripping

Internal Datadog fields that waste tokens and add no value for AI context are recursively removed:

- `creator` — user who created the resource
- `matching_downtimes` — downtime scheduling metadata
- `restricted_roles` — RBAC role restrictions
- `org_id` — organization identifier
- `deleted` — soft-delete marker
- `modified` — last modification timestamp

### 2. Metric Series Truncation

Metric queries can return thousands of data points. The server caps each series at 50 points by downsampling (picking evenly spaced points) and appends summary statistics:

```json
{
  "_summary": {
    "min": 12.5,
    "max": 98.2,
    "avg": 45.7,
    "count": 1440,
    "start": 1704067200000,
    "end": 1704153600000
  },
  "_truncated": {
    "kept": 50,
    "total": 1440
  }
}
```

This keeps responses within LLM context limits while preserving the statistical shape of the data.

## Security Model

- **Dual-key authentication** — both API key and Application key are required
- **Site-scoped** — keys only work against the region where they were created
- **No data persistence** — the server is stateless and does not store any Datadog data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
