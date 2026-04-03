# MCP Pool Roadmap

This directory tracks planned features and improvements for the mcp-pool monorepo, organized by target version.

## How to use

Each file represents a version milestone:
- `v0.2.0.md` — next minor release
- `v0.3.0.md` — future minor release
- `v1.0.0.md` — major release goals (when applicable)

## Versioning strategy

- MCP server packages follow independent versioning via release-please
- Roadmap versions represent **milestone themes**, not a single package version
- A milestone is complete when all listed features have shipped across the relevant packages

## Current milestones

| Milestone | Theme | Status |
|-----------|-------|--------|
| [v0.2.0](v0.2.0.md) | Write operations, SSE transport, streaming | Planning |
| [v0.3.0](v0.3.0.md) | Advanced integrations, multi-account, webhooks | Ideation |

## Detailed specs

| Spec | Feature |
|------|---------|
| [v0.2.0-write-operations.md](v0.2.0-write-operations.md) | Write operations implementation — tool inventory, file structure, opt-in design, phased rollout |
