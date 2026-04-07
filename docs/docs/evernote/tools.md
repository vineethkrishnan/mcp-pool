---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 12 Evernote MCP tools with parameters and example prompts.
---

# Tools Reference

Evernote MCP provides **12 tools** — 6 read tools and 6 write tools.

## Notebooks

List and inspect notebooks.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_notebooks` | *(none)* | Lists all notebooks with name, GUID, and default notebook flag. |
| `get_notebook` | `notebook_guid: string` | Retrieves full details for a specific notebook. |

**Example prompts:**
- *"List all my Evernote notebooks."*
- *"Show me the details of notebook `abc123`."*

---

## Notes

List, read, and search notes.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_notes` | `notebook_guid?: string`, `limit?: number` (default: 25), `offset?: number` | Lists recent notes, optionally filtered by notebook. Sorted by last updated. |
| `get_note` | `note_guid: string` | Retrieves a note with full content converted to readable plain text. |
| `search_notes` | `query: string`, `limit?: number` (default: 25), `offset?: number` | Searches notes using Evernote's search grammar. |

**Evernote search syntax examples:**
- `meeting notes` — keyword search
- `notebook:Work` — notes in a specific notebook
- `tag:important` — notes with a specific tag
- `created:20250101` — notes created after a date
- `intitle:budget` — search in note titles only

**Example prompts:**
- *"Show me the last 10 notes in my Work notebook."*
- *"Read the full content of note `def456`."*
- *"Search for notes about 'quarterly review'."*
- *"Find notes tagged 'important' created this month."*

---

## Tags

List available tags.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_tags` | *(none)* | Lists all tags with name, GUID, and parent tag GUID. |

**Example prompts:**
- *"What tags do I have in Evernote?"*
- *"List all my tags."*

---

## Write Operations

:::caution
Write tools create, modify, and delete notes in your Evernote account. Use with care.
:::

### Note Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_note` | `title: string`, `content: string`, `notebook_guid?: string`, `tags?: string[]` | Creates a new note. Content is plain text, auto-converted to Evernote format. Tags are created if they don't exist. |
| `update_note` | `note_guid: string`, `title?: string`, `content?: string`, `notebook_guid?: string`, `tags?: string[]` | Updates a note. Only provided fields are changed. Setting tags replaces all existing tags. |
| `delete_note` | `note_guid: string` | Moves a note to the trash. Can be restored from Evernote's trash. |
| `move_note` | `note_guid: string`, `notebook_guid: string` | Moves a note to a different notebook. |

**Example prompts:**
- *"Create a note titled 'Meeting Notes' with today's action items in my Work notebook."*
- *"Update note `abc123` to add the tag 'reviewed'."*
- *"Delete note `old456` — it's no longer needed."*
- *"Move note `def789` to the Archive notebook."*

### Notebook Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_notebook` | `name: string` | Creates a new notebook. |

**Example prompts:**
- *"Create a notebook called 'Project Alpha'."*

### Tag Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_tag` | `name: string`, `parent_guid?: string` | Creates a new tag. Optionally set a parent for hierarchical tags. |

**Example prompts:**
- *"Create a tag called 'urgent'."*
- *"Create a tag 'sub-task' under parent tag `parent123`."*
