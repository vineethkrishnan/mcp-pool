---
sidebar_position: 1
title: Overview
description: Notion MCP Server — give AI assistants access to your Notion workspace.
---

# Notion MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Notion API.

## What can it do?

Ask your AI assistant questions like:

- *"Search my workspace for pages about Q4 planning."*
- *"Show me the schema of our project tracker database."*
- *"What are the entries in our hiring pipeline database?"*
- *"Read the full content of the onboarding guide page."*
- *"Who are all the users in our Notion workspace?"*
- *"Find all databases related to engineering."*

## Features

- **6 tools** across 4 categories (Search, Pages, Databases, Users)
- **LLM-optimized responses** — rich text is flattened to plain text, internal Notion metadata is stripped
- **Recursive block fetching** — nested toggles, columns, and child blocks are fetched up to configurable depth
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — uses Notion internal integration tokens with scoped access

## Supported Resources

| Category | Tools |
|----------|-------|
| **Search** | `search` |
| **Pages** | `get_page`, `get_page_content` |
| **Databases** | `get_database`, `query_database` |
| **Users** | `list_users` |

## Prerequisites

- **Node.js** >= 20
- A **Notion internal integration token**. Create one at [Notion Integrations](https://www.notion.so/my-integrations) and share relevant pages/databases with the integration via the "Connect to" menu.

Alternatively, use **OAuth 2.0** for automatic token refresh — run `notion-mcp auth login` to authenticate via browser.
