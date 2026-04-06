# Intercom MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the Intercom API. **Supports both static access tokens and OAuth2 authentication.**

## Overview

`intercom-mcp` allows your AI assistant to directly interact with your Intercom support data. It enables powerful natural language queries like:
- "Show me all open conversations from the last 24 hours."
- "Search for contacts matching 'jane@example.com'."
- "Get the full conversation thread for conversation `12345`."
- "List all contacts tagged with 'VIP'."

## Features

- **OAuth2 Support:** Browser-based OAuth flow with automatic token refresh, powered by `@vineethnkrishnan/oauth-core`.
- **Static Token Support:** Use an Intercom access token for simple setups.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access to Conversations and Contacts.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/intercom-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/intercom-mcp
intercom-mcp
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

### Using a Static Access Token

```json
{
  "mcpServers": {
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOjEyMzQ..."
      }
    }
  }
}
```

### Using OAuth2

```json
{
  "mcpServers": {
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_CLIENT_ID": "abc12345...",
        "INTERCOM_CLIENT_SECRET": "secret_abc12345..."
      }
    }
  }
}
```

Then run the OAuth setup:

```bash
intercom-mcp auth login
```

This will:
1. Open a browser window where you'll log in to Intercom and authorize the app
2. After you approve, the browser will show a success message
3. Your tokens are saved locally at `~/.mcp-pool/intercom/` and refresh automatically

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INTERCOM_ACCESS_TOKEN` | No* | - | Static Intercom access token. |
| `INTERCOM_CLIENT_ID` | No* | - | OAuth2 client ID. |
| `INTERCOM_CLIENT_SECRET` | No* | - | OAuth2 client secret. |

*Either `INTERCOM_ACCESS_TOKEN` or both `INTERCOM_CLIENT_ID` and `INTERCOM_CLIENT_SECRET` must be provided.

## Getting Your Credentials

### Option A: Access Token (Simpler)
1. Log in to the [Intercom Developer Hub](https://developers.intercom.com)
2. Select your app (or create one)
3. Go to **Authentication** and copy the **Access Token**

### Option B: OAuth App
1. In the Developer Hub, go to your app's **Authentication** settings
2. Copy the **Client ID** and **Client secret**

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/intercom/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/intercom-mcp

# Remove OAuth tokens (if using OAuth2)
rm -rf ~/.mcp-pool/intercom/
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
