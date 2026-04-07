---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 12 HubSpot MCP tools with parameters and example prompts.
---

# Tools Reference

HubSpot MCP provides **12 tools** — 7 read tools and 5 write tools.

## Contacts

List, retrieve, and search CRM contacts.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_contacts` | `limit?: number` (default: 10, max: 100), `properties?: string[]`, `after?: string` | Lists contacts with optional property selection and cursor-based pagination. Default properties: firstname, lastname, email, phone, company, lifecyclestage, hs_lead_status. |
| `get_contact` | `contact_id: string`, `properties?: string[]`, `associations?: string[]` | Retrieves full details for a specific contact including requested properties and optional associations (linked companies, deals, tickets). |
| `search_contacts` | `query: string`, `properties?: string[]`, `limit?: number` (default: 10, max: 100) | Searches contacts using free-text search across default searchable properties (name, email, phone, company). |

**Example prompts:**
- *"List our 10 most recent contacts."*
- *"Find all contacts at Acme Corp."*
- *"Show me contact 12345 with their associated companies and deals."*
- *"Search for contacts with the email domain @example.com."*
- *"List contacts and include the `jobtitle` and `hs_lead_status` properties."*

---

## Deals

Track pipeline deals and revenue.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_deals` | `limit?: number` (default: 10, max: 100), `properties?: string[]`, `after?: string` | Lists deals with optional property selection and cursor-based pagination. Default properties: dealname, amount, dealstage, pipeline, closedate, hs_lastmodifieddate. |
| `get_deal` | `deal_id: string`, `properties?: string[]`, `associations?: string[]` | Retrieves full details for a specific deal including pipeline stage, amount, close date, and optional associations (linked contacts, companies). |

**Example prompts:**
- *"What deals are currently in the pipeline?"*
- *"Show me deal 67890 with associated contacts and companies."*
- *"List the last 20 deals and their close dates."*
- *"What is the total value of deals in the negotiation stage?"*

---

## Companies

Browse and inspect company records.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_companies` | `limit?: number` (default: 10, max: 100), `properties?: string[]`, `after?: string` | Lists companies with optional property selection and cursor-based pagination. Default properties: name, domain, industry, city, state, phone, numberofemployees. |
| `get_company` | `company_id: string`, `properties?: string[]`, `associations?: string[]` | Retrieves full details for a specific company including domain, industry, and optional associations (linked contacts, deals). |

**Example prompts:**
- *"List all companies in the technology industry."*
- *"Show me company 11111 with their associated contacts."*
- *"How many employees does company 22222 have?"*
- *"List companies and include the `annualrevenue` property."*

---

## Pagination

All list tools support cursor-based pagination through the `after` parameter. To paginate:

1. Call the list tool without `after` to get the first page
2. Check for `paging.next.after` in the response
3. Pass that value as the `after` parameter in the next call

**Example:**
- *"List the next page of contacts using cursor `abc123`."*

## Custom Properties

All tools accept a `properties` parameter to request specific CRM properties. If omitted, sensible defaults are used. To discover available properties, check your [HubSpot Property Settings](https://app.hubspot.com/property-settings/).

**Example:**
- *"List contacts with properties firstname, lastname, email, and jobtitle."*

---

## Write Operations

:::caution
Write tools create and modify CRM records in your HubSpot account. Use with care.
:::

### Contact Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_contact` | `properties: Record<string, string>` | Creates a new contact. Pass properties as key-value pairs (e.g., `firstname`, `lastname`, `email`). |
| `update_contact` | `contact_id: string`, `properties: Record<string, string>` | Updates properties on an existing contact. |

### Deal Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_deal` | `properties: Record<string, string>` | Creates a new deal. Pass properties as key-value pairs (e.g., `dealname`, `amount`, `dealstage`). |
| `update_deal_stage` | `deal_id: string`, `dealstage: string`, `pipeline?: string` | Updates a deal's pipeline stage. Optionally specify the pipeline. |

### Notes

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_note` | `content: string`, `contact_id?: string`, `deal_id?: string` | Creates a note and optionally associates it with a contact or deal. |

**Example prompts:**
- *"Create a contact for Jane Doe with email `jane@acme.com`."*
- *"Update contact `12345`'s phone number to `+1-555-0100`."*
- *"Create a deal called 'Enterprise License' worth $50,000 in the negotiation stage."*
- *"Move deal `67890` to the 'Closed Won' stage."*
- *"Add a note to contact `12345`: 'Discussed renewal timeline on call'."*
