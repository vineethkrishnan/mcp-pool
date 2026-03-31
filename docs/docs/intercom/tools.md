---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 6 Intercom MCP tools with parameters and example prompts.
---

# Tools Reference

All tools are **read-only**. They retrieve data from Intercom but never create, update, or delete anything.

## Contacts

Browse and search your Intercom contacts (users and leads).

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_contacts` | `limit?: number` (default: 50) | Lists contacts with email, name, role, and last seen time. |
| `get_contact` | `contact_id: string` | Retrieves full contact details including email, name, custom attributes, tags, companies, and location. |
| `search_contacts` | `query: string`, `limit?: number` (default: 50) | Searches contacts by email address or partial email. |

**Example prompts:**
- *"List our 20 most recent contacts."*
- *"Find the contact with email `jane@acme.com`."*
- *"Get full details for contact `abc123` including their tags and companies."*

---

## Conversations

Browse, retrieve, and search Intercom conversations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_conversations` | `limit?: number` (default: 20, max: 150) | Lists recent conversations with state, assignee, and last message preview. |
| `get_conversation` | `conversation_id: string` | Retrieves full conversation with all parts flattened into a chronological timeline. HTML is stripped from message bodies. |
| `search_conversations` | `query: string`, `limit?: number` (default: 20) | Searches conversations by message body content. Use to find conversations about a specific topic or keyword. |

**Example prompts:**
- *"Show me the last 10 open conversations."*
- *"What did the customer say in conversation `12345`?"*
- *"Search for conversations mentioning 'refund request'."*
- *"Find all conversations about billing issues."*
