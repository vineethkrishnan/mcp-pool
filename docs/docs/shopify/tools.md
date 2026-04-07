---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 12 Shopify MCP tools with parameters and example prompts.
---

# Tools Reference

Shopify MCP provides **12 tools** — 7 read tools and 5 write tools.

## Orders

Browse and inspect store orders.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_orders` | `status?: "open" \| "closed" \| "cancelled" \| "any"`, `limit?: number` (default: 50, max: 250) | Lists orders with order number, customer, totals, and fulfillment status. Defaults to open orders. |
| `get_order` | `order_id: string` | Retrieves full order details including line items, shipping address, payment status, fulfillments, discount codes, and customer info. |

**Example prompts:**
- *"Show me all open orders."*
- *"List the last 10 cancelled orders."*
- *"Get the details for order `12345` including shipping address and line items."*
- *"How many orders are currently unfulfilled?"*

---

## Products

Browse your product catalog and inventory.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_products` | `limit?: number` (default: 50, max: 250) | Lists products with title, status, vendor, product type, and variant count. |
| `get_product` | `product_id: string` | Retrieves full product details including all variants (with prices, SKUs, inventory quantities), images, and options. |

**Example prompts:**
- *"What products do we sell?"*
- *"Show me product `789` with all its variants and prices."*
- *"Which products are currently out of stock?"*
- *"List all products and their vendors."*

---

## Customers

Look up and browse store customers.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_customers` | `limit?: number` (default: 50, max: 250) | Lists customers with name, email, order count, and total spent. |
| `get_customer` | `customer_id: string` | Retrieves full customer details including email, order count, total spent, addresses, tags, and note. |

**Example prompts:**
- *"List our last 20 customers."*
- *"Get the full profile for customer `456`."*
- *"Which customers have spent the most?"*

---

## Shop

View store configuration and metadata.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_shop_info` | *(none)* | Retrieves shop metadata including name, email, domain, plan, currency, timezone, and configured shipping zones. |

**Example prompts:**
- *"What plan is our Shopify store on?"*
- *"What currency does our store use?"*
- *"Show me our shop configuration details."*

---

## Write Operations

:::caution
Write tools modify orders, products, and inventory in your Shopify store. Use with care.
:::

### Order Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `update_order_tags` | `order_id: string`, `tags: string` | Updates the tags on an order. Tags is a comma-separated string. |
| `cancel_order` | `order_id: string`, `reason?: string` | Cancels an open order. Optional reason: `customer`, `fraud`, `inventory`, `declined`, `other`. |

### Product Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_product` | `title: string`, `body_html?: string`, `vendor?: string`, `product_type?: string`, `tags?: string` | Creates a new product in your store. |
| `update_product` | `product_id: string`, `title?: string`, `body_html?: string`, `tags?: string` | Updates an existing product's details. Only provided fields are changed. |

### Inventory

| Tool | Parameters | Description |
|------|------------|-------------|
| `update_inventory` | `inventory_item_id: string`, `location_id: string`, `available: number` | Sets the available inventory quantity for an item at a specific location. |

**Example prompts:**
- *"Tag order `12345` with `vip, express-shipping`."*
- *"Cancel order `67890` — the customer requested it."*
- *"Create a product called 'Wireless Charger' with vendor 'TechCo'."*
- *"Update product `789` to add the tag `on-sale`."*
- *"Set inventory for item `inv_abc` at location `loc_123` to 50 units."*
