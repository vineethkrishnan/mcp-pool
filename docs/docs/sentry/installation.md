---
sidebar_position: 2
title: Installation
description: Install and configure Sentry MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_AUTH_TOKEN` | **Yes** | — | Sentry authentication token with read scopes |
| `SENTRY_BASE_URL` | No | `https://sentry.io` | Base URL for self-hosted Sentry instances |
| `SENTRY_ORG` | No | — | Default organization slug (avoids repeating it in every query) |

## Get Your Sentry Auth Token

1. Go to [Sentry Settings > Auth Tokens](https://sentry.io/settings/auth-tokens/) (or the equivalent page on your self-hosted instance)
2. Click **Create New Token**
3. Select the minimum read scopes you need: `project:read`, `org:read`, `event:read`
4. Copy the token

:::caution
Never commit your Sentry auth token to version control. Always use environment variables or IDE-specific secret management.
:::

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/sentry-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/sentry-mcp
```

Then use `sentry-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/sentry/build/index.js` as the command.

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

**SaaS (sentry.io):**
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
      }
    }
  }
}
```

**Self-hosted:**
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_...",
        "SENTRY_BASE_URL": "https://sentry.yourcompany.com",
        "SENTRY_ORG": "my-org"
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
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "${input:sentry-token}"
      }
    }
  },
  "inputs": [
    {
      "id": "sentry-token",
      "description": "Sentry Auth Token",
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
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
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
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
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
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
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
   - **Name:** `sentry`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/sentry-mcp`
   - **Environment Variables:** `SENTRY_AUTH_TOKEN=sntrys_...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add sentry \
  --scope user \
  -e SENTRY_AUTH_TOKEN=sntrys_... \
  -- npx -y @vineethnkrishnan/sentry-mcp
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
    "sentry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/sentry-mcp"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
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

## Self-Hosted Sentry

If you run a self-hosted Sentry instance, set `SENTRY_BASE_URL` to your instance URL in any of the IDE configs above:

```bash
SENTRY_BASE_URL=https://sentry.yourcompany.com
```

The server will route all API requests to your instance instead of `sentry.io`.

:::note SSL/TLS
If your self-hosted instance uses a self-signed certificate, you may need to set `NODE_TLS_REJECT_UNAUTHORIZED=0` in the `env` block. This is **not recommended for production** — prefer adding your CA certificate to the Node.js trust store instead.
:::

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "List all projects in my Sentry organization."

If the server is working, you'll get a response with your Sentry projects. If not, check:

1. **Auth token is valid** — test with `curl -H "Authorization: Bearer sntrys_..." https://sentry.io/api/0/organizations/`
2. **Node.js >= 20** — run `node --version`
3. **Config file syntax** — validate your JSON (no trailing commas)
4. **Restart your IDE** — most IDEs require a full restart after config changes
5. **Self-hosted URL is reachable** — ensure the server can reach your Sentry instance

## Security Recommendations

- Use **scoped auth tokens** with only the read permissions you need (`project:read`, `org:read`, `event:read`)
- Never share config files containing auth tokens
- Add config files with secrets to `.gitignore`
- Rotate tokens periodically via [Sentry Settings > Auth Tokens](https://sentry.io/settings/auth-tokens/)
- For self-hosted instances, ensure the connection between the MCP server and Sentry uses TLS
