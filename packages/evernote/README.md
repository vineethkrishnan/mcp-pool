# Evernote MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive interface to the Evernote API.

## Overview

`evernote-mcp` allows your AI assistant to directly interact with your Evernote account. It enables powerful natural language queries like:
- "List all my notebooks and show which one is the default."
- "Search for notes about 'quarterly review' in my Work notebook."
- "Create a note titled 'Meeting Notes' with today's action items."
- "Move that note to the Archive notebook and tag it 'completed'."

## Features

- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Full access to Notes, Notebooks, Tags, and Search with both read and write operations.
- **LLM-Optimized:** ENML content is automatically converted to plain text for readable AI output.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/evernote-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/evernote-mcp
evernote-mcp
```

### From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

## Configuration

Add to your MCP client configuration file:

| Platform | Config file path |
|----------|-----------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Using `npx` (Recommended)

```json
{
  "mcpServers": {
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
      }
    }
  }
}
```

### Local Build

```json
{
  "mcpServers": {
    "evernote": {
      "command": "node",
      "args": ["/absolute/path/to/evernote-mcp/build/index.js"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EVERNOTE_TOKEN` | Yes | - | Evernote developer token or OAuth access token. |
| `EVERNOTE_SANDBOX` | No | `false` | Set to `true` to use the Evernote sandbox environment. |

## Getting Your Developer Token

1. Visit the [Evernote Developer Tokens](https://dev.evernote.com/doc/articles/dev_tokens.php) page
2. Sign in with your Evernote account
3. Click **Create a developer token**
4. Copy the generated token (starts with `S=s1:U=...`)

> Developer tokens provide full access to your account. Keep them secure and never commit them to version control.

## Response Optimization

All responses are automatically optimized for LLM context windows:

- **ENML conversion:** Evernote's XML-based note format (ENML) is converted to clean plain text with markdown-like formatting.
- **Metadata extraction:** Notes, notebooks, and tags are returned with only the relevant fields (GUID, title, timestamps, tags).
- **Auto-encoding:** When creating or updating notes, plain text input is automatically converted to valid ENML.

This reduces token usage and improves readability for AI assistants.

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/evernote/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/evernote-mcp
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
