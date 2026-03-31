---
sidebar_position: 2
title: Installation
description: Install and configure Intercom MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Intercom Access Token

Before configuring any IDE, you need an Intercom access token:

1. Go to [Settings > Integrations > Developer Hub](https://developers.intercom.com/) in your Intercom workspace
2. Create or select an app, then go to **Authentication**
3. Copy the **Access Token** (starts with `dG9rO...` or similar)
4. Ensure the token has scopes for reading contacts and conversations

:::caution
Never commit your Intercom access token to version control. Always use environment variables or IDE-specific secret management.
:::

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/intercom-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/intercom-mcp
```

Then use `intercom-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/intercom/build/index.js` as the command.

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
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "intercom": {
      "command": "intercom-mcp",
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "intercom": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/intercom/build/index.js"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
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
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "${input:intercom-token}"
      }
    }
  },
  "inputs": [
    {
      "id": "intercom-token",
      "description": "Intercom Access Token",
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
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
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
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
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
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
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
   - **Name:** `intercom`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/intercom-mcp`
   - **Environment Variables:** `INTERCOM_ACCESS_TOKEN=dG9rOi...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "intercom": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add intercom \
  --scope user \
  -e INTERCOM_ACCESS_TOKEN=dG9rOi... \
  -- npx -y @vineethnkrishnan/intercom-mcp
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
    "intercom": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/intercom-mcp"],
      "env": {
        "INTERCOM_ACCESS_TOKEN": "dG9rOi..."
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

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "List my most recent Intercom conversations."

If the server is working, you'll get a response with your recent conversations. If not, check:

1. **Access token is valid** — test with `curl -H "Authorization: Bearer dG9rOi..." -H "Intercom-Version: 2.11" https://api.intercom.io/me`
2. **Node.js >= 20** — run `node --version`
3. **Config file syntax** — validate your JSON (no trailing commas)
4. **Restart your IDE** — most IDEs require a full restart after config changes

## Security Recommendations

- Use tokens with **minimal scopes** — only read access to contacts and conversations
- Never share config files containing access tokens
- Add config files with secrets to `.gitignore`
- Rotate tokens periodically via your [Intercom Developer Hub](https://developers.intercom.com/)
