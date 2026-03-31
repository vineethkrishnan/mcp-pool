---
sidebar_position: 2
title: Installation
description: Install and configure Stripe MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Stripe API Key

Before configuring any IDE, you need a Stripe API key:

1. Go to the [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
2. We recommend creating a **restricted key** with only read permissions
3. Copy the key (starts with `sk_test_` or `rk_test_`)

:::caution
Never commit your Stripe API key to version control. Always use environment variables or IDE-specific secret management.
:::

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/stripe-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/stripe-mcp
```

Then use `stripe-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/stripe/build/index.js` as the command.

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
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "stripe": {
      "command": "stripe-mcp",
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "stripe": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/stripe/build/index.js"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
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
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "${input:stripe-key}"
      }
    }
  },
  "inputs": [
    {
      "id": "stripe-key",
      "description": "Stripe Secret Key",
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
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
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
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
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
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
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
   - **Name:** `stripe`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/stripe-mcp`
   - **Environment Variables:** `STRIPE_SECRET_KEY=sk_test_...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add stripe \
  --scope user \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -- npx -y @vineethnkrishnan/stripe-mcp
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
    "stripe": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
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

> "What is my current Stripe balance?"

If the server is working, you'll get a response with your account balance. If not, check:

1. **API key is valid** — test with `curl https://api.stripe.com/v1/balance -u sk_test_...:`
2. **Node.js >= 20** — run `node --version`
3. **Config file syntax** — validate your JSON (no trailing commas)
4. **Restart your IDE** — most IDEs require a full restart after config changes

## Security Recommendations

- Use **Stripe restricted keys** with only the permissions you need
- For production data, prefer `sk_live_` keys with read-only access only
- Never share config files containing API keys
- Add config files with secrets to `.gitignore`
- Rotate keys periodically via the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
