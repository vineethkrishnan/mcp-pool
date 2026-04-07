# Shopify MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive interface to the Shopify Admin API. **Supports both static access tokens and OAuth2 authentication.**

## Overview

`shopify-mcp` allows your AI assistant to directly interact with your Shopify store data. It enables powerful natural language queries like:
- "Show me the last 10 orders."
- "Search for products containing 'T-shirt'."
- "How many customers do we have from New York?"
- "What's our store name and plan?"

## Features

- **OAuth2 Support:** Browser-based OAuth flow with automatic token refresh, powered by `@vineethnkrishnan/oauth-core`.
- **Static Token Support:** Use a Shopify Admin API access token for simple setups.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Full access to Orders, Products, Customers, and Shop info.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/shopify-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/shopify-mcp
shopify-mcp
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
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "mystore.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
      }
    }
  }
}
```

### Using OAuth2

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "mystore.myshopify.com",
        "SHOPIFY_CLIENT_ID": "abc12345...",
        "SHOPIFY_CLIENT_SECRET": "shpss_abc12345..."
      }
    }
  }
}
```

Then run the OAuth setup:

```bash
shopify-mcp auth login
```

This will:
1. Open a browser window where you'll log in to Shopify and authorize the app
2. After you approve, the browser will show a success message
3. Your tokens are saved locally at `~/.mcp-pool/shopify/` and refresh automatically

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHOPIFY_STORE_URL` | Yes | - | Your Shopify store URL (e.g., `mystore.myshopify.com`). |
| `SHOPIFY_ACCESS_TOKEN` | No* | - | Static Shopify Admin API access token. |
| `SHOPIFY_CLIENT_ID` | No* | - | OAuth2 client ID. |
| `SHOPIFY_CLIENT_SECRET` | No* | - | OAuth2 client secret. |

*Either `SHOPIFY_ACCESS_TOKEN` or both `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` must be provided.

## Getting Your Credentials

### Option A: Custom App Token (Simpler)
1. In your Shopify Admin, go to **Settings > Apps and sales channels**
2. Click **Develop apps** > **Create an app**
3. Configure **Admin API scopes**: enable `read_orders`, `read_products`, `read_customers`
4. Click **Install app** and copy the **Admin API access token** (starts with `shpat_`)

Your **Store URL** is your Shopify domain, e.g., `mystore.myshopify.com`

### Option B: OAuth App
1. Create a [Shopify Partner account](https://partners.shopify.com) and create an app
2. Copy the **Client ID** and **Client secret**

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/shopify/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/shopify-mcp

# Remove OAuth tokens (if using OAuth2)
rm -rf ~/.mcp-pool/shopify/
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
