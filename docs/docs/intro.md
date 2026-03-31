---
sidebar_position: 1
title: Introduction
description: MCP Pool — a curated collection of MCP servers for AI assistants.
---

# MCP Pool

A curated collection of **Model Context Protocol (MCP) servers** that give AI assistants direct, read-only access to popular SaaS APIs.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard that allows AI assistants to connect to external data sources and tools. Instead of copy-pasting data into chat, MCP lets the AI query your systems directly.

## Available Servers

| Server | Description | npm |
|--------|-------------|-----|
| [Stripe MCP](/docs/stripe/overview) | Payments, customers, subscriptions, invoices | `@vineethnkrishnan/stripe-mcp` |
| [Sentry MCP](/docs/sentry/overview) | Issues, events, stack traces. Self-hosted support. | `@vineethnkrishnan/sentry-mcp` |
| [Notion MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/notion) | Pages, databases, search, content | `@vineethnkrishnan/notion-mcp` |
| [Linear MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/linear) | Issues, projects, teams (GraphQL) | `@vineethnkrishnan/linear-mcp` |
| [Datadog MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/datadog) | Monitors, metrics, events. Multi-site. | `@vineethnkrishnan/datadog-mcp` |
| [Vercel MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/vercel) | Deployments, projects, build logs | `@vineethnkrishnan/vercel-mcp` |
| [PagerDuty MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/pagerduty) | Incidents, on-call, services. EU support. | `@vineethnkrishnan/pagerduty-mcp` |
| [HubSpot MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/hubspot) | Contacts, deals, companies (CRM) | `@vineethnkrishnan/hubspot-mcp` |
| [Intercom MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/intercom) | Conversations, contacts, support | `@vineethnkrishnan/intercom-mcp` |
| [Shopify MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/shopify) | Orders, products, customers | `@vineethnkrishnan/shopify-mcp` |
| [Google Workspace MCP](https://github.com/vineethkrishnan/mcp-pool/tree/main/packages/google-workspace) | Gmail, Calendar, Drive, Sheets | `@vineethnkrishnan/google-workspace-mcp` |

## Why MCP Pool?

- **Ready to use** — Install via `npx`, configure one environment variable, done.
- **Read-only by default** — Safe for AI-driven workflows. No accidental mutations.
- **LLM-optimized** — Responses are cleaned and transformed to minimize token usage.
- **Multi-IDE support** — Works with Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code CLI.

## Quick Start

```bash
npx -y @vineethnkrishnan/stripe-mcp
```

See the [Installation Guide](/docs/stripe/installation) for detailed setup instructions for your IDE.
