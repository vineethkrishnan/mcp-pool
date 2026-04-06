---
sidebar_position: 1
title: Overview
description: Shopify MCP Server — give AI assistants access to your Shopify store data.
---

# Shopify MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Shopify Admin API.

## What can it do?

Ask your AI assistant questions like:

- *"List our top-selling products."*
- *"Show me all open orders from this week."*
- *"What is the inventory count for product `789`?"*
- *"Find customer `456` and show me their order history."*
- *"What plan is our Shopify store on?"*
- *"List all cancelled orders and their reasons."*
- *"How many customers do we have?"*

## Features

- **7 tools** across 4 categories (Orders, Products, Customers, Shop)
- **LLM-optimized responses** — internal Shopify metadata is stripped, money amounts are formatted with currency symbols, and product variants are simplified to essential fields
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — scoped API key support via Shopify custom app tokens

## Supported Resources

| Category | Tools |
|----------|-------|
| **Orders** | `list_orders`, `get_order` |
| **Products** | `list_products`, `get_product` |
| **Customers** | `list_customers`, `get_customer` |
| **Shop** | `get_shop_info` |

## Prerequisites

- **Node.js** >= 20
- A **Shopify store URL** (e.g., `my-store.myshopify.com`)
- A **Shopify Admin API access token** with read permissions. We recommend creating a [custom app](https://help.shopify.com/en/manual/apps/app-types/custom-apps) with only `read_orders`, `read_products`, and `read_customers` scopes.

Alternatively, use **OAuth 2.0** for automatic token refresh — run `shopify-mcp auth login` to authenticate via browser.
