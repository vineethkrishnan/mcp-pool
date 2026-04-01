---
sidebar_position: 2
title: Installation
description: Install and configure Shopify MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Shopify Credentials

Before configuring any IDE, you need two values:

1. **Store URL** — your Shopify store domain (e.g., `my-store.myshopify.com`)
2. **Access Token** — from a [custom app](https://help.shopify.com/en/manual/apps/app-types/custom-apps):
   1. Go to **Settings > Apps and sales channels > Develop apps**
   2. Create a new app and configure **Admin API scopes**: `read_orders`, `read_products`, `read_customers`
   3. Install the app and copy the **Admin API access token** (starts with `shpat_`)

:::caution
Never commit your Shopify access token to version control. Always use environment variables or IDE-specific secret management.
:::

## OAuth Authentication (Alternative)

Instead of a static access token, you can use OAuth 2.0 for automatic token management:

1. Create an OAuth app in Shopify Partners > Apps
2. Set the environment variables:
   ```bash
   export SHOPIFY_CLIENT_ID=your-client-id
   export SHOPIFY_CLIENT_SECRET=your-client-secret
   ```
3. Run the login command:
   ```bash
   shopify-mcp auth login
   ```
4. A browser window opens for authorization. After approving, tokens are stored at `~/.mcp-pool/shopify/tokens.json`
5. The server auto-refreshes tokens — no manual intervention needed

Other auth CLI commands:
```bash
shopify-mcp auth logout  # Clear stored tokens
shopify-mcp auth status  # Show current auth state
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_STORE_URL` | Yes | Your Shopify store domain (e.g., `my-store.myshopify.com`) |
| `SHOPIFY_ACCESS_TOKEN` | Yes* | Shopify Admin API access token with read scopes |
| `SHOPIFY_CLIENT_ID` | Alt | OAuth 2.0 client ID |
| `SHOPIFY_CLIENT_SECRET` | Alt | OAuth 2.0 client secret |

*Either the static token OR the OAuth client credentials are required.

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/shopify-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/shopify-mcp
```

Then use `shopify-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/shopify/build/index.js` as the command.

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
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "shopify": {
      "command": "shopify-mcp",
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "shopify": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/shopify/build/index.js"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
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
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "${input:shopify-store-url}",
        "SHOPIFY_ACCESS_TOKEN": "${input:shopify-token}"
      }
    }
  },
  "inputs": [
    {
      "id": "shopify-store-url",
      "description": "Shopify Store URL (e.g., my-store.myshopify.com)",
      "type": "promptString"
    },
    {
      "id": "shopify-token",
      "description": "Shopify Admin API Access Token",
      "type": "password"
    }
  ]
}
```

The `inputs` feature prompts you for credentials securely — they never get stored in the file.

**User config (without inputs):**
```json
{
  "servers": {
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
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
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
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
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
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
   - **Name:** `shopify`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/shopify-mcp`
   - **Environment Variables:** `SHOPIFY_STORE_URL=my-store.myshopify.com`, `SHOPIFY_ACCESS_TOKEN=shpat_...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add shopify \
  --scope user \
  -e SHOPIFY_STORE_URL=my-store.myshopify.com \
  -e SHOPIFY_ACCESS_TOKEN=shpat_... \
  -- npx -y @vineethnkrishnan/shopify-mcp
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
    "shopify": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/shopify-mcp"],
      "env": {
        "SHOPIFY_STORE_URL": "my-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "shpat_..."
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
claude mcp remove shopify
```

To check which servers are configured:

```bash
claude mcp list
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"shopify"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"shopify"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/shopify-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "What Shopify plan is my store on?"

If the server is working, you'll get a response with your shop details. If not, check:

1. **Store URL is correct** — should be the `*.myshopify.com` domain (protocol is optional, it gets normalized)
2. **Access token is valid** — test with `curl -H "X-Shopify-Access-Token: shpat_..." https://my-store.myshopify.com/admin/api/2024-01/shop.json`
3. **Node.js >= 20** — run `node --version`
4. **Config file syntax** — validate your JSON (no trailing commas)
5. **Restart your IDE** — most IDEs require a full restart after config changes

## Security Recommendations

- Use **custom app tokens** with only the scopes you need (`read_orders`, `read_products`, `read_customers`)
- Never share config files containing access tokens
- Add config files with secrets to `.gitignore`
- Rotate tokens periodically via your [Shopify admin](https://admin.shopify.com/)
