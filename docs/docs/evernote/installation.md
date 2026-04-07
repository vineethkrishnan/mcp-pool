---
sidebar_position: 2
title: Installation
description: Install and configure Evernote MCP for Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and Claude Code.
---

# Installation

Choose your preferred installation method and IDE below.

## Get Your Evernote Developer Token

Before configuring any IDE, you need an Evernote developer token:

1. Visit [Evernote Developer Tokens](https://dev.evernote.com/doc/articles/dev_tokens.php)
2. Sign in with your Evernote account
3. Click **Create a developer token**
4. Copy the generated token (starts with `S=s1:U=...`)

:::caution
Never commit your Evernote token to version control. Always use environment variables or IDE-specific secret management.
:::

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EVERNOTE_TOKEN` | Yes | Developer token or OAuth access token |
| `EVERNOTE_SANDBOX` | No | Set to `true` for sandbox environment (default: `false`) |

---

## Option A: Via npx (Recommended)

No installation needed. Your IDE will run the server on demand:

```bash
npx -y @vineethnkrishnan/evernote-mcp
```

This is the simplest method — just reference it in your IDE config below.

## Option B: Global Install

```bash
npm install -g @vineethnkrishnan/evernote-mcp
```

Then use `evernote-mcp` as the command in your IDE config (instead of `npx`).

## Option C: From Source

```bash
git clone https://github.com/vineethkrishnan/mcp-pool.git
cd mcp-pool
npm install
npm run build
```

Then use `node /absolute/path/to/mcp-pool/packages/evernote/build/index.js` as the command.

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
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
      }
    }
  }
}
```

**Using global install:**
```json
{
  "mcpServers": {
    "evernote": {
      "command": "evernote-mcp",
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
      }
    }
  }
}
```

**From source:**
```json
{
  "mcpServers": {
    "evernote": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-pool/packages/evernote/build/index.js"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
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
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "${input:evernote-token}"
      }
    }
  },
  "inputs": [
    {
      "id": "evernote-token",
      "description": "Evernote Developer Token",
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
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
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
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
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
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
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
   - **Name:** `evernote`
   - **Command:** `npx`
   - **Arguments:** `-y @vineethnkrishnan/evernote-mcp`
   - **Environment Variables:** `EVERNOTE_TOKEN=S=s1:U=...`
4. Click **OK** and restart the AI Assistant

**Alternative — manual config file:**

Create or edit `~/.config/JetBrains/mcp.json`:

```json
{
  "mcpServers": {
    "evernote": {
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
      }
    }
  }
}
```

---

### Claude Code (CLI)

**Option 1 — CLI command (recommended):**

```bash
claude mcp add evernote \
  --scope user \
  -e EVERNOTE_TOKEN=S=s1:U=... \
  -- npx -y @vineethnkrishnan/evernote-mcp
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
    "evernote": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vineethnkrishnan/evernote-mcp"],
      "env": {
        "EVERNOTE_TOKEN": "S=s1:U=..."
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
claude mcp remove evernote
```

### Claude Desktop / Cursor / Windsurf / JetBrains

Remove the `"evernote"` entry from the `"mcpServers"` block in the relevant config file, then restart the IDE.

### VS Code (GitHub Copilot)

Remove the `"evernote"` entry from the `"servers"` block in `.vscode/mcp.json` or user-level `mcp.json`, then reload the window.

### Global npm install

If you installed globally, also run:

```bash
npm uninstall -g @vineethnkrishnan/evernote-mcp
```

---

## Verify Installation

After configuring your IDE, test the connection by asking your AI assistant:

> "List all my Evernote notebooks."

If the server is working, you'll get a response with your notebooks. If not, check:

1. **Token is valid** — ensure your developer token hasn't expired
2. **Node.js >= 20** — run `node --version`
3. **Config file syntax** — validate your JSON (no trailing commas)
4. **Restart your IDE** — most IDEs require a full restart after config changes

## Security Recommendations

- Keep your developer token secure — it provides full access to your account
- Never share config files containing tokens
- Add config files with secrets to `.gitignore`
- Regenerate tokens periodically from the Evernote developer page
