# Sentry MCP Server Documentation

Welcome to the `sentry-mcp` server documentation. For the full documentation site, visit [mcp-pool.vineethnk.in](https://mcp-pool.vineethnk.in). This guide details the available tools, their parameters, and examples for how to use them through an AI assistant.

---

## Core Tool Categories

### 1. Organization

Discover available Sentry organizations.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_organizations` | *(none)* | Lists all Sentry organizations the current auth token has access to. |

**Example AI Prompt:**
> "What Sentry organizations do I have access to?"

---

### 2. Project

Browse projects within an organization.

| Tool | Parameters | Description |
|------|------------|-------------|
| `list_projects` | `org?: string` | Lists all projects in a Sentry organization. Uses `SENTRY_ORG` if not specified. |

**Example AI Prompt:**
> "List all projects in my Sentry organization."

---

### 3. Issue

Investigate and search for error issues.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_issue` | `issue_id: string` | Retrieves full details for a specific issue including title, culprit, status, first/last seen, event count, and assigned user. |
| `list_issues` | `project: string`, `org?: string`, `query?: string`, `sort?: string`, `limit?: number (default: 25)` | Lists issues for a specific project. Supports Sentry search syntax (e.g., `is:unresolved`, `level:error`). |
| `search_issues` | `query: string`, `org?: string`, `limit?: number (default: 25)` | Searches issues across ALL projects in an organization using full-text search. |

**Example AI Prompt:**
> "Show me the top 10 unresolved errors in the `my-frontend` project, sorted by frequency."

> "Search across all projects for any issues mentioning `TypeError`."

---

### 4. Event

Inspect individual error occurrences with full stack traces and breadcrumbs.

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_event` | `event_id: string`, `project: string`, `org?: string` | Retrieves a specific event including full stack trace, breadcrumbs, tags, and context. |
| `list_issue_events` | `issue_id: string`, `limit?: number (default: 25)` | Lists recent events (occurrences) for a specific issue. |
| `get_latest_event` | `issue_id: string` | Retrieves the most recent event for an issue. The go-to tool for "show me the stack trace." |

**Example AI Prompt:**
> "Get the latest stack trace for issue `12345` and tell me what's causing it."

> "List the last 5 events for issue `67890` and check if the error pattern is consistent."

---

## Response Transformation

All Sentry API responses pass through an automatic transformation pipeline before being returned:

1. **Key Stripping**: Verbose Sentry fields (`pluginActions`, `pluginContexts`, `pluginIssues`, `seenBy`, `activity`, `participants`, `dist`) are recursively removed to reduce noise.
2. **Stack Frame Truncation**: Exception stack traces are capped at the **15 most recent frames** per exception. A `_truncated` metadata object is added with `kept` and `total` counts so the AI knows data was trimmed.
3. **Breadcrumb Truncation**: Breadcrumb entries are capped at the **20 most recent entries**. A `_truncated` metadata object is added with `kept` and `total` counts.

This optimization reduces token consumption and keeps responses focused on the most relevant debugging information.

---

## Architectural Details

### Layered Design

The server is structured with clear separation of concerns:

- **`src/common/`**: Shared types and response transformation utilities (key stripping, stack frame truncation, breadcrumb truncation).
- **`src/services/`**: HTTP client that communicates with the Sentry API. Handles authentication, base URL resolution, and error handling.
- **`src/tools/`**: Maps MCP tool definitions to service calls. Defines Zod schemas for the LLM.
- **`src/index.ts`**: The entry point that manages the JSON-RPC stdio lifecycle and registers all tools.

### Self-Hosted Support

The HTTP client resolves the Sentry API base URL at startup from the `SENTRY_BASE_URL` environment variable, defaulting to `https://sentry.io`. This means the same codebase works seamlessly with both Sentry SaaS and any self-hosted Sentry instance without code changes.

---

## Data Privacy & Safety

- **Scoped Access**: We recommend using API tokens with minimal required scopes to limit the server's capabilities to what your workflow needs.
- **Token Scoping**: We strongly recommend using Sentry auth tokens with the minimum required scopes (`org:read`, `project:read`, `event:read`) for this server.
- **No Data Storage**: The server does not cache, store, or log any Sentry data. All responses are streamed directly to the MCP client.

---

## Future Roadmap

- **Phase 2**: Tags, releases, teams, and project stats tools.
- **Phase 3**: Performance monitoring (transactions, spans, trends).
- **Phase 4**: Alert rules and notification management.
- **Phase 5**: Write operations (resolve issues, assign, merge).
