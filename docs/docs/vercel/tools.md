---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 8 Vercel MCP tools with parameters and example prompts.
---

# Tools Reference

Vercel MCP provides **8 tools** — 5 read tools and 3 write tools.

## Projects

Browse and inspect your Vercel projects.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_projects` | `limit?: number` (default: 20, max: 100) | Lists all Vercel projects with names, frameworks, and latest deployment info. Set `VERCEL_TEAM_ID` for team-scoped results. |
| `get_project` | `project_id: string` | Retrieves full details for a specific project including framework, build settings, git repository link, and latest deployment info. |

**Example prompts:**
- *"List all my Vercel projects."*
- *"What framework does the `my-app` project use?"*
- *"Show me the build settings for project `prj_abc123`."*

---

## Deployments

Track deployment status and diagnose build failures.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_deployments` | `project_id?: string`, `limit?: number` (default: 20, max: 100) | Lists deployments with status, URL, git commit info, and timestamps. Optionally filter by project. Set `VERCEL_TEAM_ID` for team-scoped results. |
| `get_deployment` | `deployment_id: string` | Retrieves full details for a specific deployment including status, URL, git commit info, build timings, and error messages. |
| `get_deployment_build_logs` | `deployment_id: string` | Retrieves build output logs for a deployment. Logs are cleaned (ANSI codes stripped) and truncated to the last 150 lines for LLM consumption. Errors typically appear at the end. |

**Example prompts:**
- *"What is the status of the latest deployment for my-app?"*
- *"Show me all deployments from the last 24 hours."*
- *"Get the build logs for deployment `dpl_abc123` — why did it fail?"*
- *"Which git commit triggered deployment `dpl_xyz789`?"*

---

## Write Operations

:::caution
Write tools create, cancel, and promote deployments in your Vercel account. Use with care.
:::

### Deployment Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_deployment` | `name: string`, `git_source: { type: string, ref: string, repo_id: string }` | Creates a new deployment from a git source. Specify the branch/tag ref and repository ID. |
| `cancel_deployment` | `deployment_id: string` | Cancels a deployment that is currently building or queued. |
| `promote_deployment` | `project_id: string`, `deployment_id: string` | Promotes a preview deployment to production. |

**Example prompts:**
- *"Deploy the `main` branch of my project."*
- *"Cancel deployment `dpl_building123` — it has the wrong config."*
- *"Promote deployment `dpl_preview456` to production."*
