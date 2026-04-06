# Datadog MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive interface to the Datadog API. **Supports all Datadog regions.**

## Overview

`datadog-mcp` allows your AI assistant to directly query your Datadog monitoring data. It enables powerful natural language queries like:
- "Are there any monitors currently in alert status?"
- "Show me CPU metrics for the `web-prod` host over the last hour."
- "Search for monitors related to 'database latency'."
- "List recent events tagged with `env:production`."

## Features

- **Multi-Region Support:** Works with all Datadog sites — US1, US3, US5, EU, AP1, and Gov.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Full access to Monitors, Metrics, and Events.
- **LLM-Optimized:** Responses are automatically transformed to reduce token usage.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/datadog-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/datadog-mcp
datadog-mcp
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

### US1 (Default)

```json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "a1b2c3d4e5f6...",
        "DD_APP_KEY": "b2c3d4e5f6g7..."
      }
    }
  }
}
```

### EU or Other Regions

```json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "a1b2c3d4e5f6...",
        "DD_APP_KEY": "b2c3d4e5f6g7...",
        "DD_SITE": "datadoghq.eu"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DD_API_KEY` | Yes | - | Datadog API key. |
| `DD_APP_KEY` | Yes | - | Datadog application key. |
| `DD_SITE` | No | `datadoghq.com` | Datadog site. Options: `datadoghq.com`, `datadoghq.eu`, `us3.datadoghq.com`, `us5.datadoghq.com`, `ap1.datadoghq.com`, `ddog-gov.com`. |

## Getting Your Credentials

1. Log in to your [Datadog account](https://app.datadoghq.com)
2. Go to **Organization Settings > API Keys** — copy your **API Key**
3. Go to **Organization Settings > Application Keys** — create and copy an **Application Key**

> API Keys and Application Keys are different. You need both. Application Keys are tied to your user account and grant read access to Datadog data.

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/datadog/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/datadog-mcp
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
