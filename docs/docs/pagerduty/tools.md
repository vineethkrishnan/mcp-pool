---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 6 PagerDuty MCP tools with parameters and example prompts.
---

# Tools Reference

All tools are **read-only**. They retrieve data from PagerDuty but never create, update, or delete anything.

## Incidents

Monitor and inspect incident activity.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_incidents` | `status?: "triggered" \| "acknowledged" \| "resolved"`, `limit?: number` (default: 25, max: 100) | Lists incidents with summary, status, urgency, service, and assignments. Optionally filter by status. |
| `get_incident` | `incident_id: string` | Retrieves full details for a specific incident including title, status, urgency, service, escalation policy, assignments, acknowledgements, and timestamps. |

**Example prompts:**
- *"Are there any triggered incidents right now?"*
- *"Show me the details of incident PABC123."*
- *"List all resolved incidents."*
- *"How many acknowledged incidents do we have?"*

---

## Services

Discover and inspect PagerDuty service configurations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_services` | `limit?: number` (default: 25, max: 100) | Lists services with name, status, escalation policy, and alert grouping settings. |
| `get_service` | `service_id: string` | Retrieves full details for a specific service including status, description, escalation policy, integrations, and alert creation settings. |

**Example prompts:**
- *"List all our PagerDuty services and their status."*
- *"What escalation policy is configured for service PSVC123?"*
- *"Show me all services that are currently active."*

---

## On-Call

Check who is on-call and view schedule configurations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_oncalls` | `schedule_ids?: string[]`, `limit?: number` (default: 25, max: 100) | Lists who is currently on-call with user, escalation policy, escalation level, schedule, and time window. Optionally filter by schedule IDs. |
| `get_schedule` | `schedule_id: string` | Retrieves a specific on-call schedule including rotation details, current on-call user, overrides, and the rendered schedule. |

**Example prompts:**
- *"Who is currently on-call?"*
- *"Who is on-call for schedule PSCH123?"*
- *"Show me the full rotation details for the primary on-call schedule."*
- *"List all on-call entries and their escalation levels."*
