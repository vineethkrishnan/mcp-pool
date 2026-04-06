---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Linear MCP server.
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
│  Service Layer (src/services/)      │  Linear GraphQL API wrapper
├─────────────────────────────────────┤
│  Common Layer (src/common/)         │  Types + data transformation
└─────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers tool schemas, and routes incoming tool calls to the appropriate handler. Reads `LINEAR_API_KEY` from environment variables at startup.

### Tool Layer (`src/tools/`)

Each file defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the service layer and return MCP-formatted responses

### Service Layer (`src/services/`)

Wraps the Linear GraphQL API. All queries, variables, error handling, and GraphQL-specific logic lives here. The tool layer never constructs GraphQL queries directly. Includes structured error messages for common failure modes (401, 429, GraphQL errors).

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — connection flattening, metadata stripping, priority mapping

## Authentication

Linear uses a straightforward API key authentication model. The key is sent directly in the `Authorization` header **without** a `Bearer` prefix:

```
Authorization: lin_api_...
```

This differs from most APIs that expect `Bearer <token>`. The server handles this automatically — you just provide the raw API key.

## GraphQL Connection Flattening

Linear's GraphQL API returns paginated collections as "connection" types with a `nodes` array and `pageInfo` metadata:

```
Before: { "issues": { "nodes": [{ "id": "1", ... }], "pageInfo": { "hasNextPage": true } } }
After:  { "issues": [{ "id": "1", ... }] }
```

The server recursively flattens all connection types into plain arrays, removing `pageInfo` and other pagination metadata that wastes tokens in LLM context. This happens at every nesting level — for example, a team's `members` connection is also flattened.

## Priority Mapping

Linear stores priorities as numeric values (0-4). The server maps these to human-readable labels:

| Numeric Value | Label |
|---------------|-------|
| 0 | No Priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium |
| 4 | Low |

In responses, priority fields are expanded to include both the numeric level and the label:

```json
{
  "priority": {
    "level": 2,
    "label": "High"
  }
}
```

This lets the AI reason about priorities in natural language without needing to know the numeric mapping.

## Response Transformation

All Linear API responses pass through a three-stage transformation pipeline:

### 1. Connection Flattening

GraphQL connection types (`{ nodes: [...], pageInfo: {...} }`) are recursively converted to plain arrays.

### 2. Metadata Stripping

Internal GraphQL and Linear fields that waste tokens are recursively removed:

- `__typename` — GraphQL type discriminator
- `pageInfo` — pagination metadata
- `archivedAt`, `trashed` — soft-delete markers
- `autoArchivedAt`, `autoClosedAt` — automation timestamps
- `snoozedUntilAt` — snooze metadata
- `sortOrder`, `boardOrder`, `subIssueSortOrder` — UI ordering values

### 3. Priority Mapping

Numeric priority values are expanded to `{ level, label }` objects for human readability.

## Security Model

- **Read-only by design** — no write operations (mutations) are exposed
- **Personal API key scoped** — access is limited to what your Linear account can see
- **No data persistence** — the server is stateless and does not store any Linear data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
