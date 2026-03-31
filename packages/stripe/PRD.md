# PRD: Stripe MCP Server

## 1. Overview
The `stripe-mcp` project is a Model Context Protocol (MCP) server that enables AI assistants (e.g., Claude, Cursor) to interact directly with the Stripe API. It allows AI models to retrieve financial data, manage customers, and provide real-time business insights within their native chat interface.

## 2. Goals & Objectives
- **Empower AI Assistants:** Give AI models the context they need to answer financial and customer-related questions ("How many active subscriptions do we have?", "Is payment pi_123 successful?").
- **Efficiency:** Reduce the need for developers and support staff to manually switch between their IDE/AI-chat and the Stripe Dashboard.
- **Safety First:** Prioritize read-only access initially to ensure AI models cannot accidentally trigger refunds or create charges without explicit user confirmation/setup.

## 3. Target Audience
- **Developers:** Debugging payment flows and checking API object states.
- **Customer Support:** Quickly looking up customer history and subscription status.
- **Product Managers/Founders:** Getting quick business metrics and summaries via natural language.

## 4. Functional Requirements (MCP Tools & Resources)

### Phase 1: Core Read Operations (Essential)
The following tools are the foundation, providing high value with low risk:
- **Customers:** `get_customer`, `list_customers`.
- **Payments:** `get_payment_intent`, `list_payment_intents`.
- **Business Health:** `get_balance`.

### Phase 2: Full Read-Only Feature Set (Complete SDK Coverage)
Expand the server to support read-only access to almost all Stripe resources:
- **Billing:** `get_subscription`, `list_subscriptions`, `get_invoice`, `list_invoices`, `get_coupon`, `list_coupons`.
- **Checkout:** `get_checkout_session`, `list_checkout_sessions`.
- **Reporting:** `get_payout`, `list_payouts`, `get_dispute`, `list_disputes`.
- **Products:** `get_product`, `list_products`, `get_price`, `list_prices`.
- **Tax:** `get_tax_rate`, `list_tax_rates`.

### Phase 3: Write Operations (Future/Separate Phase)
*Note: These will require explicit user confirmation or a specific "write-enabled" API key.*
- `create_customer`, `update_customer_metadata`.
- `void_invoice`, `refund_payment_intent`.
- `create_customer_note` (via metadata).

## 5. Technical Architecture
The server follows a **Modular with Clean Principles** approach, separating the transport layer (MCP), the interface layer (Tools), and the data source layer (Stripe SDK).

### 5.1 Layered Structure
- **Transport Layer (`src/index.ts`):** Handles the stdio JSON-RPC connection and manages the server lifecycle.
- **Interface Layer (`src/tools/`):** Defines the MCP tool schemas (using Zod) and provides semantic descriptions for the LLM. It acts as a bridge to the Service Layer.
- **Service Layer (`src/services/`):** Encapsulates the Stripe SDK logic, handles API-specific error codes, and performs data transformation/reduction for AI optimization.
- **Common Layer (`src/common/`):** Shared types, constants, and utility functions.

### 5.2 Data Transformation Strategy
To optimize for LLM context windows, the Service Layer will:
- Strip internal Stripe hashes and redundant metadata.
- Convert timestamps to human-readable or ISO strings.
- Flatten nested objects where it improves readability for the model.

## 6. Implementation Strategy
1.  **Phase 1: Foundation & Core.** Setup modular structure and implement Customers, Payments, and Balance (Read-only).
2.  **Phase 2: Expansion.** Systematically add read-only support for Subscriptions, Invoices, Products, and Checkout.
3.  **Phase 3: Comprehensive Coverage.** Add read-only support for Payouts, Disputes, and Tax (Full Read-only SDK).
4.  **Phase 4: Optimization & UI.** Refine tool descriptions and implement MCP "Resources" for static data.
5.  **Phase 5: Write Operations.** (Optional) Introduce transactional tools with safety guards.

## 7. Configuration & Deployment
- Distributed as an NPM package or a standalone script.
- Configuration for Claude Desktop:
  ```json
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@your-scope/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
  ```

## 8. Success Metrics
- Successful retrieval of customer and payment data via natural language.
- Latency under 2 seconds for standard lookups.
- Positive feedback from the developer community for ease of setup.
