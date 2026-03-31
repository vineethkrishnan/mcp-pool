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
| [Stripe MCP](/docs/stripe/overview) | Read-only access to Stripe — customers, payments, subscriptions, invoices, products, payouts, disputes, and tax | `@vineethnkrishnan/stripe-mcp` |

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
