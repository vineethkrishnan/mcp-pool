---
sidebar_position: 1
title: Stripe MCP
description: Complete documentation for the Stripe Model Context Protocol (MCP) server.
---

# Stripe MCP Server

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to the Stripe API.

## 🚀 Overview

`stripe-mcp` allows your AI assistant to directly interact with your Stripe data. It enables powerful natural language queries like:
- "How many active subscriptions do we have?"
- "Why did the last payment for `cus_123` fail?"
- "Summarize our payouts from the last 30 days."
- "What is our current available balance in USD?"

## ⚙️ Configuration

To use this server with an MCP client like **Claude Desktop**, add it to your configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

### Option 1: Using `npx` (Published Package)
If the package is published to a registry (e.g., NPM), you can run it without cloning.

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

---

## 🛠 Available Tools

### 1. Customers
Manage and lookup customer profiles.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_customer` | `id: string` | Retrieves full details for a specific Stripe customer. |
| `list_customers` | `limit: number (default: 10)` | Lists the most recent Stripe customers. |

**Example AI Prompt:**
> "Find the customer with ID `cus_Pql92M` and tell me their email and current balance."

### 2. Payments (PaymentIntents)
Track transactions and check account balances.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_payment_intent` | `id: string` | Checks the status and metadata of a specific transaction. |
| `list_payment_intents` | `limit: number (default: 10)` | Retrieves recent transactions (successful, failed, or pending). |
| `get_balance` | *(none)* | Retrieves the current available and pending Stripe balance. |

**Example AI Prompt:**
> "Show me the last 5 transactions and let me know if any of them failed."

### 3. Billing (Subscriptions & Invoices)
Monitor recurring revenue and customer billing history.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_subscription` | `id: string` | Retrieves details for a specific subscription, including next billing date. |
| `list_subscriptions` | `limit: number (default: 10)` | Summarizes active subscriptions. |
| `get_invoice` | `id: string` | View details of a specific invoice. |
| `list_invoices` | `limit: number (default: 10)` | Find unpaid or recently paid invoices. |
| `get_coupon` | `id: string` | Retrieves details of a specific coupon or discount. |
| `list_coupons` | `limit: number (default: 10)` | Lists active coupons. |

**Example AI Prompt:**
> "List all active subscriptions and show me their monthly price."

---

## 🏗 Architectural Details

### Modular with Clean Principles
The server is structured to be robust and scalable:
- **`src/services/`**: Encapsulates the Stripe SDK. All API-specific logic and error handling live here.
- **`src/tools/`**: Maps MCP tool definitions to service calls. Defines schemas for the LLM.

### Data Privacy & Safety
- **Read-Only**: This server is designed for read-only access. Write operations (Phase 3) are intentionally excluded for security.
- **Restricted Keys**: We strongly recommend using **Stripe Restricted Keys** with limited read permissions for this server.
