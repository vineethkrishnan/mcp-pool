---
sidebar_position: 1
title: Overview
description: Evernote MCP Server — give AI assistants access to your Evernote account.
---

# Evernote MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Evernote API for managing notes, notebooks, and tags.

## What can it do?

Ask your AI assistant questions like:

- *"List all my Evernote notebooks."*
- *"Show me the last 10 notes in my Work notebook."*
- *"Search for notes about 'quarterly review'."*
- *"Create a note titled 'Meeting Notes' with today's action items."*
- *"Move that note to the Archive notebook."*
- *"Tag the note with 'important' and 'follow-up'."*

## Features

- **12 tools** across 3 categories (Notes, Notebooks, Tags) with full read and write support
- **LLM-optimized responses** — ENML content is automatically converted to plain text for readable output
- **Type-safe** — built with TypeScript and Zod schema validation
- **Full search grammar** — supports `notebook:`, `tag:`, `created:`, `intitle:`, and keyword search

## Supported Resources

| Category | Read Tools | Write Tools |
|----------|------------|-------------|
| **Notes** | `list_notes`, `get_note`, `search_notes` | `create_note`, `update_note`, `delete_note`, `move_note` |
| **Notebooks** | `list_notebooks`, `get_notebook` | `create_notebook` |
| **Tags** | `list_tags` | `create_tag` |

## Prerequisites

- **Node.js** >= 20
- An **Evernote developer token**. Get one at [Evernote Developer Tokens](https://dev.evernote.com/doc/articles/dev_tokens.php).
