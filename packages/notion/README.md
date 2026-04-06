# Notion MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the Notion API. **Supports both static API keys and OAuth2 authentication.**

## Overview

`notion-mcp` allows your AI assistant to directly interact with your Notion workspace. It enables powerful natural language queries like:
- "Search for all pages mentioning 'Q2 roadmap'."
- "Show me the contents of our team wiki page."
- "Query the 'Tasks' database for items assigned to me."
- "List all users in the workspace."

## Features

- **OAuth2 Support:** Browser-based OAuth flow with automatic token refresh, powered by `@vineethnkrishnan/oauth-core`.
- **Static Token Support:** Use a Notion integration token for simple setups.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access to Pages, Databases, Search, and Users.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/notion-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/notion-mcp
notion-mcp
```

### From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

## Configuration

To use this server with an MCP client like **Claude Desktop**, add to your MCP client configuration file:

| Platform | Config file path |
|----------|-----------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Using a Static API Key

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
      }
    }
  }
}
```

### Using OAuth2

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_CLIENT_ID": "abc12345-...",
        "NOTION_CLIENT_SECRET": "secret_abc12345..."
      }
    }
  }
}
```

Then run the OAuth setup:

```bash
notion-mcp auth login
```

This will:
1. Open a browser window where you'll log in to Notion and authorize the app
2. After you approve, the browser will show a success message
3. Your tokens are saved locally at `~/.mcp-pool/notion/` and refresh automatically

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOTION_API_KEY` | No* | - | Static Notion integration token. |
| `NOTION_CLIENT_ID` | No* | - | OAuth2 client ID. |
| `NOTION_CLIENT_SECRET` | No* | - | OAuth2 client secret. |
| `NOTION_VERSION` | No | `2022-06-28` | Notion API version. |

*Either `NOTION_API_KEY` or both `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` must be provided.

## Getting Your Credentials

### Option A: Integration Token (Simpler)
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Give it a name, select your workspace, and click **Submit**
4. Copy the **Internal Integration Secret** (starts with `ntn_`)
5. In Notion, share the pages/databases you want to access with your integration

### Option B: OAuth App
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create an integration and enable **Public integration** under Distribution
3. Copy the **OAuth client ID** and **OAuth client secret**

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/notion/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/notion-mcp

# Remove OAuth tokens (if using OAuth2)
rm -rf ~/.mcp-pool/notion/
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
