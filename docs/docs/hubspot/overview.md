---
sidebar_position: 1
title: Overview
description: HubSpot MCP Server — give AI assistants read-only access to your HubSpot CRM contacts, companies, and deals.
---

# HubSpot MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive, **read-only** access to the HubSpot CRM API.

## What can it do?

Ask your AI assistant questions like:

- *"List our 10 most recent contacts."*
- *"Find all contacts at Acme Corp."*
- *"What deals are currently in the negotiation stage?"*
- *"Show me the details and associated companies for contact 12345."*
- *"How many open deals do we have and what is the total pipeline value?"*
- *"List all companies in the technology industry."*
- *"What deals are associated with company 11111?"*

## Features

- **7 read-only tools** across 3 categories (Contacts, Deals, Companies)
- **Flexible property selection** — request exactly the CRM properties you need, with sensible defaults
- **Association support** — retrieve linked objects (contacts on a deal, companies for a contact) in a single call
- **Search API** — free-text search across contacts by name, email, phone, or company
- **LLM-optimized responses** — nested `properties` objects are flattened to top-level fields, associations are simplified to ID arrays, internal metadata is stripped
- **Type-safe** — built with TypeScript and Zod schema validation

## Supported Resources

| Category | Tools |
|----------|-------|
| **Contacts** | `list_contacts`, `get_contact`, `search_contacts` |
| **Deals** | `list_deals`, `get_deal` |
| **Companies** | `list_companies`, `get_company` |

## Prerequisites

- **Node.js** >= 20
- A **HubSpot private app access token** — create one at [HubSpot > Settings > Integrations > Private Apps](https://developers.hubspot.com/docs/api/private-apps). Grant at minimum `crm.objects.contacts.read`, `crm.objects.deals.read`, and `crm.objects.companies.read` scopes.

Alternatively, use **OAuth 2.0** for automatic token refresh — run `hubspot-mcp auth login` to authenticate via browser.
