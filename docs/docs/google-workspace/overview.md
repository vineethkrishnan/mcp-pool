---
sidebar_position: 1
title: Overview
description: Google Workspace MCP Server — give AI assistants access to Gmail, Calendar, Drive, and Sheets.
---

# Google Workspace MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to Google Workspace APIs across four services: Gmail, Calendar, Drive, and Sheets.

## What can it do?

Ask your AI assistant questions like:

- *"Show me my unread emails from today."*
- *"What meetings do I have this week?"*
- *"Find the Q4 report in my Drive."*
- *"Read rows A1:D50 from my budget spreadsheet."*
- *"Search Gmail for invoices with PDF attachments."*
- *"Who is attending tomorrow's standup?"*
- *"List all sheets in spreadsheet `abc123`."*
- *"What files did I modify last week?"*

## Features

- **12 tools** across 4 services (Gmail, Calendar, Drive, Sheets)
- **Multi-service architecture** — a single MCP server covers all major Workspace APIs through a unified auth layer
- **LLM-optimized responses** — Gmail bodies are decoded from base64url, Calendar events are simplified, Drive files are flattened, and Google metadata (`kind`, `etag`) is stripped
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — scoped API key support

## Supported Resources

| Service | Tools |
|---------|-------|
| **Gmail** | `list_messages`, `get_message`, `search_messages` |
| **Calendar** | `list_calendars`, `list_events`, `get_event` |
| **Drive** | `list_files`, `get_file`, `search_files` |
| **Sheets** | `get_spreadsheet`, `get_sheet_values`, `list_sheets` |

## Prerequisites

- **Node.js** >= 20
- A **Google account** — authenticate via OAuth browser flow, service account, or a static access token

:::info Multiple Auth Methods
Three authentication options are available:
1. `google-workspace-mcp auth login` — OAuth browser flow with automatic token refresh
2. Service account key file — for server-to-server use
3. Static access token — for quick testing via OAuth Playground
:::
