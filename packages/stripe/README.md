# Stripe MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the Stripe API.

## 🚀 Overview

`stripe-mcp` allows your AI assistant to directly interact with your Stripe data. It enables powerful natural language queries like:
- "How many active subscriptions do we have?"
- "Why did the last payment for `cus_123` fail?"
- "Summarize our payouts from the last 30 days."
- "What is our current available balance in USD?"

## 🛠 Features

- **Modular Architecture:** Built with "Clean Principles" for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access to Customers, Payments, Subscriptions, Invoices, Products, Checkout, Reporting, and Tax.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## 📦 Installation

```bash
# Clone the monorepo
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool

# Install dependencies
npm install

# Build the project
npm run build
```

## ⚙️ Configuration

To use this server with an MCP client like **Claude Desktop**, add it to your configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

### Option 1: Local Build (Recommended for Development)
Use this if you have cloned the repository and built it locally.

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

### Option 2: Using `npx` (Published Package)
If the package is published to a registry (e.g., NPM), you can run it without cloning.

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

### Option 3: Using `npx` with Local Path
You can also use `npx` to run the local build of `@vineethnkrishnan/stripe-mcp`, which handles dependencies automatically.

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "/absolute/path/to/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

## Response Optimization

All responses are automatically optimized for LLM context windows:

- **Internal keys stripped**: `object`, `livemode`, `request`, `pending_webhooks`, `api_version`, and `lastResponse` are removed from Stripe responses.
- **Timestamps converted**: Unix timestamps (e.g., `created`, `current_period_end`) are converted to human-readable ISO 8601 strings.

This reduces token usage and improves readability for AI assistants.

## 📚 Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/stripe/overview) or refer to the [local documentation guide](./DOCS.md).

## 🧪 Testing

```bash
npm test
```

## 📄 License

This project is licensed under the MIT License.
