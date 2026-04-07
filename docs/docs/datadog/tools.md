---
sidebar_position: 3
title: Tools Reference
description: Complete reference for all 9 Datadog MCP tools with parameters and example prompts.
---

# Tools Reference

Datadog MCP provides **9 tools** — 6 read tools and 3 write tools.

## Monitors

List, search, and inspect Datadog monitors.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_monitors` | `query?: string`, `limit?: number` (default: 25, max: 100) | Lists monitors, optionally filtered by query string (e.g., `type:metric status:alert tag:service:web`). Returns name, status, query, tags, and thresholds. |
| `get_monitor` | `monitor_id: number` | Retrieves full details for a specific monitor including status, query, thresholds, tags, and notification targets. |
| `search_monitors` | `query: string`, `limit?: number` (default: 25, max: 100) | Searches monitors using Datadog monitor search syntax. Example queries: `type:metric status:alert`, `tag:service:web`, `notification:@pagerduty`. |

**Example prompts:**
- *"Are there any monitors currently in alert status?"*
- *"Find all monitors tagged with service:web."*
- *"Get the details and thresholds of monitor 12345."*
- *"Search for monitors that notify PagerDuty."*
- *"List all metric monitors in our production environment."*

---

## Metrics

Query timeseries metric data.

| Tool | Parameters | Description |
|------|------------|-------------|
| `query_metrics` | `query: string`, `from: number`, `to: number` | Queries timeseries metric data using Datadog's metric query syntax. Returns data points and summary statistics. Times are UNIX epoch seconds. |

The `query` parameter uses Datadog's native metric query language. Examples:

- `avg:system.cpu.user{host:web-01}` — average CPU usage for a specific host
- `sum:trace.servlet.request.hits{service:web-app}.as_count()` — request count for a service
- `max:system.mem.used{env:prod} by {host}` — memory usage grouped by host

**Example prompts:**
- *"Show me the CPU usage for host web-01 over the last hour."*
- *"Query the average request latency for our API service over the past 4 hours."*
- *"What was the peak memory usage across production hosts today?"*

---

## Events

Browse infrastructure and application events.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_events` | `start: number`, `end: number`, `limit?: number` (default: 25, max: 100) | Lists events within a time range. Events include deployments, alerts, comments, and other activity. Times are UNIX epoch seconds. |
| `get_event` | `event_id: number` | Retrieves a specific event including title, text, tags, and related resources. |

**Example prompts:**
- *"What events happened in our infrastructure in the last 24 hours?"*
- *"Show me recent deployment events."*
- *"Get the details of event 67890."*

---

## Write Operations

:::caution
Write tools modify monitor state and create downtimes in your Datadog account. Use with care.
:::

### Monitor Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `mute_monitor` | `monitor_id: string`, `end?: number`, `scope?: string` | Mutes a monitor. Optionally set an end time (UNIX epoch) and scope (e.g., `host:web-01`). |
| `unmute_monitor` | `monitor_id: string`, `scope?: string` | Unmutes a previously muted monitor. Optionally scope to a specific tag. |

### Downtime

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_downtime` | `scope: string`, `start?: number`, `end?: number`, `message?: string`, `monitor_id?: number` | Creates a scheduled downtime window. Scope defines affected resources (e.g., `env:staging`). Times are UNIX epoch seconds. |

**Example prompts:**
- *"Mute monitor 12345 for the next 2 hours."*
- *"Unmute monitor 67890."*
- *"Schedule a maintenance downtime for `env:staging` from midnight to 6 AM."*
- *"Mute monitor 555 scoped to `host:web-01` during the deployment."*
