---
sidebar_position: 1
title: Overview
description: PagerDuty MCP Server — give AI assistants access to your PagerDuty incidents, services, and on-call schedules.
---

# PagerDuty MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive access to the PagerDuty API.

## What can it do?

Ask your AI assistant questions like:

- *"Are there any triggered incidents right now?"*
- *"Who is currently on-call for the primary rotation?"*
- *"Show me the details of incident PABC123."*
- *"List all our PagerDuty services and their status."*
- *"What does the escalation policy look like for the backend service?"*
- *"How many incidents were resolved this week?"*

## Features

- **6 tools** across 3 categories (Incidents, Services, On-Call)
- **EU region support** — set `PAGERDUTY_BASE_URL` to `https://api.eu.pagerduty.com` for EU accounts
- **LLM-optimized responses** — internal PagerDuty metadata is stripped, escalation policies are flattened to human-readable summaries
- **Type-safe** — built with TypeScript and Zod schema validation

## Supported Resources

| Category | Tools |
|----------|-------|
| **Incidents** | `list_incidents`, `get_incident` |
| **Services** | `list_services`, `get_service` |
| **On-Call** | `list_oncalls`, `get_schedule` |

## Prerequisites

- **Node.js** >= 20
- A **PagerDuty API key** — generate one at [PagerDuty > Integrations > API Access Keys](https://support.pagerduty.com/docs/api-access-keys). A read-only key is sufficient.
