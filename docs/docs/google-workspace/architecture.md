---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Google Workspace MCP server.
---

# Architecture

## Multi-Service Design

Unlike single-API MCP servers, the Google Workspace server spans four distinct Google APIs through a unified architecture. A shared auth service provides credentials to each domain-specific service.

```
┌──────────────────────────────────────────────┐
│  Transport Layer (src/index.ts)              │  MCP stdio JSON-RPC
├──────────────────────────────────────────────┤
│  Tool Layer (src/tools/)                     │  Zod schemas + LLM descriptions
│   gmail.tools  calendar.tools                │
│   drive.tools  sheets.tools                  │
├──────────────────────────────────────────────┤
│  Service Layer (src/services/)               │  Google REST API wrappers
│   gmail.service  calendar.service            │
│   drive.service  sheets.service              │
├──────────────────────────────────────────────┤
│  Auth Layer (src/services/auth.service.ts)   │  Shared OAuth token management
├──────────────────────────────────────────────┤
│  Common Layer (src/common/)                  │  Types + data transformation
└──────────────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers all 12 tool schemas from all four services, and routes incoming tool calls to the appropriate handler. This is the entry point.

### Tool Layer (`src/tools/`)

Four tool files, one per Google service. Each defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the corresponding service and return MCP-formatted responses

### Service Layer (`src/services/`)

Four domain-specific services, each wrapping a Google REST API:

| Service | Base URL | Key Features |
|---------|----------|--------------|
| `GmailService` | `googleapis.com/gmail/v1` | Message listing, full message retrieval with MIME parsing, search via Gmail query syntax |
| `CalendarService` | `googleapis.com/calendar/v3` | Calendar listing, event queries with RFC 3339 time ranges, full event detail retrieval |
| `DriveService` | `googleapis.com/drive/v3` | File listing with Drive search syntax, full file metadata retrieval |
| `SheetsService` | `googleapis.com/v4/spreadsheets` | Spreadsheet metadata, cell value reads via A1 notation, sheet tab listing |

### Auth Layer (`src/services/auth.service.ts`)

A shared authentication service that provides OAuth headers to all four domain services. Uses a strategy pattern with three interchangeable strategies:

- **`StaticTokenStrategy`** — uses a `GOOGLE_ACCESS_TOKEN` environment variable directly
- **`ServiceAccountStrategy`** — exchanges a service account JSON key for access tokens via JWT signing
- **`OAuthStrategy`** — reads stored refresh tokens and exchanges them for access tokens automatically

**Config priority:** `GOOGLE_ACCESS_TOKEN` > `GOOGLE_SERVICE_ACCOUNT_KEY` > `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` > stored tokens at `~/.mcp-pool/google-workspace/tokens.json`

All strategies that support refresh do so with a 5-minute buffer before expiry. The OAuth strategy and CLI commands use the shared `@vineethnkrishnan/oauth-core` package for the token store, OAuth flow, and CLI scaffolding. Google-specific concerns (JWT signing for service accounts) remain in the google-workspace package.

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces (`GmailMessagePart`, `GmailHeader`, `CalendarEvent`, `DriveFile`)
- **`utils.ts`** — data transformation pipeline

## Response Transformation

Each Google API returns data in different formats. The server normalizes all responses for LLM consumption:

### Gmail Body Decoding

Gmail returns message bodies as base64url-encoded strings inside nested MIME part structures. The server:

1. Recursively walks the MIME part tree
2. Prefers `text/plain` over `text/html`
3. Decodes base64url content (replacing `-` with `+` and `_` with `/`, adding padding)
4. Strips HTML tags if only HTML is available
5. Extracts key headers (From, To, Subject, Date, Cc, Bcc) from the header array

### Calendar Event Simplification

Calendar events are flattened to essential fields:

```
Before: { id, summary, start: { dateTime, timeZone }, end: { dateTime, timeZone },
          organizer: { displayName, email, self }, attendees: [{ displayName, email,
          responseStatus, self, organizer, resource }], ... }
After:  { id, summary, start, end, location, organizer, attendees: ["Alice", "Bob"],
          status, htmlLink }
```

Time values prefer `dateTime` (timed events) over `date` (all-day events).

### Drive File Simplification

Drive files are flattened to essential fields:

```
Before: { id, name, mimeType, modifiedTime, size, webViewLink,
          owners: [{ displayName, emailAddress, kind, permissionId, photoLink }], ... }
After:  { id, name, mimeType, modifiedTime, size, webViewLink,
          owners: ["Alice Smith"] }
```

### Google Metadata Stripping

Internal Google API fields that waste tokens are recursively removed from all responses:

- `kind` — resource type discriminator (e.g., `"kind": "gmail#message"`)
- `etag` — cache validation tag
- `nextPageToken` — pagination token (not needed for LLM context)

## Security Model

- **Read-only by design** — no write operations are exposed across any service
- **Read-only scopes** — the server only needs `*.readonly` OAuth scopes
- **No data persistence** — the server is stateless and does not store any Google data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
- **Automatic token refresh** — service account and OAuth browser flow provide automatic token refresh without manual intervention
