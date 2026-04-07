---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 11 Linear MCP tools with parameters and example prompts.
---

# Tools Reference

Linear MCP provides **11 tools** — 6 read tools and 5 write tools.

## Issues

Search, list, and inspect issues across teams.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_issues` | `team_id?: string`, `status?: string`, `limit?: number` (default: 25, max: 50) | Lists issues, optionally filtered by team and workflow state. Returns title, identifier, priority, state, assignee, and labels. |
| `get_issue` | `issue_id: string` | Retrieves full details for a specific issue including title, description, state, priority, assignee, labels, and timestamps. Accepts both UUID and human-readable identifier (e.g., `ENG-123`). |
| `search_issues` | `query: string`, `limit?: number` (default: 25, max: 50) | Searches issues by text query across all teams. Returns matching issues with title, identifier, priority, state, and assignee. |

**Example prompts:**
- *"Show me all in-progress issues for the Engineering team."*
- *"What's the status and description of issue ENG-123?"*
- *"Search for issues related to the authentication refactor."*
- *"List all urgent issues across the workspace."*
- *"Find issues mentioning 'database migration'."*

---

## Projects

Track project progress and metadata.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_projects` | `limit?: number` (default: 25, max: 50) | Lists all projects in the workspace. Returns name, state, progress percentage, lead, start/target dates, and associated teams. |
| `get_project` | `project_id: string` | Retrieves full details for a specific project including name, description, state, progress, lead, start/target dates, and associated teams. |

**Example prompts:**
- *"List all active projects and their progress."*
- *"What's the current status and timeline of project `proj_abc123`?"*
- *"Show me which projects are behind schedule."*

---

## Teams

View team structure and membership.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_teams` | `limit?: number` (default: 25, max: 50) | Lists all teams in the workspace including name, key (prefix for issue identifiers), description, and members with name and email. |

**Example prompts:**
- *"What teams do we have and who's on each one?"*
- *"Show me the Engineering team's key and members."*
- *"List all teams in our Linear workspace."*

---

## Write Operations

:::caution
Write tools create and modify issues and projects in your Linear workspace. Use with care.
:::

### Issue Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_issue` | `team_id: string`, `title: string`, `description?: string`, `assignee_id?: string`, `priority?: number` (0-4), `state_id?: string` | Creates a new issue in a team. Priority: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low. |
| `update_issue_status` | `issue_id: string`, `state_id: string` | Updates the workflow state of an issue. |
| `assign_issue` | `issue_id: string`, `assignee_id: string` | Assigns an issue to a user. |
| `add_issue_comment` | `issue_id: string`, `body: string` | Adds a comment to an issue. Supports Markdown. |

### Project Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_project` | `name: string`, `team_ids: string[]`, `description?: string` | Creates a new project associated with one or more teams. |

**Example prompts:**
- *"Create a high-priority issue in the Engineering team: 'Fix login timeout bug'."*
- *"Move issue ENG-123 to the 'In Review' state."*
- *"Assign issue ENG-456 to `user_abc`."*
- *"Add a comment to ENG-789: 'Root cause identified — fix incoming'."*
- *"Create a project called 'Q2 Platform Hardening' for the Platform team."*
