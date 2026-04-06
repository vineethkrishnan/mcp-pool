---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 6 Notion MCP tools with parameters and example prompts.
---

# Tools Reference

All tools are **read-only**. They retrieve data from Notion but never create, update, or delete anything.

## Search

Find pages and databases across your workspace.

| Tool | Parameters | Description |
|------|------------|-------------|
| `search` | `query?: string`, `filter?: "page" \| "database"`, `limit?: number` (default: 10, max: 100) | Searches across all pages and databases in the workspace. Only returns content shared with the integration. |

**Example prompts:**
- *"Search my Notion workspace for pages about Q4 planning."*
- *"Find all databases in my workspace."*
- *"Search for pages mentioning 'product roadmap'."*

---

## Pages

Read page properties and full content.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_page` | `page_id: string` | Retrieves page properties including title, created time, last edited time, parent, and all property values. |
| `get_page_content` | `page_id: string`, `max_depth?: number` (default: 3) | Retrieves the full content of a page as readable text blocks. Recursively fetches nested blocks (toggles, columns, etc.) up to the configured depth. Returns flattened plain text optimized for LLM consumption. |

**Example prompts:**
- *"Get the properties of page `abc123`."*
- *"Read the full content of my onboarding guide page."*
- *"Show me what's inside page `def456` including nested toggles."*

---

## Databases

Inspect database schemas and query entries.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_database` | `database_id: string` | Retrieves database metadata including title, description, and property schema (column definitions). Use this to understand the structure of a database before querying it. |
| `query_database` | `database_id: string`, `filter?: object`, `sorts?: object[]`, `limit?: number` (default: 25, max: 100) | Queries a Notion database with optional filter and sort objects. Returns matching entries with all property values. Uses Notion's native filter syntax. |

**Example prompts:**
- *"Show me the schema of our project tracker database."*
- *"Query the hiring pipeline database for all entries with status 'Interview'."*
- *"List the 10 most recently edited entries in database `ghi789`."*

---

## Users

List workspace members.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_users` | `limit?: number` (default: 25, max: 100) | Lists all users in the Notion workspace including name, email, type (person/bot), and avatar URL. |

**Example prompts:**
- *"Who are all the users in our Notion workspace?"*
- *"List the members and bots in our workspace."*
