# MCP Pool

[![CI](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/ci.yml/badge.svg)](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/ci.yml)
[![Quality](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/quality.yml/badge.svg)](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/quality.yml)
[![Security](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/security.yml/badge.svg)](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Documentation](https://mcp-pool.vineethnk.in) | [npm](https://www.npmjs.com/~vineethnkrishnan) | [GitHub](https://github.com/vineethkrishnan/mcp-pool)

A curated collection of **Model Context Protocol (MCP) servers** that give AI assistants direct, read-only access to popular SaaS APIs — no dashboard switching required.

MCP Pool bridges the gap between AI chat interfaces and the business tools teams rely on daily. Ask questions in natural language, get real answers backed by live data.

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| **[@vineethnkrishnan/stripe-mcp](packages/stripe)** | Stripe — payments, customers, subscriptions, invoices | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/stripe-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/stripe-mcp) |
| **[@vineethnkrishnan/sentry-mcp](packages/sentry)** | Sentry — issues, events, stack traces. Self-hosted support. | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/sentry-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/sentry-mcp) |
| **[@vineethnkrishnan/notion-mcp](packages/notion)** | Notion — pages, databases, search, content | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/notion-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/notion-mcp) |
| **[@vineethnkrishnan/linear-mcp](packages/linear)** | Linear — issues, projects, teams (GraphQL) | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/linear-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/linear-mcp) |
| **[@vineethnkrishnan/datadog-mcp](packages/datadog)** | Datadog — monitors, metrics, events. Multi-site support. | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/datadog-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/datadog-mcp) |
| **[@vineethnkrishnan/vercel-mcp](packages/vercel)** | Vercel — deployments, projects, build logs | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/vercel-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/vercel-mcp) |
| **[@vineethnkrishnan/pagerduty-mcp](packages/pagerduty)** | PagerDuty — incidents, on-call, services. EU support. | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/pagerduty-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/pagerduty-mcp) |
| **[@vineethnkrishnan/hubspot-mcp](packages/hubspot)** | HubSpot — contacts, deals, companies | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/hubspot-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/hubspot-mcp) |
| **[@vineethnkrishnan/intercom-mcp](packages/intercom)** | Intercom — conversations, contacts, support | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/intercom-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/intercom-mcp) |
| **[@vineethnkrishnan/shopify-mcp](packages/shopify)** | Shopify — orders, products, customers | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/shopify-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/shopify-mcp) |
| **[@vineethnkrishnan/google-workspace-mcp](packages/google-workspace)** | Google Workspace — Gmail, Calendar, Drive, Sheets | [![npm](https://img.shields.io/npm/v/@vineethnkrishnan/google-workspace-mcp)](https://www.npmjs.com/package/@vineethnkrishnan/google-workspace-mcp) |

---

## Quick Start

### Prerequisites

- **Node.js** >= 20 (see [`.nvmrc`](.nvmrc))

### Use with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

Then ask Claude things like:
- *"How many active subscriptions do we have?"*
- *"Why did the last payment for cus_123 fail?"*
- *"Show me our current Stripe balance."*

---

## Development

```bash
# Clone and install
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
```

| Command | Description |
|---------|-------------|
| `npm run build` | Build all packages |
| `npm test` | Run tests across all packages |
| `npm run lint:check` | Lint with ESLint |
| `npm run format:check` | Check formatting with Prettier |
| `npm run docs:start` | Start docs dev server |

---

## Project Structure

```
mcp-pool/
├── packages/
│   ├── oauth-core/          # Shared OAuth 2.0 infrastructure
│   │   └── src/
│   │       ├── strategies/  # OAuth & static token strategies
│   │       └── cli/         # Auth login/logout CLI helpers
│   └── <server>/            # MCP server (×11)
│       └── src/
│           ├── index.ts     # MCP server entry point
│           ├── services/    # API SDK wrapper
│           ├── tools/       # MCP tool definitions
│           └── common/      # Shared types & utilities
├── docs/                    # Docusaurus documentation site
├── .github/workflows/       # CI, quality, security, release
└── package.json             # Monorepo root (npm workspaces)
```

---

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** | Push / PR to `main` | Lint, test (Node 20 + 22), build |
| **Quality** | Push / PR to `main` | Dead code detection (knip), code duplication (jscpd) |
| **Security** | Push / PR / weekly | CodeQL analysis, dependency review, Trivy scan |
| **Commit Lint** | PR | Validates PR title follows Conventional Commits |
| **Release** | Push to `main` | release-please versioning, npm publish, docs deploy |

---

## Adding a New MCP Server

1. Create `packages/<name>/` following the structure in `packages/stripe/`
2. Implement a **service layer** (API wrapper) and **tool layer** (MCP interface)
3. Add tests — aim for full coverage
4. Add the package entry to `release-please-config.json` and `.release-please-manifest.json`
5. Add documentation pages in `docs/`

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## Commit Convention

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(stripe): add refund support
fix(stripe): handle null customer email
docs: update installation guide
```

Enforced via commitlint + husky pre-commit hooks.

---

## Documentation

Visit the [documentation site](https://mcp-pool.vineethnk.in) for detailed guides on each MCP server.

---

## Roadmap

See the [roadmap](roadmap/) for planned features and upcoming milestones:

- **[v0.2.0](roadmap/v0.2.0.md)** — Write operations, SSE transport, streaming responses
- **[v0.3.0](roadmap/v0.3.0.md)** — Webhooks, multi-account, expanded API coverage, new servers

---

## License

[MIT](LICENSE) — Vineeth Krishnan
