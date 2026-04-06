# Linear MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive interface to the Linear API via GraphQL. **Supports both static API keys and OAuth2 authentication.**

## Overview

`linear-mcp` allows your AI assistant to directly interact with your Linear workspace. It enables powerful natural language queries like:
- "What are the open issues assigned to me in the 'Backend' team?"
- "Show me the details of issue `LIN-1234`."
- "List all active projects and their progress."
- "Which teams exist in our workspace?"

## Features

- **GraphQL API:** Leverages Linear's GraphQL API for efficient, precise queries.
- **OAuth2 Support:** Browser-based OAuth flow with automatic token refresh, powered by `@vineethnkrishnan/oauth-core`.
- **Static Token Support:** Use a Linear API key for simple setups.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Full access to Issues, Projects, and Teams.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/linear-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/linear-mcp
linear-mcp
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
    "linear": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/linear-mcp"],
      "env": {
        "LINEAR_API_KEY": "lin_api_..."
      }
    }
  }
}
```

### Using OAuth2

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/linear-mcp"],
      "env": {
        "LINEAR_CLIENT_ID": "abc12345...",
        "LINEAR_CLIENT_SECRET": "lin_oauth_secret_..."
      }
    }
  }
}
```

Then run the OAuth setup:

```bash
linear-mcp auth login
```

This will:
1. Open a browser window where you'll log in to Linear and authorize the app
2. After you approve, the browser will show a success message
3. Your tokens are saved locally at `~/.mcp-pool/linear/` and refresh automatically

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LINEAR_API_KEY` | No* | - | Static Linear API key. |
| `LINEAR_CLIENT_ID` | No* | - | OAuth2 client ID. |
| `LINEAR_CLIENT_SECRET` | No* | - | OAuth2 client secret. |

*Either `LINEAR_API_KEY` or both `LINEAR_CLIENT_ID` and `LINEAR_CLIENT_SECRET` must be provided.

## Getting Your Credentials

### Option A: Personal API Key (Simpler)
1. Go to [linear.app/settings/api](https://linear.app/settings/api)
2. Under **Personal API keys**, click **Create key**
3. Copy the key (starts with `lin_api_`)

### Option B: OAuth App
1. Go to [linear.app/settings/api](https://linear.app/settings/api) > **OAuth applications**
2. Click **Create application**
3. Copy the **Client ID** and **Client secret**

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/linear/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/linear-mcp

# Remove OAuth tokens (if using OAuth2)
rm -rf ~/.mcp-pool/linear/
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
