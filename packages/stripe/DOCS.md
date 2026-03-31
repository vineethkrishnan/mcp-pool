# Stripe MCP Server Documentation

Welcome to the `stripe-mcp` server documentation. For the full documentation site, visit [mcp-pool.vineethnk.in](https://mcp-pool.vineethnk.in). This guide details the available tools, their parameters, and examples for how to use them through an AI assistant.

---

## 🛠 Core Tool Categories

### 1. Customers
Manage and lookup customer profiles.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_customer` | `id: string` | Retrieves full details for a specific Stripe customer. |
| `list_customers` | `limit: number (default: 10)` | Lists the most recent Stripe customers. |

**Example AI Prompt:**
> "Find the customer with ID `cus_Pql92M` and tell me their email and current balance."

---

### 2. Payments (PaymentIntents)
Track transactions and check account balances.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_payment_intent` | `id: string` | Checks the status and metadata of a specific transaction. |
| `list_payment_intents` | `limit: number (default: 10)` | Retrieves recent transactions (successful, failed, or pending). |
| `get_balance` | *(none)* | Retrieves the current available and pending Stripe balance. |

**Example AI Prompt:**
> "Show me the last 5 transactions and let me know if any of them failed."

---

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

### 4. Products & Prices
Browse your catalog of offerings.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_product` | `id: string` | Retrieves details of a specific product. |
| `list_products` | `limit: number (default: 10)` | Lists active products in your catalog. |
| `get_price` | `id: string` | Retrieves details of a specific price object. |
| `list_prices` | `limit: number (default: 10)` | Lists available prices and plans. |

---

### 5. Reporting (Payouts & Disputes)
Monitor account health and legal disputes.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_payout` | `id: string` | Retrieves details of a specific bank payout. |
| `list_payouts` | `limit: number (default: 10)` | Lists recent payouts to your bank account. |
| `get_dispute` | `id: string` | Retrieves details of a specific chargeback dispute. |
| `list_disputes` | `limit: number (default: 10)` | Lists recent disputes and their status. |

**Example AI Prompt:**
> "Check our most recent payouts and see if any are still pending."

---

### 6. Checkout & Tax
Monitor session activity and tax configurations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_checkout_session` | `id: string` | Retrieves details of a specific Checkout session. |
| `list_checkout_sessions` | `limit: number (default: 10)` | Lists recent Checkout session activity. |
| `get_tax_rate` | `id: string` | Retrieves details of a specific tax rate. |
| `list_tax_rates` | `limit: number (default: 10)` | Lists active tax rates. |

---

## Response Transformation

All Stripe API responses pass through an automatic transformation pipeline before being returned:

1. **Key Stripping**: Internal Stripe fields (`object`, `livemode`, `request`, `pending_webhooks`, `api_version`, `lastResponse`) are recursively removed.
2. **Timestamp Conversion**: Numeric Unix timestamps in fields like `created`, `current_period_end`, `trial_end`, etc. are converted to ISO 8601 strings (e.g., `1672531200` → `"2023-01-01T00:00:00.000Z"`).

This optimization reduces token consumption and makes responses more readable for AI models.

---

## 🏗 Architectural Details

### Modular with Clean Principles
The server is structured to be robust and scalable:
- **`src/services/`**: Encapsulates the Stripe SDK. All API-specific logic and error handling live here.
- **`src/tools/`**: Maps MCP tool definitions to service calls. Defines schemas for the LLM.
- **`src/index.ts`**: The entry point that manages the JSON-RPC stdio lifecycle.

### Data Privacy & Safety
- **Read-Only**: This server is designed for read-only access. Write operations (Phase 3) are intentionally excluded for security.
- **Restricted Keys**: We strongly recommend using **Stripe Restricted Keys** with limited read permissions for this server.

---

## 🚀 Future Roadmap
- **Phase 3**: Write operations (e.g., creating customers, adding notes).
- **Phase 4**: Business metrics visualization (e.g., MRR, Churn calculation tools).
- **Phase 5**: Real-time webhook integration (MCP Resources).
