# HubSpot MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive interface to the HubSpot CRM API. **Supports both static access tokens and OAuth2 authentication.**

## Overview

`hubspot-mcp` allows your AI assistant to directly interact with your HubSpot CRM data. It enables powerful natural language queries like:
- "Search for contacts at 'Acme Corp'."
- "Show me all open deals worth over $10,000."
- "List the most recently created companies."
- "Get the details of contact `john@example.com`."

## Features

- **OAuth2 Support:** Browser-based OAuth flow with automatic token refresh, powered by `@vineethnkrishnan/oauth-core`.
- **Static Token Support:** Use a HubSpot private app access token for simple setups.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Full access to Contacts, Deals, and Companies.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/hubspot-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/hubspot-mcp
hubspot-mcp
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
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "pat-na1-..."
      }
    }
  }
}
```

### Using OAuth2

```json
{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_CLIENT_ID": "abc12345-...",
        "HUBSPOT_CLIENT_SECRET": "secret_abc12345..."
      }
    }
  }
}
```

Then run the OAuth setup:

```bash
hubspot-mcp auth login
```

This will:
1. Open a browser window where you'll log in to HubSpot and authorize the app
2. After you approve, the browser will show a success message
3. Your tokens are saved locally at `~/.mcp-pool/hubspot/` and refresh automatically

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUBSPOT_ACCESS_TOKEN` | No* | - | Static HubSpot private app access token. |
| `HUBSPOT_CLIENT_ID` | No* | - | OAuth2 client ID. |
| `HUBSPOT_CLIENT_SECRET` | No* | - | OAuth2 client secret. |

*Either `HUBSPOT_ACCESS_TOKEN` or both `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` must be provided.

## Getting Your Credentials

### Option A: Private App Token (Simpler)
1. Log in to [HubSpot](https://app.hubspot.com)
2. Go to **Settings > Integrations > Private Apps**
3. Click **Create a private app**
4. Under **Scopes**, enable: `crm.objects.contacts.read`, `crm.objects.deals.read`, `crm.objects.companies.read`
5. Click **Create app** and copy the **Access token** (starts with `pat-na1-`)

### Option B: OAuth App
1. Go to **Settings > Integrations > Private Apps** and create a public app
2. Copy the **Client ID** and **Client secret** from the Auth tab

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/hubspot/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/hubspot-mcp

# Remove OAuth tokens (if using OAuth2)
rm -rf ~/.mcp-pool/hubspot/
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
