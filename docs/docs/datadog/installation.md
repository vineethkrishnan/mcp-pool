---
sidebar_position: 2
title: Installation
description: Install and configure Datadog MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Datadog Keys

Before configuring any IDE, you need both a Datadog API key and an Application key:

1. Go to [Organization Settings > API Keys](https://app.datadoghq.com/organization-settings/api-keys)
2. Create or copy an **API key**
3. Go to [Organization Settings > Application Keys](https://app.datadoghq.com/organization-settings/application-keys)
4. Create or copy an **Application key** with read-only scopes

:::caution
Never commit your Datadog keys to version control. Always use environment variables or IDE-specific secret management.
:::

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DD_API_KEY` | Yes | Datadog API key |
| `DD_APP_KEY` | Yes | Datadog Application key |
| `DD_SITE` | No | Datadog site/region (default: `datadoghq.com`) |

### Supported Datadog Sites

| Site | `DD_SITE` Value | Region |
|------|-----------------|--------|
| US1 (default) | `datadoghq.com` | United States |
| US3 | `us3.datadoghq.com` | United States |
| US5 | `us5.datadoghq.com` | United States |
| EU | `datadoghq.eu` | Europe |
| AP1 | `ap1.datadoghq.com` | Asia Pacific |
| US1-FED (Gov) | `ddog-gov.com` | US Government |

:::info
If your Datadog organization is not in the default US1 region, you **must** set `DD_SITE` to match where your keys were created. Using keys from one region against a different site will result in authentication errors.
:::

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/datadog-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/datadog-mcp
```

Then use `datadog-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/datadog/build/index.js` as the command.

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
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "datadog": {
      "command": "datadog-mcp",
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/datadog/build/index.js"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
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
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "${input:dd-api-key}",
        "DD_APP_KEY": "${input:dd-app-key}",
        "DD_SITE": "datadoghq.com"
      }
    }
  },
  "inputs": [
    {
      "id": "dd-api-key",
      "description": "Datadog API Key",
      "type": "password"
    },
    {
      "id": "dd-app-key",
      "description": "Datadog Application Key",
      "type": "password"
    }
  ]
}
```

The `inputs` feature prompts you for the keys securely — they never get stored in the file.

**User config (without inputs):**
```json
{
  "servers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
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
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
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
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
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
   - **Name:** `datadog`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/datadog-mcp`
   - **Environment Variables:** `DD_API_KEY=your-api-key DD_APP_KEY=your-app-key DD_SITE=datadoghq.com`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add datadog \
  --scope user \
  -e DD_API_KEY=your-api-key \
  -e DD_APP_KEY=your-app-key \
  -e DD_SITE=datadoghq.com \
  -- npx -y @vineethnkrishnan/datadog-mcp
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
    "datadog": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/datadog-mcp"],
      "env": {
        "DD_API_KEY": "your-api-key",
        "DD_APP_KEY": "your-app-key",
        "DD_SITE": "datadoghq.com"
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

> "List my Datadog monitors."

If the server is working, you'll get a response with your monitors. If not, check:

1. **Both keys are valid** — API key and Application key are both required
2. **Site matches your region** — if you're not on US1, set `DD_SITE` to your region
3. **Node.js >= 20** — run `node --version`
4. **Config file syntax** — validate your JSON (no trailing commas)
5. **Restart your IDE** — most IDEs require a full restart after config changes

## Security Recommendations

- Create a **dedicated Application key** for AI tooling with minimal read-only scopes
- Use a scoped API key if your Datadog plan supports it
- Never share config files containing API keys
- Add config files with secrets to `.gitignore`
- Rotate keys periodically via [Datadog Organization Settings](https://app.datadoghq.com/organization-settings/api-keys)
