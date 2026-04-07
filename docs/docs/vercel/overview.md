---
sidebar_position: 1
title: Overview
description: Vercel MCP Server — give AI assistants access to your Vercel projects and deployments.
---

# Vercel MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the Vercel API.

## What can it do?

Ask your AI assistant questions like:

- *"List all my Vercel projects and their frameworks."*
- *"What is the status of the latest deployment for my-app?"*
- *"Show me the build logs for the failed deployment `dpl_abc123`."*
- *"Which deployments happened in the last 24 hours?"*
- *"What git commit triggered the latest production deployment?"*

## Features

- **5 tools** across 2 categories (Projects, Deployments)
- **Team-scoped access** — set `VERCEL_TEAM_ID` to scope all queries to a specific Vercel team
- **LLM-optimized responses** — internal Vercel fields are stripped, build logs have ANSI codes removed and are truncated to the last 150 lines
- **Type-safe** — built with TypeScript and Zod schema validation

## Supported Resources

| Category | Tools |
|----------|-------|
| **Projects** | `list_projects`, `get_project` |
| **Deployments** | `list_deployments`, `get_deployment`, `get_deployment_build_logs` |

## Prerequisites

- **Node.js** >= 20
- A **Vercel API token** — generate one at [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
- (Optional) A **Vercel Team ID** — found in your team's General Settings URL
