---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Sentry MCP server.
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
│  HTTP Client (src/services/)        │  fetch-based Sentry API client
├─────────────────────────────────────┤
│  Common Layer (src/common/)         │  Types + response transformation
└─────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers tool schemas, and routes incoming tool calls to the appropriate handler. This is the entry point.

### Tool Layer (`src/tools/`)

Each file defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the service layer and return MCP-formatted responses

### HTTP Client (`src/services/`)

A lightweight, `fetch`-based HTTP client that communicates directly with the Sentry REST API. There is no Sentry SDK dependency — this keeps the package small and gives full control over request/response handling.

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — data transformation pipeline

## HTTP Client Design

The server uses the native `fetch` API (Node.js 20+) instead of the Sentry SDK. This decision provides several benefits:

- **Smaller footprint** — no SDK dependency tree to install or bundle
- **Self-hosted compatibility** — the base URL is fully configurable; no SDK assumptions about `sentry.io`
- **Response control** — raw JSON responses can be transformed before reaching the LLM
- **Transparency** — every API call maps directly to a documented Sentry REST endpoint

All requests include:
- `Authorization: Bearer <token>` header
- Standard `Content-Type: application/json` headers
- Configurable base URL (defaults to `https://sentry.io`)

## Self-Hosted Support

Self-hosted support is a first-class concern, not an afterthought. The architecture handles it through a single configuration point:

```
SENTRY_BASE_URL=https://sentry.yourcompany.com
```

When set, all API requests are routed to `${SENTRY_BASE_URL}/api/0/...` instead of `https://sentry.io/api/0/...`. The rest of the server behavior is identical — same tools, same response transformation, same security model.

This works because:
1. The Sentry REST API is consistent between SaaS and self-hosted
2. The HTTP client constructs URLs dynamically from the base URL
3. No SDK-level assumptions about the Sentry host exist in the codebase

## Response Transformation

All Sentry API responses pass through an automatic transformation pipeline before being returned to the AI assistant. This reduces token usage and improves response quality.

### 1. Key Stripping

Internal Sentry fields that waste tokens and add no value for AI context are recursively removed from responses. This includes metadata fields, internal identifiers, and redundant type discriminators.

### 2. Stack Frame Truncation

Stack traces can be extremely long, especially in deep call chains. The server truncates stack frames to a reasonable limit, keeping the most relevant frames (typically the top and bottom of the stack) while indicating how many frames were omitted.

### 3. Breadcrumb Truncation

Breadcrumb trails (logs, HTTP requests, UI interactions leading up to an error) are truncated to the most recent entries. Older breadcrumbs that are less likely to be relevant to the error are dropped.

### 4. Timestamp Conversion

Numeric timestamps are converted to human-readable ISO 8601 strings where applicable, making responses immediately readable without the AI needing to convert timestamps.

## Security Model

- **Read-only by design** — no write operations are exposed (no resolving issues, no deleting events, no modifying settings)
- **Scoped token support** — we recommend using tokens with minimal read scopes (`project:read`, `org:read`, `event:read`)
- **No data persistence** — the server is stateless and does not store any Sentry data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
- **Self-hosted TLS** — for self-hosted instances, the server respects the system TLS configuration
