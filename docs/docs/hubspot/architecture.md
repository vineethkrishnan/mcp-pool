---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the HubSpot MCP server.
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
│  Service Layer (src/services/)      │  HubSpot CRM API wrapper
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

Wraps the HubSpot CRM v3 API. All HTTP calls, error handling, and URL construction lives here. The tool layer never touches the API directly.

Key design decisions:
- **CRM properties model** — each object type (contacts, deals, companies) has sensible default properties that are returned when the user does not specify a custom list. This avoids returning HubSpot's full property set, which can contain hundreds of fields.
- **Dual HTTP methods** — uses GET for list/get operations and POST for search operations (HubSpot's Search API requires POST bodies)
- **Association pass-through** — associations are requested via query parameters and returned alongside the main object, allowing the AI to see linked objects in a single call
- **Structured error handling** — maps HTTP status codes (401, 403, 404, 429) to clear, actionable error messages with scope-specific hints

### Default Properties

| Object Type | Default Properties |
|-------------|-------------------|
| **Contacts** | `firstname`, `lastname`, `email`, `phone`, `company`, `lifecyclestage`, `hs_lead_status` |
| **Deals** | `dealname`, `amount`, `dealstage`, `pipeline`, `closedate`, `hs_lastmodifieddate` |
| **Companies** | `name`, `domain`, `industry`, `city`, `state`, `phone`, `numberofemployees` |

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces (`HubSpotConfig`, `McpToolResponse`)
- **`utils.ts`** — data transformation pipeline

## Response Transformation

All HubSpot API responses pass through an automatic transformation pipeline before being returned to the AI assistant:

### 1. Property Flattening

HubSpot returns CRM objects with a nested `properties` object. The server flattens these to top-level fields for readability:

```
Before: { id: "123", properties: { firstname: "John", lastname: "Doe" } }
After:  { id: "123", firstname: "John", lastname: "Doe" }
```

### 2. Key Stripping

Internal HubSpot fields that waste tokens and add no value for AI context are recursively removed:

- `archived` — soft-delete flag
- `archivedAt` — soft-delete timestamp
- `propertiesWithHistory` / `properties_with_history` — full property change history
- `createdAt`, `updatedAt` — redundant with CRM property timestamps

### 3. Association Simplification

HubSpot's verbose association responses are simplified from nested objects to flat ID arrays:

```
Before: { associations: { companies: { results: [{ id: "456", type: "contact_to_company" }] } } }
After:  { associatedCompaniesIds: ["456"] }
```

This reduces token usage while preserving the essential linked object IDs that the AI can use in follow-up queries.

## Security Model

- **Read-only by design** — no write operations are exposed
- **Private app tokens** — uses HubSpot private app access tokens with granular scope control
- **No data persistence** — the server is stateless and does not store any HubSpot data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
