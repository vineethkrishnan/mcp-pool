---
sidebar_position: 1
title: Overview
description: Linear MCP Server — give AI assistants access to your Linear workspace.
---

# Linear MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Linear GraphQL API.

## What can it do?

Ask your AI assistant questions like:

- *"Show me all in-progress issues for the Engineering team."*
- *"What's the status of issue ENG-123?"*
- *"Search for issues related to the authentication refactor."*
- *"List all active projects and their progress."*
- *"What teams do we have and who's on each one?"*
- *"Find all urgent issues assigned to me."*

## Features

- **6 tools** across 3 categories (Issues, Projects, Teams)
- **GraphQL-powered** — efficient queries that fetch only the fields needed
- **LLM-optimized responses** — GraphQL connections flattened to plain arrays, priorities mapped to human-readable labels
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — scoped access via Linear personal API keys

## Supported Resources

| Category | Tools |
|----------|-------|
| **Issues** | `list_issues`, `get_issue`, `search_issues` |
| **Projects** | `list_projects`, `get_project` |
| **Teams** | `list_teams` |

## Prerequisites

- **Node.js** >= 20
- A **Linear personal API key**. Create one at [Linear Settings > API](https://linear.app/settings/api).

Alternatively, use **OAuth 2.0** for automatic token refresh — run `linear-mcp auth login` to authenticate via browser.
