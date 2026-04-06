---
sidebar_position: 4
title: Architecture
description: Technical architecture and design decisions behind the Shopify MCP server.
---

# Architecture

## Layered Design

The server follows a **modular with clean principles** approach, separating concerns across three layers:

```
┌─────────────────────────────────────┐
│  Transport Layer (src/index.ts)     │  MCP stdio JSON-RPC
├─────────────────────────────────────┤
│  Tool Layer (src/tools/)            │  Zod schemas + LLM descriptions
├─────────────────────────────────────┤
│  Service Layer (src/services/)      │  Shopify Admin API wrapper
├─────────────────────────────────────┤
│  Common Layer (src/common/)         │  Types + data transformation
└─────────────────────────────────────┘
```

### Transport Layer (`src/index.ts`)

Handles the MCP stdio connection, registers tool schemas, and routes incoming tool calls to the appropriate handler. This is the entry point.

### Tool Layer (`src/tools/`)

Each file defines:
- **Schemas** — Zod-validated input schemas with descriptions that help the LLM understand when and how to use each tool
- **Handlers** — thin functions that call the service layer and return MCP-formatted responses

### Service Layer (`src/services/`)

Wraps the Shopify Admin REST API (version `2024-01`). All requests authenticate via the `X-Shopify-Access-Token` header. Error handling covers authentication failures, insufficient scopes, rate limiting (with `Retry-After`), and not-found errors.

### Common Layer (`src/common/`)

Shared utilities for response transformation:
- **`types.ts`** — shared TypeScript interfaces
- **`utils.ts`** — data transformation pipeline

## Response Transformation

All Shopify API responses pass through an automatic transformation pipeline before being returned to the AI assistant:

### 1. Metadata Stripping

Internal Shopify fields that waste tokens and add no value for AI context are recursively removed:

- `admin_graphql_api_id` — internal GraphQL IDs
- `presentment_prices` — multi-currency presentment data
- `tax_lines` — detailed tax breakdown
- `discount_allocations` — discount calculation metadata
- `duties` — international duties metadata
- `payment_terms` — payment terms metadata

### 2. Store URL Normalization

The `SHOPIFY_STORE_URL` environment variable is automatically normalized on startup. All of these formats are accepted and handled correctly:

```
my-store.myshopify.com           → https://my-store.myshopify.com/admin/api/2024-01
https://my-store.myshopify.com   → https://my-store.myshopify.com/admin/api/2024-01
https://my-store.myshopify.com/  → https://my-store.myshopify.com/admin/api/2024-01
```

Protocol prefixes and trailing slashes are stripped before constructing the base URL.

### 3. Money Formatting

Shopify returns prices as plain strings (e.g., `"29.99"`) with a separate currency field. The server formats these into human-readable values with currency symbols:

```
Before: "price": "29.99" (with currency "USD")
After:  "price": "$29.99 USD"
```

Supported currency symbols: USD (`$`), EUR, GBP, CAD (`CA$`), AUD (`A$`), JPY. Other currencies display the ISO code.

### 4. Variant Simplification

Product variants are simplified to only the fields relevant for AI context:

```
Before: { title, price, sku, inventory_quantity, weight, grams, barcode, ... }
After:  { title, price, sku, inventory_quantity }
```

Order line items are similarly simplified to `product`, `variant`, `quantity`, `price`, and `sku`.

## Security Model

- **Read-only by design** — no write operations are exposed
- **Custom app support** — we recommend using Shopify custom apps with minimal scopes (`read_orders`, `read_products`, `read_customers`)
- **No data persistence** — the server is stateless and does not store any Shopify data
- **Stdio transport** — communication happens over stdin/stdout, no network ports opened
