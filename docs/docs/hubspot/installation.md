---
sidebar_position: 2
title: Installation
description: Install and configure HubSpot MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your HubSpot Access Token

Before configuring any IDE, you need a HubSpot private app access token:

1. Go to [HubSpot > Settings > Integrations > Private Apps](https://app.hubspot.com/private-apps/)
2. Click **Create a private app**
3. Under **Scopes**, grant at minimum:
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.objects.deals.read`
4. Click **Create app** and copy the access token

:::caution
Never commit your HubSpot access token to version control. Always use environment variables or IDE-specific secret management.
:::

## OAuth Authentication (Alternative)

Instead of a static access token, you can use OAuth 2.0 for automatic token management:

1. Create an OAuth app in your HubSpot developer account > Apps
2. Set the environment variables:
   ```bash
   export HUBSPOT_CLIENT_ID=your-client-id
   export HUBSPOT_CLIENT_SECRET=your-client-secret
   ```
3. Run the login command:
   ```bash
   hubspot-mcp auth login
   ```
4. A browser window opens for authorization. After approving, tokens are stored at `~/.mcp-pool/hubspot/tokens.json`
5. The server auto-refreshes tokens — no manual intervention needed

Other auth CLI commands:
```bash
hubspot-mcp auth logout  # Clear stored tokens
hubspot-mcp auth status  # Show current auth state
```

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/hubspot-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/hubspot-mcp
```

Then use `hubspot-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/hubspot/build/index.js` as the command.

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
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "hubspot": {
      "command": "hubspot-mcp",
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "hubspot": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/hubspot/build/index.js"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
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
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "${input:hubspot-token}"
      }
    }
  },
  "inputs": [
    {
      "id": "hubspot-token",
      "description": "HubSpot Access Token",
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
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
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
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
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
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
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
   - **Name:** `hubspot`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/hubspot-mcp`
   - **Environment Variables:** `HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add hubspot \
  --scope user \
  -e HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token \
  -- npx -y @vineethnkrishnan/hubspot-mcp
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
    "hubspot": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/hubspot-mcp"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-hubspot-access-token"
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
| `HUBSPOT_ACCESS_TOKEN` | Yes* | HubSpot private app access token with CRM read scopes |
| `HUBSPOT_CLIENT_ID` | Alt | OAuth 2.0 client ID |
| `HUBSPOT_CLIENT_SECRET` | Alt | OAuth 2.0 client secret |

*Either the static token OR the OAuth client credentials are required.

## Uninstallation

### Claude Code (CLI)

```bash
claude mcp remove hubspot
```

To check which servers are configured:

```bash
claude mcp list
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"hubspot"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"hubspot"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/hubspot-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "List my HubSpot contacts."

If the server is working, you'll get a response with your contacts. If not, check:

1. **Token is valid** — test with `curl -H "Authorization: Bearer your-token" https://api.hubapi.com/crm/v3/objects/contacts?limit=1`
2. **Node.js >= 20** — run `node --version`
3. **Scopes are granted** — ensure `crm.objects.contacts.read`, `crm.objects.deals.read`, and `crm.objects.companies.read` are enabled on your private app
4. **Config file syntax** — validate your JSON (no trailing commas)
5. **Restart your IDE** — most IDEs require a full restart after config changes
