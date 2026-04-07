---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Notion MCP server.
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
│  Service Layer (src/services/)      │  Notion REST API wrapper
├─────────────────────────────────────┤
│  Common Layer (src/common/)         │  Types + data transformation
└─────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers tool schemas, and routes incoming tool calls to the appropriate handler. Reads `NOTION_API_KEY` and optional `NOTION_VERSION` from environment variables at startup.

### Tool Layer (`src/tools/`)

Each file defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the service layer and return MCP-formatted responses

### Service Layer (`src/services/`)

Wraps the Notion REST API. All HTTP calls, error handling, and pagination logic lives here. The tool layer never touches the Notion API directly. Includes structured error messages for common failure modes (401, 403, 404, 429).

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — rich text flattening, block rendering, metadata stripping

## Rich Text Flattening

Notion stores text as arrays of rich text segments with annotations, mentions, and equations. The server flattens these into plain text strings optimized for LLM consumption:

```
Before: [{"type":"text","text":{"content":"Hello "}},{"type":"mention","mention":{"type":"user","user":{"name":"Alice"}}}]
After:  "Hello @Alice"
```

Supported segment types:
- **text** — plain content extraction
- **mention** — rendered as `@name`, `[page mention]`, `[database mention]`, or date values
- **equation** — rendered as the raw expression

## Recursive Block Fetching

Notion pages store content as a tree of blocks. Many block types (toggles, columns, synced blocks) can contain nested children. The server recursively fetches child blocks up to a configurable depth (`max_depth`, default 3) with a safety cap of 100 blocks total.

Each block is rendered to a markdown-like plain text line with indentation reflecting nesting depth:

```
# Heading 1
  - Bullet item
    1. Nested numbered item
  > Toggle content
  [x] Completed to-do
```

Supported block types include paragraphs, headings (1-3), bulleted/numbered lists, to-dos, toggles, code blocks, quotes, dividers, callouts, images, bookmarks, table rows, child pages, child databases, embeds, and synced blocks.

When the block count exceeds the safety cap, a truncation marker is appended indicating how many blocks were omitted.

## Response Transformation

All Notion API responses pass through a metadata stripping pipeline that removes internal fields:

- `object` — type discriminator (e.g., `"object": "page"`)
- `request_id` — internal request tracking
- `developer_survey` — Notion internal metadata
- `public_url` — typically null for private content

This reduces token usage and keeps responses focused on meaningful data.

## Security Model

- **Integration-scoped access** — Notion integrations can only access pages and databases explicitly shared with them via the "Connect to" menu
- **No data persistence** — the server is stateless and does not store any Notion data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
