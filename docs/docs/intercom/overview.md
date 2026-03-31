---
sidebar_position: 1
title: Overview
description: Intercom MCP Server — give AI assistants read-only access to your Intercom conversations and contacts.
---

# Intercom MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive, **read-only** access to the Intercom API.

## What can it do?

Ask your AI assistant questions like:

- *"Show me the last 20 open conversations."*
- *"What did the customer say in conversation `12345`?"*
- *"Search for conversations mentioning 'billing issue'."*
- *"Find the contact with email `jane@acme.com`."*
- *"List our most recently active contacts."*
- *"Get the full details for contact `abc123`."*

## Features

- **6 read-only tools** across 2 categories (Contacts, Conversations)
- **LLM-optimized responses** — HTML is stripped from message bodies, conversation parts are flattened into a chronological timeline, and internal Intercom metadata is removed
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — read-only by design, pinned to `Intercom-Version: 2.11`

## Supported Resources

| Category | Tools |
|----------|-------|
| **Contacts** | `list_contacts`, `get_contact`, `search_contacts` |
| **Conversations** | `list_conversations`, `get_conversation`, `search_conversations` |

## Prerequisites

- **Node.js** >= 20
- An **Intercom Access Token** with read permissions. You can generate one from [Settings > Integrations > Developer Hub](https://developers.intercom.com/) in your Intercom workspace.
