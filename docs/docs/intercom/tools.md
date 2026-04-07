---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 11 Intercom MCP tools with parameters and example prompts.
---

# Tools Reference

Intercom MCP provides **11 tools** — 6 read tools and 5 write tools.

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

---

## Write Operations

:::caution
Write tools send replies to customers and modify conversation state. Use with care.
:::

### Conversation Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `reply_to_conversation` | `conversation_id: string`, `body: string`, `admin_id: string` | Sends an admin reply to a conversation. The reply is visible to the customer. |
| `close_conversation` | `conversation_id: string`, `admin_id: string` | Closes a conversation. |
| `snooze_conversation` | `conversation_id: string`, `admin_id: string`, `snoozed_until: number` | Snoozes a conversation until a specified time (UNIX epoch seconds). |
| `assign_conversation` | `conversation_id: string`, `admin_id: string`, `assignee_id: string`, `assignee_type?: string` | Assigns a conversation to an admin or team. Defaults to `"admin"` type. |
| `add_note` | `conversation_id: string`, `admin_id: string`, `body: string` | Adds an internal note to a conversation (not visible to the customer). |

**Example prompts:**
- *"Reply to conversation `12345` saying 'Your refund has been processed'."*
- *"Close conversation `67890`."*
- *"Snooze conversation `11111` until tomorrow at 9 AM."*
- *"Assign conversation `22222` to admin `admin_abc`."*
- *"Add an internal note to conversation `33333`: 'Escalated to engineering'."*
