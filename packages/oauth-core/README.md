# OAuth Core

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Shared OAuth 2.0 infrastructure for MCP server packages — token storage, browser-based auth flow, and automatic token refresh.

## Overview

`oauth-core` is an internal library used by MCP servers in the [mcp-pool](https://github.com/vineethkrishnan/mcp-pool) monorepo to provide consistent OAuth2 authentication. It is not intended to be used as a standalone package.

## Used By

- `@vineethnkrishnan/notion-mcp`
- `@vineethnkrishnan/linear-mcp`
- `@vineethnkrishnan/hubspot-mcp`
- `@vineethnkrishnan/intercom-mcp`
- `@vineethnkrishnan/shopify-mcp`
- `@vineethnkrishnan/google-workspace-mcp`

## Features

- **Token Storage:** Persistent local filesystem storage with automatic refresh.
- **Browser-Based OAuth Flow:** Opens the user's browser for authorization, runs a local callback server.
- **CLI Integration:** Adds `auth login` and `auth logout` subcommands to MCP server CLIs.
- **Strategy Pattern:** `OAuthStrategy` for OAuth2 flows, `StaticTokenStrategy` for API keys — unified behind a common `TokenProvider` interface.
- **Configuration-Driven:** No hardcoded URLs; each consuming package provides its own OAuth config.

## API

### `createAuthProvider(config)`

Creates an OAuth2 auth provider with CLI support for login/logout.

### `createTokenStore(serverName)`

Creates a persistent token store scoped to the given server name. Tokens are stored at `~/.mcp-pool/<serverName>/`.

### `StaticTokenStrategy`

A `TokenProvider` implementation for static API keys/tokens that don't expire.

### `OAuthStrategy`

A `TokenProvider` implementation for OAuth2 tokens with automatic refresh.

## Development

```bash
# Build
npm run build -w packages/oauth-core

# Test
npm test -w packages/oauth-core
```

## License

This project is licensed under the MIT License.
