---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 12 Google Workspace MCP tools with parameters and example prompts.
---

# Tools Reference

Tools provide both read and write access to Google Workspace APIs.

## Gmail

Read and search your Gmail mailbox.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_messages` | `query?: string`, `max_results?: number` (default: 10, max: 100) | Lists recent messages with ID, subject, from, date, and snippet. Supports optional Gmail search query syntax. |
| `get_message` | `message_id: string` | Retrieves a specific message with decoded body (plain text), headers (From, To, Subject, Date), labels, and snippet. |
| `search_messages` | `query: string`, `max_results?: number` (default: 10, max: 100) | Searches messages using full Gmail search syntax. Returns matching messages with ID, subject, from, date, and snippet. |

**Gmail search syntax examples:**
- `is:unread` — unread messages
- `from:boss@company.com` — messages from a specific sender
- `subject:invoice after:2025/01/01` — subject match with date filter
- `has:attachment filename:pdf` — messages with PDF attachments
- `in:sent to:client@example.com` — sent messages to a recipient

**Example prompts:**
- *"Show me my 5 most recent unread emails."*
- *"What did the email from `jane@acme.com` say?"*
- *"Search for emails with PDF attachments from this month."*

---

## Calendar

Browse calendars and events.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_calendars` | *(none)* | Lists all calendars the user has access to, including shared and subscribed calendars. Returns calendar ID, name, description, and access role. |
| `list_events` | `calendar_id?: string` (default: `"primary"`), `time_min?: string`, `time_max?: string`, `max_results?: number` (default: 10, max: 250) | Lists events within a time range. Returns title, start/end times, attendees, location, and meeting link. Times must be in RFC 3339 format. |
| `get_event` | `calendar_id?: string` (default: `"primary"`), `event_id: string` | Retrieves full event details including description, attendees with RSVP status, recurrence rules, and conferencing info. |

**Time range format:** RFC 3339 (e.g., `2025-01-01T00:00:00Z`)

**Example prompts:**
- *"What meetings do I have this week?"*
- *"Show me tomorrow's events on my primary calendar."*
- *"Who is attending the standup meeting?"*
- *"List all calendars I have access to."*

---

## Drive

Browse and search Google Drive files.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_files` | `query?: string`, `max_results?: number` (default: 10, max: 100) | Lists files with name, type, owner, modified date, and sharing link. Supports optional Drive search query syntax. |
| `get_file` | `file_id: string` | Retrieves full file metadata including size, permissions, version history, and parent folders. |
| `search_files` | `query: string`, `max_results?: number` (default: 10, max: 100) | Searches files using Drive search query syntax. Returns matching files with name, type, owner, and modified date. |

**Drive search syntax examples:**
- `name contains 'Q4 Report'` — files with name matching
- `mimeType='application/pdf'` — PDF files only
- `'user@company.com' in writers` — files shared with a specific user
- `modifiedTime > '2025-01-01T00:00:00'` — recently modified files

**Example prompts:**
- *"Find the Q4 report in my Drive."*
- *"List all PDF files I own."*
- *"What files were modified last week?"*
- *"Show me the details for file `abc123`."*

---

## Sheets

Read spreadsheet data and metadata.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_spreadsheet` | `spreadsheet_id: string` | Retrieves spreadsheet metadata including title, sheet names, and sheet dimensions (row/column counts). |
| `get_sheet_values` | `spreadsheet_id: string`, `range: string` | Reads cell values for a given A1 notation range. Returns values as a 2D array. |
| `list_sheets` | `spreadsheet_id: string` | Lists all sheets (tabs) in a spreadsheet with their names, indices, and row/column counts. |

**A1 notation examples:**
- `Sheet1!A1:D50` — specific range on Sheet1
- `A1:Z100` — range on the first sheet
- `Sheet2!A:A` — entire column A on Sheet2

**Example prompts:**
- *"Read rows A1 through D50 from spreadsheet `abc123`."*
- *"What sheets are in spreadsheet `xyz789`?"*
- *"Show me the first 10 rows of the Sales sheet."*
- *"Get the metadata for my budget spreadsheet."*
