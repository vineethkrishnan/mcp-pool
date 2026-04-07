---
sidebar_position: 1
title: Overview
description: Stripe MCP Server — give AI assistants access to your Stripe data.
---

# Stripe MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Stripe API.

## What can it do?

Ask your AI assistant questions like:

- *"How many active subscriptions do we have?"*
- *"Why did the last payment for `cus_123` fail?"*
- *"Summarize our payouts from the last 30 days."*
- *"What is our current available balance in USD?"*
- *"Show me all invoices over $500 from this month."*
- *"What products do we have in our catalog?"*

## Features

- **23 tools** across 7 categories (Customers, Payments, Billing, Products, Checkout, Reporting, Tax)
- **LLM-optimized responses** — internal Stripe fields are stripped and timestamps converted to readable ISO format
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — supports Stripe restricted API keys with scoped permissions

## Supported Resources

| Category | Tools |
|----------|-------|
| **Customers** | `get_customer`, `list_customers` |
| **Payments** | `get_payment_intent`, `list_payment_intents`, `get_balance` |
| **Billing** | `get_subscription`, `list_subscriptions`, `get_invoice`, `list_invoices`, `get_coupon`, `list_coupons` |
| **Products** | `get_product`, `list_products`, `get_price`, `list_prices` |
| **Checkout** | `get_checkout_session`, `list_checkout_sessions` |
| **Reporting** | `get_payout`, `list_payouts`, `get_dispute`, `list_disputes` |
| **Tax** | `get_tax_rate`, `list_tax_rates` |

## Prerequisites

- **Node.js** >= 20
- A **Stripe API key** (test or live). We recommend using a [restricted key](https://stripe.com/docs/keys#limit-access) with read-only permissions.
