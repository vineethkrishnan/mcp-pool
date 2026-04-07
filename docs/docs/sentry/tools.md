---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 13 Sentry MCP tools with parameters and example prompts.
---

# Tools Reference

Sentry MCP provides **13 tools** — 8 read tools and 5 write tools.

## Organizations

List accessible Sentry organizations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_organizations` | *(none)* | Lists all organizations the auth token has access to, including slug, name, and status. |

**Example prompts:**
- *"What Sentry organizations do I have access to?"*
- *"List my Sentry orgs."*

---

## Projects

Browse projects within an organization.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_projects` | `organization_slug: string` | Lists all projects in the given organization, including name, slug, platform, and date created. |

**Example prompts:**
- *"List all projects in the `acme-corp` organization."*
- *"What platforms are we monitoring in Sentry?"*

---

## Issues

Search and inspect Sentry issues (grouped error events).

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_issues` | `organization_slug: string`, `project_slug: string`, `query?: string` | Lists issues for a project. Supports Sentry search syntax in the `query` parameter (e.g., `is:unresolved`, `assigned:me`). |
| `get_issue` | `issue_id: string` | Retrieves full details for a specific issue, including title, culprit, first/last seen timestamps, event count, and assigned user. |
| `get_issue_events` | `issue_id: string`, `limit?: number` (default: 10) | Lists recent events (occurrences) for a specific issue. |

**Example prompts:**
- *"What are the top unresolved issues in the `api-gateway` project?"*
- *"Show me the details of issue `PROJ-42`."*
- *"How many times has issue `1234567890` occurred?"*
- *"List the last 5 events for issue `1234567890`."*
- *"Are there any unresolved issues assigned to me in the `web-app` project?"*

---

## Events

Inspect individual error events, stack traces, and breadcrumbs.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_events` | `organization_slug: string`, `project_slug: string`, `limit?: number` (default: 10) | Lists recent events for a project, including event ID, title, timestamp, and tags. |
| `get_event` | `organization_slug: string`, `project_slug: string`, `event_id: string` | Retrieves full details for a specific event, including stack trace, breadcrumbs, tags, context, and user info. |
| `get_latest_event` | `issue_id: string` | Retrieves the most recent event for an issue — useful for quickly inspecting the latest stack trace without knowing the event ID. |

**Example prompts:**
- *"Show me the latest events from the `backend` project."*
- *"Get the full stack trace for event `abc123def`."*
- *"What breadcrumbs led up to the latest crash in issue `PROJ-99`?"*
- *"Show me the latest event for issue `1234567890` with its full context."*
- *"What tags are associated with the most recent events in `web-app`?"*

---

## Write Operations

:::caution
Write tools modify issue state in your Sentry organization. Use with care.
:::

### Issue Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `resolve_issue` | `issue_id: string` | Resolves an issue, marking it as fixed. |
| `unresolve_issue` | `issue_id: string` | Reopens a previously resolved issue. |
| `ignore_issue` | `issue_id: string`, `ignore_duration?: number`, `ignore_count?: number`, `ignore_window?: number` | Ignores an issue. Optionally set duration (minutes), occurrence count, or time window thresholds. |
| `assign_issue` | `issue_id: string`, `assignee: string` | Assigns an issue to a user by username or email. |
| `merge_issues` | `issue_id: string`, `issue_ids: string[]` | Merges duplicate issues into a primary issue. |

**Example prompts:**
- *"Resolve issue `PROJ-42` — the fix has been deployed."*
- *"Assign issue `1234567890` to `jane@acme.com`."*
- *"Ignore issue `PROJ-99` for the next 24 hours."*
- *"Merge issues `PROJ-10` and `PROJ-11` into `PROJ-9` — they're duplicates."*
- *"Reopen issue `PROJ-50`, it's happening again."*
