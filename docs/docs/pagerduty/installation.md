---
sidebar_position: 2
title: Installation
description: Install and configure PagerDuty MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your PagerDuty API Key

Before configuring any IDE, you need a PagerDuty API key:

1. Go to [PagerDuty > Integrations > API Access Keys](https://support.pagerduty.com/docs/api-access-keys)
2. Create a **General Access REST API Key** (read-only is sufficient)
3. Copy the key value

**EU customers:** If your PagerDuty account is hosted in the EU region, set `PAGERDUTY_BASE_URL` to `https://api.eu.pagerduty.com`.

:::caution
Never commit your PagerDuty API key to version control. Always use environment variables or IDE-specific secret management.
:::

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/pagerduty-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/pagerduty-mcp
```

Then use `pagerduty-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/pagerduty/build/index.js` as the command.

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
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "pagerduty": {
      "command": "pagerduty-mcp",
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "pagerduty": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/pagerduty/build/index.js"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
      }
    }
  }
}
```

**EU region:**
```json
{
  "mcpServers": {
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key",
        "PAGERDUTY_BASE_URL": "https://api.eu.pagerduty.com"
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
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "${input:pagerduty-key}"
      }
    }
  },
  "inputs": [
    {
      "id": "pagerduty-key",
      "description": "PagerDuty API Key",
      "type": "password"
    }
  ]
}
```

The `inputs` feature prompts you for the key securely — it never gets stored in the file.

**User config (without inputs):**
```json
{
  "servers": {
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
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
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
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
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
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
   - **Name:** `pagerduty`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/pagerduty-mcp`
   - **Environment Variables:** `PAGERDUTY_API_KEY=your-pagerduty-api-key`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "pagerduty": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add pagerduty \
  --scope user \
  -e PAGERDUTY_API_KEY=your-pagerduty-api-key \
  -- npx -y @vineethnkrishnan/pagerduty-mcp
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
    "pagerduty": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/pagerduty-mcp"],
      "env": {
        "PAGERDUTY_API_KEY": "your-pagerduty-api-key"
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

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAGERDUTY_API_KEY` | Yes | — | PagerDuty REST API key |
| `PAGERDUTY_BASE_URL` | No | `https://api.pagerduty.com` | API base URL. Set to `https://api.eu.pagerduty.com` for EU accounts. |

## Uninstallation

### Claude Code (CLI)

```bash
claude mcp remove pagerduty
```

To check which servers are configured:

```bash
claude mcp list
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"pagerduty"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"pagerduty"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/pagerduty-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "Are there any triggered PagerDuty incidents right now?"

If the server is working, you'll get a response with your incident list. If not, check:

1. **API key is valid** — test with `curl -H "Authorization: Token token=your-key" -H "Content-Type: application/json" https://api.pagerduty.com/incidents?limit=1`
2. **Node.js >= 20** — run `node --version`
3. **Config file syntax** — validate your JSON (no trailing commas)
4. **EU region** — if you get 401 errors, verify your `PAGERDUTY_BASE_URL` matches your account region
5. **Restart your IDE** — most IDEs require a full restart after config changes
