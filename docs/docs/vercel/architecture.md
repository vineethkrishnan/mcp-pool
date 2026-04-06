---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Vercel MCP server.
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
│  Service Layer (src/services/)      │  Vercel REST API wrapper
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

Wraps the Vercel REST API. All HTTP calls, error handling, and URL construction lives here. The tool layer never touches the API directly.

Key design decisions:
- **Team-scoped queries** — when `VERCEL_TEAM_ID` is set, the service automatically appends `teamId` to every API call
- **Bearer token auth** — uses `Authorization: Bearer <token>` header format
- **Structured error handling** — maps HTTP status codes (401, 403, 404, 429) to clear, actionable error messages

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces (`VercelConfig`, `McpToolResponse`)
- **`utils.ts`** — data transformation pipeline

## Response Transformation

All Vercel API responses pass through an automatic transformation pipeline before being returned to the AI assistant:

### 1. Key Stripping

Internal Vercel fields that waste tokens and add no value for AI context are recursively removed:

- `ownerId` — internal account reference
- `accountId` — internal account ID
- `plan` — billing plan metadata
- `analytics`, `speedInsights` — feature flag objects
- `autoExposeSystemEnvs` — configuration flag
- `directoryListing`, `skewProtection` — internal settings

### 2. Build Log Processing

Build logs receive special treatment for LLM consumption:

- **ANSI stripping** — terminal color codes (`\x1b[31m`, etc.) are removed so the AI sees clean text
- **Truncation** — logs are truncated to the **last 150 lines** with a `[truncated]` marker, since build errors typically appear at the end
- **Empty line filtering** — blank lines are removed to reduce token waste

## Security Model

- **Read-only by design** — no write operations are exposed
- **Token-based auth** — uses Vercel API tokens with configurable scope
- **No data persistence** — the server is stateless and does not store any Vercel data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
