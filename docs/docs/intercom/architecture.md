---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Intercom MCP server.
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
│  Service Layer (src/services/)      │  Intercom REST API wrapper
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

Wraps the Intercom REST API. All HTTP calls use the `Intercom-Version: 2.11` header to pin behavior. Supports both GET requests (for listing and fetching) and POST requests (for Intercom's search endpoints). Error handling covers authentication failures, rate limiting (with `Retry-After`), and scope issues.

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — data transformation pipeline

## Response Transformation

All Intercom API responses pass through an automatic transformation pipeline before being returned to the AI assistant:

### 1. HTML Stripping

Intercom returns message bodies as HTML. The server converts structural elements (`<br>`, `<p>`, `<li>`) to newlines and strips all remaining tags, producing clean plain text for the LLM:

```
Before: "<p>Hi there!</p><p>I need help with <b>billing</b>.</p>"
After:  "Hi there!\n\nI need help with billing."
```

HTML entities (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`) are also decoded.

### 2. Conversation Parts Flattening

The `get_conversation` tool flattens the nested `conversation_parts` structure into a chronological timeline. Each part includes:
- **author** — name and type (e.g., `"Jane (user #123)"`)
- **type** — message type (e.g., `comment`, `note`, `assignment`)
- **body** — HTML-stripped plain text
- **timestamp** — ISO 8601 format

Long conversations (over 50 parts) are automatically truncated, keeping the first 5 parts (opening context) and last 44 parts (recent context) with a marker in between.

### 3. Metadata Stripping

Internal Intercom fields that waste tokens and add no value for AI context are recursively removed:

- `statistics` — conversation analytics
- `sla_applied` — SLA policy details
- `linked_objects` — internal object links
- `conversation_rating` — CSAT ratings metadata
- `teammates` — internal teammate metadata

### 4. Timestamp Conversion

Numeric Unix timestamps are converted to human-readable ISO 8601 strings:

```
Before: "created_at": 1672531200
After:  "created_at": "2023-01-01T00:00:00.000Z"
```

## Security Model

- **Pinned API version** — all requests use `Intercom-Version: 2.11` to prevent breaking changes
- **No data persistence** — the server is stateless and does not store any Intercom data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
