---
sidebar_position: 1
title: Overview
description: Datadog MCP Server — give AI assistants read-only access to your Datadog monitoring data.
---

# Datadog MCP Server

A Model Context Protocol server that provides AI assistants with comprehensive, **read-only** access to the Datadog API.

## What can it do?

Ask your AI assistant questions like:

- *"Are there any monitors currently in alert status?"*
- *"Show me the CPU usage for host web-01 over the last hour."*
- *"What events happened in our infrastructure in the last 24 hours?"*
- *"Find all monitors tagged with service:web."*
- *"Query the average request latency for our API service."*
- *"Get the details of monitor 12345."*

## Features

- **6 read-only tools** across 3 categories (Monitors, Metrics, Events)
- **Multi-site support** — works with all 6 Datadog regions (US1, US3, US5, EU, AP1, Gov)
- **LLM-optimized responses** — internal metadata stripped, metric series downsampled with summary statistics
- **Type-safe** — built with TypeScript and Zod schema validation
- **Security-first** — read-only by design, uses Datadog API + Application key pair

## Supported Resources

| Category | Tools |
|----------|-------|
| **Monitors** | `list_monitors`, `get_monitor`, `search_monitors` |
| **Metrics** | `query_metrics` |
| **Events** | `list_events`, `get_event` |

## Prerequisites

- **Node.js** >= 20
- A **Datadog API key** and **Application key**. Create both at [Datadog Organization Settings > API Keys](https://app.datadoghq.com/organization-settings/api-keys) and [Application Keys](https://app.datadoghq.com/organization-settings/application-keys).
