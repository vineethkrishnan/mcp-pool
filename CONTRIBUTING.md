# Contributing to MCP Pool

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run tests: `npm test`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `build`, `ci`, `perf`, `hotfix`

Examples:
- `feat(stripe): add refund support`
- `fix(stripe): handle null customer email`
- `docs: update installation guide`

Commit messages are enforced via commitlint. PR titles must also follow this convention.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure all checks pass: `npm run lint:check && npm test && npm run build`
4. Open a PR against `main`
5. Fill out the PR template

## Adding a New MCP Server

1. Create `packages/<name>/` following the structure in `packages/stripe/`
2. Implement the service layer (API wrapper) and tool layer (MCP interface)
3. Add tests with full coverage
4. Add the package entry to `release-please-config.json` and `.release-please-manifest.json`
5. Add documentation to `docs/`

## Code Style

- TypeScript strict mode
- No `any` types (use `unknown` if needed)
- ESLint + Prettier enforced via pre-commit hooks
- Tests co-located with source files (`*.test.ts`)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
