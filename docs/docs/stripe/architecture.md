---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Stripe MCP server.
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
│  Service Layer (src/services/)      │  Stripe SDK wrapper
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

Wraps the Stripe SDK. All API calls, error handling, and SDK-specific logic lives here. The tool layer never touches the Stripe SDK directly.

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — data transformation pipeline

## Response Transformation

All Stripe API responses pass through an automatic transformation pipeline before being returned to the AI assistant:

### 1. Key Stripping

Internal Stripe fields that waste tokens and add no value for AI context are recursively removed:

- `object` — type discriminator (e.g., `"object": "customer"`)
- `livemode` — test/live mode flag
- `request` — internal request metadata
- `pending_webhooks` — webhook delivery count
- `api_version` — API version string
- `lastResponse` — HTTP response metadata

### 2. Timestamp Conversion

Numeric Unix timestamps are converted to human-readable ISO 8601 strings:

```
Before: "created": 1672531200
After:  "created": "2023-01-01T00:00:00.000Z"
```

Fields matched: any field ending in `_at`, `_date`, or named `created` or `date`.

This makes responses immediately readable without the AI needing to convert timestamps.

## Security Model

- **Read-only by design** — no write operations are exposed
- **Restricted key support** — we recommend using [Stripe restricted keys](https://stripe.com/docs/keys#limit-access) with minimal read permissions
- **No data persistence** — the server is stateless and does not store any Stripe data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
