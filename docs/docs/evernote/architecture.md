---
sidebar_position: 4
title: Architecture
description: Technical architecture of the Evernote MCP server.
---

# Architecture

## Overview

The Evernote MCP server wraps the [Evernote SDK](https://github.com/Evernote/evernote-sdk-js) to expose note management capabilities through the Model Context Protocol.

```
AI Assistant → MCP Protocol (stdio) → Evernote MCP Server → Evernote SDK → Evernote API (Thrift)
```

## Key Design Decisions

### Evernote SDK over raw API

Evernote uses a Thrift-based binary protocol, not REST. The official `evernote` npm SDK handles Thrift serialization transparently, so the server calls simple methods like `noteStore.findNotes()` rather than constructing binary payloads.

### ENML conversion

Evernote stores note content in ENML (Evernote Markup Language), an XML-based format. The server automatically:
- **Read**: Converts ENML to plain text for LLM-friendly output
- **Write**: Converts plain text to valid ENML when creating/updating notes

### Direct token authentication

Unlike OAuth 2.0 servers in the pool, Evernote uses developer tokens (long-lived access tokens). This simplifies setup — users just set `EVERNOTE_TOKEN` with no OAuth flow needed.

## Components

| Component | File | Role |
|-----------|------|------|
| Entry point | `src/index.ts` | MCP server setup, tool registration |
| Service | `src/services/evernote.service.ts` | Wraps the Evernote SDK. All API calls go through here. |
| Utilities | `src/common/utils.ts` | ENML conversion, response formatting |
| Types | `src/common/types.ts` | Shared TypeScript interfaces |
| Read tools | `src/tools/note.tools.ts`, `notebook.tools.ts`, `tag.tools.ts` | Read-only operations |
| Write tools | `src/tools/note.write-tools.ts`, `notebook.write-tools.ts`, `tag.write-tools.ts` | Mutation operations |
