# Google Workspace MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants (Claude, Cursor, etc.) with a comprehensive, read-only interface to Google Workspace APIs — Gmail, Calendar, Drive, and Sheets. **Supports static tokens, service accounts, and OAuth2 authentication.**

## Overview

`google-workspace-mcp` allows your AI assistant to directly interact with your Google Workspace data. It enables powerful natural language queries like:
- "Search my Gmail for emails from 'client@example.com' this week."
- "What meetings do I have tomorrow?"
- "Find all shared files in my Drive containing 'Q2 Report'."
- "Read the data from the 'Revenue' sheet in my spreadsheet."

## Features

- **Multiple Auth Methods:** Static tokens, service accounts with domain-wide delegation, and OAuth2.
- **OAuth2 Support:** Browser-based OAuth flow with automatic token refresh, powered by `@vineethnkrishnan/oauth-core`.
- **Multi-Service:** Single server covers Gmail, Calendar, Drive, and Sheets.
- **Modular Architecture:** Built with clean layered design for high maintainability.
- **Type-Safe:** Fully implemented in TypeScript with Zod schema validation.
- **Comprehensive Coverage:** Read-only access across all four Google APIs.
- **Security-First:** Focused on read-only operations to ensure safety in AI-driven workflows.

## Installation

### Using `npx` (Recommended)

No installation required. Run directly:

```bash
npx -y @vineethnkrishnan/google-workspace-mcp
```

### Global Install

```bash
npm install -g @vineethnkrishnan/google-workspace-mcp
google-workspace-mcp
```

### From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

## Configuration

To use this server with an MCP client like **Claude Desktop**, add to your MCP client configuration file:

| Platform | Config file path |
|----------|-----------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Using a Static Access Token

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0AfH6SMB..."
      }
    }
  }
}
```

### Using a Service Account

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_KEY": "{...service account JSON...}",
        "GOOGLE_DELEGATED_USER": "user@company.com"
      }
    }
  }
}
```

### Using OAuth2

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "123456789-abc.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-abc123..."
      }
    }
  }
}
```

Then run the OAuth setup:

```bash
google-workspace-mcp auth login
```

This will:
1. Open a browser window where you'll log in to Google and authorize the app
2. After you approve, the browser will show a success message
3. Your tokens are saved locally at `~/.mcp-pool/google-workspace/` and refresh automatically

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_ACCESS_TOKEN` | No* | - | Static Google access token (highest priority). |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | No* | - | Service account JSON key string. |
| `GOOGLE_DELEGATED_USER` | No | - | Email for domain-wide delegation (used with service account). |
| `GOOGLE_CLIENT_ID` | No* | - | OAuth2 client ID. |
| `GOOGLE_CLIENT_SECRET` | No* | - | OAuth2 client secret. |

*At least one auth method must be provided. Priority: Static token > Service account > OAuth2.

## Getting Your Credentials

### Option A: OAuth App (Recommended)
1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Go to **APIs & Services > Enabled APIs** and enable: Gmail API, Google Calendar API, Google Drive API, Google Sheets API
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Choose **Desktop app**, give it a name, and click **Create**
7. Copy the **Client ID** and **Client secret**

### Option B: Service Account (For Workspace Admins)
1. In Google Cloud Console, go to **IAM & Admin > Service Accounts**
2. Create a service account and download the **JSON key file**
3. In Google Workspace Admin, enable **domain-wide delegation** for the service account
4. Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the contents of the JSON file
5. Set `GOOGLE_DELEGATED_USER` to the email of the user to impersonate

### Option C: Static Token (Temporary)
Use a short-lived access token from [Google OAuth Playground](https://developers.google.com/oauthplayground). These expire after 1 hour.

## Documentation

For a full list of available tools, detailed examples, and architectural details, visit the [documentation site](https://mcp-pool.vineethnk.in/docs/google-workspace/overview).

## Uninstallation

```bash
# If installed globally
npm uninstall -g @vineethnkrishnan/google-workspace-mcp

# Remove OAuth tokens (if using OAuth2)
rm -rf ~/.mcp-pool/google-workspace/
```

## Testing

```bash
npm test
```

## License

This project is licensed under the MIT License.
