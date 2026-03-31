# MCP Pool

[![CI](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/ci.yml/badge.svg)](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/ci.yml)
[![Quality](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/quality.yml/badge.svg)](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/quality.yml)
[![Security](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/security.yml/badge.svg)](https://github.com/vineethkrishnan/mcp-pool/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Documentation](https://mcp-pool-docs.pages.dev) | [npm](https://www.npmjs.com/org/vineethkrishnan) | [GitHub](https://github.com/vineethkrishnan/mcp-pool)

A curated collection of **Model Context Protocol (MCP) servers** that give AI assistants direct, read-only access to popular SaaS APIs — no dashboard switching required.

MCP Pool bridges the gap between AI chat interfaces and the business tools teams rely on daily. Ask questions in natural language, get real answers backed by live data.

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| **[@vineethkrishnan/stripe-mcp](packages/stripe)** | Read-only Stripe API access — customers, payments, subscriptions, invoices, products, payouts, disputes, and tax | [![npm](https://img.shields.io/npm/v/@vineethkrishnan/stripe-mcp)](https://www.npmjs.com/package/@vineethkrishnan/stripe-mcp) |

> More MCP servers coming soon. Contributions welcome!

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
      "args": ["-y", "@vineethkrishnan/stripe-mcp"],
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
│   └── stripe/              # Stripe MCP server
│       ├── src/
│       │   ├── index.ts     # MCP server entry point
│       │   ├── services/    # Stripe SDK wrapper
│       │   ├── tools/       # MCP tool definitions
│       │   └── common/      # Shared types & utilities
│       └── package.json
├── docs/                    # Docusaurus documentation site
├── .github/workflows/       # CI, quality, security, release
├── _docs/                   # Internal docs (gitignored)
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

Visit the [documentation site](https://mcp-pool-docs.pages.dev) for detailed guides on each MCP server.

---

## License

[MIT](LICENSE) — Vineeth Krishnan
