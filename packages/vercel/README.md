# Vercel MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive interface to the Vercel API. **Supports team-scoped access.**

## Overview

`vercel-mcp` allows your AI assistant to directly query your Vercel deployments and projects. It enables powerful natural language queries like:
- "What are the latest deployments for the `my-app` project?"
- "Show me the build logs for the last failed deployment."
- "List all projects in my team."
- "What's the status of the production deployment?"

## Features

- **Team-Scoped Access:** Query projects and deployments scoped to a specific Vercel team.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Full access to Projects, Deployments, and Build Logs.
- **LLM-Optimized:** Responses are automatically transformed to reduce token usage.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/vercel-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/vercel-mcp
vercel-mcp
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

### Personal Account

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "prj_xxxx..."
      }
    }
  }
}
```

### Team-Scoped

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "prj_xxxx...",
        "VERCEL_TEAM_ID": "team_..."
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERCEL_TOKEN` | Yes | - | Vercel API token. |
| `VERCEL_TEAM_ID` | No | - | Team ID for team-scoped access. |

## Getting Your Credentials

1. Log in to [Vercel](https://vercel.com)
2. Go to **Settings > Tokens** (or visit https://vercel.com/account/tokens)
3. Click **Create Token**, give it a name, and copy the token

To find your **Team ID** (optional):
1. Go to **Settings > General** on your team dashboard
2. The Team ID is shown under **Team ID** (starts with `team_`)

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/vercel/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/vercel-mcp
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
