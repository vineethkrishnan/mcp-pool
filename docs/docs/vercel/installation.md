---
sidebar_position: 2
title: Installation
description: Install and configure Vercel MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Vercel API Token

Before configuring any IDE, you need a Vercel API token:

1. Go to [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
2. Click **Create Token**, give it a name, and select the appropriate scope
3. Copy the token value

**Optional — Team ID:**

To scope all queries to a specific Vercel team, set `VERCEL_TEAM_ID`. Find it in your team's General Settings URL (`https://vercel.com/teams/<team-slug>/settings` — the Team ID is shown on that page).

:::caution
Never commit your Vercel token to version control. Always use environment variables or IDE-specific secret management.
:::

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/vercel-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/vercel-mcp
```

Then use `vercel-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/vercel/build/index.js` as the command.

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
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token",
        "VERCEL_TEAM_ID": "team_optional"
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "vercel": {
      "command": "vercel-mcp",
      "env": {
        "VERCEL_TOKEN": "your-vercel-token"
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/vercel/build/index.js"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token"
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
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "${input:vercel-token}",
        "VERCEL_TEAM_ID": "${input:vercel-team-id}"
      }
    }
  },
  "inputs": [
    {
      "id": "vercel-token",
      "description": "Vercel API Token",
      "type": "password"
    },
    {
      "id": "vercel-team-id",
      "description": "Vercel Team ID (optional, press Enter to skip)",
      "type": "promptString"
    }
  ]
}
```

The `inputs` feature prompts you for the token securely — it never gets stored in the file.

**User config (without inputs):**
```json
{
  "servers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token"
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
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token",
        "VERCEL_TEAM_ID": "team_optional"
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
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token",
        "VERCEL_TEAM_ID": "team_optional"
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
   - **Name:** `vercel`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/vercel-mcp`
   - **Environment Variables:** `VERCEL_TOKEN=your-vercel-token;VERCEL_TEAM_ID=team_optional`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token",
        "VERCEL_TEAM_ID": "team_optional"
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add vercel \
  --scope user \
  -e VERCEL_TOKEN=your-vercel-token \
  -e VERCEL_TEAM_ID=team_optional \
  -- npx -y @vineethnkrishnan/vercel-mcp
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
    "vercel": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token",
        "VERCEL_TEAM_ID": "team_optional"
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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VERCEL_TOKEN` | Yes | Vercel API token from [Account Settings > Tokens](https://vercel.com/account/tokens) |
| `VERCEL_TEAM_ID` | No | Vercel Team ID. When set, all API calls are scoped to that team. |

## Uninstallation

### Claude Code (CLI)

```bash
claude mcp remove vercel
```

To check which servers are configured:

```bash
claude mcp list
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"vercel"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"vercel"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/vercel-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "List my Vercel projects."

If the server is working, you'll get a response with your projects. If not, check:

1. **Token is valid** — test with `curl -H "Authorization: Bearer your-token" https://api.vercel.com/v9/projects`
2. **Node.js >= 20** — run `node --version`
3. **Config file syntax** — validate your JSON (no trailing commas)
4. **Restart your IDE** — most IDEs require a full restart after config changes
