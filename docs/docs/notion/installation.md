---
sidebar_position: 2
title: Installation
description: Install and configure Notion MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Notion API Key

Before configuring any IDE, you need a Notion internal integration token:

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration** and give it a name
3. Copy the **Internal Integration Secret** (starts with `ntn_` or `secret_`)
4. In Notion, open each page or database you want the AI to access and click **...** > **Connect to** > select your integration

:::caution
Never commit your Notion API key to version control. Always use environment variables or IDE-specific secret management.
:::

## OAuth Authentication (Alternative)

Instead of a static integration token, you can use OAuth 2.0 for automatic token management:

1. Create an OAuth app in your Notion Integrations page (notion.so/my-integrations)
2. Set the environment variables:
   ```bash
   export NOTION_CLIENT_ID=your-client-id
   export NOTION_CLIENT_SECRET=your-client-secret
   ```
3. Run the login command:
   ```bash
   notion-mcp auth login
   ```
4. A browser window opens for authorization. After approving, tokens are stored at `~/.mcp-pool/notion/tokens.json`
5. The server auto-refreshes tokens — no manual intervention needed

Other auth CLI commands:
```bash
notion-mcp auth logout  # Clear stored tokens
notion-mcp auth status  # Show current auth state
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | Yes* | Internal integration token from Notion |
| `NOTION_CLIENT_ID` | Alt | OAuth 2.0 client ID |
| `NOTION_CLIENT_SECRET` | Alt | OAuth 2.0 client secret |
| `NOTION_VERSION` | No | Notion API version (default: `2022-06-28`) |

*Either the static token OR the OAuth client credentials are required.

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/notion-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/notion-mcp
```

Then use `notion-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/notion/build/index.js` as the command.

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
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "notion": {
      "command": "notion-mcp",
      "env": {
        "NOTION_API_KEY": "ntn_..."
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "notion": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/notion/build/index.js"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
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
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "${input:notion-key}"
      }
    }
  },
  "inputs": [
    {
      "id": "notion-key",
      "description": "Notion Internal Integration Token",
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
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
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
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
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
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
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
   - **Name:** `notion`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/notion-mcp`
   - **Environment Variables:** `NOTION_API_KEY=ntn_...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add notion \
  --scope user \
  -e NOTION_API_KEY=ntn_... \
  -- npx -y @vineethnkrishnan/notion-mcp
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
    "notion": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/notion-mcp"],
      "env": {
        "NOTION_API_KEY": "ntn_..."
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
claude mcp remove notion
```

To check which servers are configured:

```bash
claude mcp list
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"notion"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"notion"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/notion-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "Search my Notion workspace for recent pages."

If the server is working, you'll get a response with matching pages. If not, check:

1. **API key is valid** — test with `curl -H "Authorization: Bearer ntn_..." -H "Notion-Version: 2022-06-28" https://api.notion.com/v1/users/me`
2. **Integration is connected** — open your page in Notion, click **...** > **Connect to** and verify your integration is listed
3. **Node.js >= 20** — run `node --version`
4. **Config file syntax** — validate your JSON (no trailing commas)
5. **Restart your IDE** — most IDEs require a full restart after config changes

## Security Recommendations

- Use a **dedicated integration** per use case — avoid sharing one token across all tools
- Only connect the integration to pages and databases you want the AI to access
- Never share config files containing API keys
- Add config files with secrets to `.gitignore`
- Rotate tokens periodically via [Notion Integrations](https://www.notion.so/my-integrations)
