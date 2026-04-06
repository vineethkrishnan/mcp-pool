# Stripe MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the Stripe API.

## Overview

`stripe-mcp` allows your AI assistant to directly interact with your Stripe data. It enables powerful natural language queries like:
- "How many active subscriptions do we have?"
- "Why did the last payment for `cus_123` fail?"
- "Summarize our payouts from the last 30 days."
- "What is our current available balance in USD?"

## Features

- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access to Customers, Payments, Subscriptions, Invoices, Products, Checkout, Reporting, and Tax.
- **LLM-Optimized:** Responses are automatically transformed to reduce token usage.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/stripe-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/stripe-mcp
stripe-mcp
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

### Using `npx` (Recommended)

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

### Local Build

```json
{
  "mcpServers": {
    "stripe": {
      "command": "node",
      "args": ["/absolute/path/to/stripe-mcp/build/index.js"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret API key (starts with `sk_test_` or `sk_live_`). |

## Getting Your API Key

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers > API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

> Use a **test mode** key (`sk_test_...`) while getting started. Switch to live mode when ready.

## Response Optimization

All responses are automatically optimized for LLM context windows:

- **Internal keys stripped**: `object`, `livemode`, `request`, `pending_webhooks`, `api_version`, and `lastResponse` are removed from Stripe responses.
- **Timestamps converted**: Unix timestamps (e.g., `created`, `current_period_end`) are converted to human-readable ISO 8601 strings.

This reduces token usage and improves readability for AI assistants.

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/stripe/overview) or refer to the [local documentation guide](./DOCS.md).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/stripe-mcp
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
