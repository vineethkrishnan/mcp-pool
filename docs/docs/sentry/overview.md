---
sidebar_position: 1
title: Overview
description: Sentry MCP Server — give AI assistants access to your Sentry issues, events, and stack traces. Supports self-hosted instances.
---

# Sentry MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Sentry API. Works with both Sentry SaaS and **self-hosted** instances.

## What can it do?

Ask your AI assistant questions like:

- *"What are the most frequent unresolved issues in the backend project?"*
- *"Show me the latest event for issue `PROJ-42` with its full stack trace."*
- *"List all projects in our Sentry organization."*
- *"What breadcrumbs led up to the latest crash in the mobile app?"*
- *"Give me the details of the event that triggered this alert."*
- *"How many unresolved issues do we have in the `api-gateway` project?"*

## Features

- **8 tools** across 4 categories (Organizations, Projects, Issues, Events)
- **Self-hosted support** — point to any Sentry instance via `SENTRY_BASE_URL`
- **LLM-optimized responses** — internal fields are stripped, stack frames and breadcrumbs are truncated to save tokens
- **No SDK dependency** — lightweight `fetch`-based HTTP client
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — supports scoped auth tokens with minimal permissions

## Supported Resources

| Category | Tools |
|----------|-------|
| **Organizations** | `list_organizations` |
| **Projects** | `list_projects` |
| **Issues** | `list_issues`, `get_issue`, `get_issue_events` |
| **Events** | `list_events`, `get_event`, `get_latest_event` |

## Prerequisites

- **Node.js** >= 20
- A **Sentry auth token** with read scopes. You can create one at [Sentry Settings > Auth Tokens](https://sentry.io/settings/auth-tokens/) (or the equivalent page on your self-hosted instance).

## Key Differentiator: Self-Hosted Support

Unlike most Sentry integrations, this server fully supports **self-hosted Sentry instances**. Set the `SENTRY_BASE_URL` environment variable to your instance URL and the server will route all API calls there instead of `sentry.io`.

```bash
SENTRY_BASE_URL=https://sentry.yourcompany.com
```
