# Sentry MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the Sentry API. **Supports both Sentry SaaS and self-hosted instances.**

## Overview

`sentry-mcp` allows your AI assistant to directly investigate errors and debug issues from your Sentry account. It enables powerful natural language queries like:
- "What are the top unresolved issues in the `my-frontend` project?"
- "Show me the stack trace for issue `12345`."
- "Search across all projects for `TypeError` errors."
- "List all organizations and projects I have access to."

## Features

- **Self-Hosted Support:** Works with Sentry SaaS (`sentry.io`) and any self-hosted Sentry instance out of the box.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access to Organizations, Projects, Issues, and Events.
- **LLM-Optimized:** Responses are automatically transformed to reduce token usage.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/sentry-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/sentry-mcp
sentry-mcp
```

### From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

## Configuration

To use this server with an MCP client like **Claude Desktop**, add it to your configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

### Sentry SaaS

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_...",
        "SENTRY_ORG": "my-org"
      }
    }
  }
}
```

### Self-Hosted Sentry

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_...",
        "SENTRY_BASE_URL": "https://sentry.mycompany.com",
        "SENTRY_ORG": "my-org"
      }
    }
  }
}
```

### Local Build

```json
{
  "mcpServers": {
    "sentry": {
      "command": "node",
      "args": ["/absolute/path/to/sentry-mcp/build/index.js"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_AUTH_TOKEN` | Yes | - | Sentry authentication token (org-level or user token). |
| `SENTRY_BASE_URL` | No | `https://sentry.io` | Base URL for self-hosted Sentry instances. |
| `SENTRY_ORG` | No | - | Default organization slug. Avoids passing `org` on every tool call. |

## Response Optimization

All responses are automatically optimized for LLM context windows:

- **Internal keys stripped**: `pluginActions`, `pluginContexts`, `pluginIssues`, `seenBy`, `activity`, `participants`, and `dist` are removed from Sentry responses.
- **Stack frames truncated**: Exception stack traces are capped at the **15 most recent frames** per exception, with a `_truncated` metadata field indicating the original count.
- **Breadcrumbs truncated**: Breadcrumb entries are capped at the **20 most recent entries**, with a `_truncated` metadata field indicating the original count.

This reduces token usage and improves readability for AI assistants.

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/sentry/overview) or refer to the [local documentation guide](./DOCS.md).

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
