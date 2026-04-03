# PagerDuty MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the PagerDuty API. **Supports custom API endpoints for EU and self-hosted instances.**

## Overview

`pagerduty-mcp` allows your AI assistant to directly query your PagerDuty account. It enables powerful natural language queries like:
- "Are there any triggered incidents right now?"
- "Who is currently on-call for the 'Platform' service?"
- "Show me the details of incident `P123ABC`."
- "List all services and their current status."

## Features

- **Custom Endpoint Support:** Works with PagerDuty SaaS, EU instances, and custom API endpoints.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access to Incidents, Services, and On-Call Schedules.
- **LLM-Optimized:** Responses are automatically transformed to reduce token usage.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/pagerduty-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/pagerduty-mcp
pagerduty-mcp
```

### From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

## Configuration

Add to your MCP client configuration file:

| Platform | Config file path |
|----------|-----------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### PagerDuty SaaS (Default)

```json
{
  "mcpServers": {
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "u+abcd1234..."
      }
    }
  }
}
```

### Custom Endpoint

```json
{
  "mcpServers": {
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "u+abcd1234...",
        "PAGERDUTY_BASE_URL": "https://api.eu.pagerduty.com"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAGERDUTY_API_KEY` | Yes | - | PagerDuty REST API key. |
| `PAGERDUTY_BASE_URL` | No | `https://api.pagerduty.com` | Custom API endpoint for EU or self-hosted instances. |

## Getting Your Credentials

1. Log in to [PagerDuty](https://app.pagerduty.com)
2. Go to **Integrations > API Access Keys**
3. Click **Create New API Key**
4. Copy the key (starts with `u+`)

> Use a **Read-only API Key** for maximum safety. This server only performs read operations.

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/pagerduty/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/pagerduty-mcp
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
