---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 23 Stripe MCP tools with parameters and example prompts.
---

# Tools Reference

All tools are **read-only**. They retrieve data from Stripe but never create, update, or delete anything.

## Customers

Manage and look up customer profiles.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_customer` | `id: string` | Retrieves full details for a specific Stripe customer, including email, balance, and metadata. |
| `list_customers` | `limit?: number` (default: 10, max: 100) | Lists the most recent customers. |

**Example prompts:**
- *"Find the customer with ID `cus_Pql92M` and tell me their email."*
- *"List our last 20 customers and show me which ones have a negative balance."*

---

## Payments

Track transactions and check account balances.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_payment_intent` | `id: string` | Retrieves status, amount, currency, and error details for a specific transaction. |
| `list_payment_intents` | `limit?: number` (default: 10, max: 100) | Lists recent payment intents (successful, failed, or pending). |
| `get_balance` | *(none)* | Retrieves the current available and pending Stripe balance across all currencies. |

**Example prompts:**
- *"Is payment `pi_3R6abc` successful?"*
- *"Show me the last 5 transactions and highlight any failures."*
- *"What is our current available balance in USD?"*

---

## Billing

Monitor recurring revenue, invoices, and discounts.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_subscription` | `id: string` | Retrieves subscription details including status, plan, and next billing date. |
| `list_subscriptions` | `limit?: number` (default: 10, max: 100) | Lists recent subscriptions. |
| `get_invoice` | `id: string` | Retrieves invoice line items, payment status, and amounts. |
| `list_invoices` | `limit?: number` (default: 10, max: 100) | Lists recent invoices. |
| `get_coupon` | `id: string` | Retrieves coupon details (discount percentage, duration, etc.). |
| `list_coupons` | `limit?: number` (default: 10, max: 100) | Lists active coupons. |

**Example prompts:**
- *"List all active subscriptions and their monthly price."*
- *"Are there any unpaid invoices?"*
- *"What coupons are currently active and how much discount do they give?"*

---

## Products and Prices

Browse your product catalog and pricing.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_product` | `id: string` | Retrieves product details (name, description, active status). |
| `list_products` | `limit?: number` (default: 10, max: 100) | Lists active products in your catalog. |
| `get_price` | `id: string` | Retrieves price details (amount, currency, interval). |
| `list_prices` | `limit?: number` (default: 10, max: 100) | Lists available prices and plans. |

**Example prompts:**
- *"What products do we offer?"*
- *"Show me all prices for product `prod_abc123`."*
- *"List our pricing plans with their monthly cost."*

---

## Checkout

Monitor checkout session activity.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_checkout_session` | `id: string` | Retrieves checkout session details (payment status, customer, line items). |
| `list_checkout_sessions` | `limit?: number` (default: 10, max: 100) | Lists recent checkout sessions. |

**Example prompts:**
- *"Show me recent checkout sessions and their payment status."*
- *"Did checkout session `cs_test_abc` complete successfully?"*

---

## Reporting

Monitor payouts and disputes.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_payout` | `id: string` | Retrieves details of a specific bank payout. |
| `list_payouts` | `limit?: number` (default: 10, max: 100) | Lists recent payouts to your bank account. |
| `get_dispute` | `id: string` | Retrieves dispute details (reason, status, evidence deadline). |
| `list_disputes` | `limit?: number` (default: 10, max: 100) | Lists recent disputes and their status. |

**Example prompts:**
- *"Check our most recent payouts and see if any are still pending."*
- *"Do we have any open disputes that need a response?"*
- *"Summarize our payouts from the last 30 days."*

---

## Tax

View tax rate configurations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_tax_rate` | `id: string` | Retrieves tax rate details (percentage, jurisdiction, description). |
| `list_tax_rates` | `limit?: number` (default: 10, max: 100) | Lists active tax rates. |

**Example prompts:**
- *"What tax rates do we have configured?"*
- *"Show me the details of tax rate `txr_abc123`."*
