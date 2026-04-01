---
sidebar_position: 2
title: Installation
description: Install and configure Google Workspace MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Authentication

Choose one of the three authentication methods below.

### Option 1: OAuth Browser Flow (Recommended)

The easiest way to authenticate. Tokens are stored locally and refreshed automatically.

1. Create an OAuth 2.0 Client ID in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (application type: **Desktop app**)
2. Set the environment variables:
   ```bash
   export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
   ```
3. Run the login command:
   ```bash
   google-workspace-mcp auth login
   ```
4. A browser window opens for Google sign-in. After consent, a refresh token is stored at `~/.mcp-pool/google-workspace/tokens.json`.
5. Start the server — no additional env vars are needed. The server reads stored tokens and refreshes them automatically.

### Option 2: Service Account

Best for server-to-server or automated environments.

1. Create a service account in the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts) and download the JSON key file.
2. Set the environment variable:
   ```bash
   export GOOGLE_SERVICE_ACCOUNT_KEY="/path/to/service-account-key.json"
   ```
3. Optionally, for domain-wide delegation, set the delegated user:
   ```bash
   export GOOGLE_DELEGATED_USER="user@yourdomain.com"
   ```
4. Tokens auto-refresh via JWT exchange — no manual intervention needed.

### Option 3: Static Access Token

Best for quick testing. Tokens expire after 1 hour.

1. Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select the scopes you need:
   - **Gmail API** — `https://www.googleapis.com/auth/gmail.readonly`
   - **Calendar API** — `https://www.googleapis.com/auth/calendar.readonly`
   - **Drive API** — `https://www.googleapis.com/auth/drive.readonly`
   - **Sheets API** — `https://www.googleapis.com/auth/spreadsheets.readonly`
3. Click **Authorize APIs** and sign in with your Google account
4. Click **Exchange authorization code for tokens**
5. Copy the **Access Token** and set it:
   ```bash
   export GOOGLE_ACCESS_TOKEN="ya29.a0..."
   ```

:::note
The OAuth browser flow (Option 1) and service accounts (Option 2) handle token refresh automatically. If you use a static access token (Option 3), you will need to manually replace it every hour.
:::

:::caution
Never commit tokens or service account keys to version control. Always use environment variables or IDE-specific secret management.
:::

### Auth CLI Commands

```bash
google-workspace-mcp auth login   # Authenticate via browser (OAuth flow)
google-workspace-mcp auth logout  # Clear stored tokens
google-workspace-mcp auth status  # Show current authentication state
```

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/google-workspace-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/google-workspace-mcp
```

Then use `google-workspace-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/google-workspace/build/index.js` as the command.

---

## IDE Configuration

### Claude Desktop

**Config file location:**
| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

**Quick access:** Settings > Developer > Edit Config

**Using npx:**
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "google-workspace-mcp",
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/google-workspace/build/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

:::tip
Restart Claude Desktop completely after editing the config. Changes are not picked up automatically.
:::

---

### VS Code (GitHub Copilot)

**Config file location:**
| Scope | Path |
|-------|------|
| Workspace | `.vscode/mcp.json` (in your project root) |
| User (macOS) | `~/Library/Application Support/Code/User/mcp.json` |
| User (Windows) | `%APPDATA%\Code\User\mcp.json` |
| User (Linux) | `~/.config/Code/User/mcp.json` |

**Quick access:** Command Palette (`Cmd+Shift+P`) > `MCP: Open User Configuration`

:::warning
VS Code uses `"servers"` as the root key, **not** `"mcpServers"`.
:::

**Workspace config (`.vscode/mcp.json`):**
```json
{
  "servers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "${input:google-token}"
      }
    }
  },
  "inputs": [
    {
      "id": "google-token",
      "description": "Google OAuth Access Token",
      "type": "password"
    }
  ]
}
```

The `inputs` feature prompts you for the token securely — it never gets stored in the file.

**User config (without inputs):**
```json
{
  "servers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

---

### Cursor

**Config file location:**
| Scope | Path |
|-------|------|
| Global | `~/.cursor/mcp.json` |
| Project | `.cursor/mcp.json` (in your project root) |

**Quick access:** Settings > Cursor Settings > MCP

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

Project-level config (`.cursor/mcp.json`) takes precedence over global config.

---

### Windsurf (Codeium)

**Config file location:**
| OS | Path |
|----|------|
| macOS / Linux | `~/.codeium/windsurf/mcp_config.json` |
| Windows | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |

**Quick access:** Settings > Advanced Settings > Cascade section

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

:::tip
Make sure MCP is enabled in Windsurf: Settings > Advanced > Cascade > Enable MCP.
:::

---

### JetBrains IDEs (IntelliJ, WebStorm, PyCharm, etc.)

JetBrains IDEs (2025.2+) support MCP servers through the settings UI.

**Setup:**

1. Open **Settings/Preferences > Tools > AI Assistant > MCP Servers**
2. Click **+ Add** to add a new server
3. Configure:
   - **Name:** `google-workspace`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/google-workspace-mcp`
   - **Environment Variables:** `GOOGLE_ACCESS_TOKEN=ya29.a0...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add google-workspace \
  --scope user \
  -e GOOGLE_ACCESS_TOKEN=ya29.a0... \
  -- npx -y @vineethnkrishnan/google-workspace-mcp
```

Scope options:
- `--scope user` — available in all your projects
- `--scope local` — current project only (default)
- `--scope project` — shared with team via `.mcp.json`

**Option 2 — manual config:**

Edit `~/.claude.json` (user scope) or `.mcp.json` (project scope):

```json
{
  "mcpServers": {
    "google-workspace": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/google-workspace-mcp"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "ya29.a0..."
      }
    }
  }
}
```

**Verify it's working:**

```bash
claude mcp list
```

---

## Uninstallation

### Claude Code (CLI)

```bash
claude mcp remove google-workspace
```

To check which servers are configured:

```bash
claude mcp list
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"google-workspace"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"google-workspace"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/google-workspace-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "List my recent Gmail messages."

If the server is working, you'll get a response with your recent emails. If not, check:

1. **Authentication is configured** — run `google-workspace-mcp auth status` to check, or verify your env vars are set
2. **Required scopes are granted** — ensure you authorized the Gmail, Calendar, Drive, and/or Sheets scopes
3. **Node.js >= 20** — run `node --version`
4. **Config file syntax** — validate your JSON (no trailing commas)
5. **Restart your IDE** — most IDEs require a full restart after config changes

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_ACCESS_TOKEN` | Option 3 | Static OAuth token (expires in 1 hour) |
| `GOOGLE_CLIENT_ID` | Option 1 | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Option 1 | OAuth 2.0 client secret |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Option 2 | Path to service account JSON key file |
| `GOOGLE_DELEGATED_USER` | No | Email for domain-wide delegation (service account only) |

## Security Recommendations

- Use **read-only scopes** (`*.readonly`) for all Google APIs
- OAuth browser flow and service accounts provide automatic token refresh without manual intervention
- Static access tokens are short-lived (1 hour) which limits exposure
- Never share config files containing access tokens or service account keys
- Add config files with secrets to `.gitignore`
