import { exec } from "node:child_process";
import { platform } from "node:os";
import { startCallbackServer } from "./oauth-callback-server";
import { TokenResponse, OAuthProviderConfig, TokenStore } from "../types";

function openBrowser(url: string): void {
  const cmd = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  exec(`${cmd} "${url}"`);
}

function log(message: string): void {
  process.stderr.write(message + "\n");
}

export function createAuthCli(
  config: OAuthProviderConfig,
  tokenStore: TokenStore,
): (args: string[]) => Promise<void> {
  const binName = `${config.name}-mcp`;

  async function login(): Promise<void> {
    const clientId = process.env[config.envVars.clientId];
    const clientSecret = process.env[config.envVars.clientSecret];

    if (!clientId || !clientSecret) {
      log(
        `Error: ${config.envVars.clientId} and ${config.envVars.clientSecret} environment variables are required.\n\n` +
          "1. Create an OAuth 2.0 app in your provider's developer console\n" +
          `2. Set ${config.envVars.clientId} and ${config.envVars.clientSecret}, then retry`,
      );
      process.exit(1);
    }

    const server = await startCallbackServer();
    const redirectUri = `http://127.0.0.1:${server.port}/callback`;

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    if (config.scopes.length > 0) {
      authUrl.searchParams.set("scope", config.scopes.join(" "));
    }
    if (config.authUrlParams) {
      for (const [key, value] of Object.entries(config.authUrlParams)) {
        authUrl.searchParams.set(key, value);
      }
    }

    log(`Opening browser for ${config.name} authorization...`);
    openBrowser(authUrl.toString());
    log("Waiting for authorization...\n");

    let code: string;
    try {
      code = await server.waitForCode();
    } catch (err) {
      log(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
      return;
    }

    // Build token exchange request
    log("Exchanging authorization code for tokens...");
    const bodyParams = new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (config.tokenRequestAuth === "basic") {
      headers["Authorization"] =
        `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    } else {
      bodyParams.set("client_id", clientId);
      bodyParams.set("client_secret", clientSecret);
    }

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      log(`Error: Token exchange failed (${response.status}): ${errorBody || response.statusText}`);
      process.exit(1);
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.refresh_token) {
      log(
        "Warning: No refresh token received. The provider may require re-authorization.\n" +
          "Try revoking access and running login again.",
      );
      process.exit(1);
    }

    tokenStore.save({
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      clientId,
      clientSecret,
    });

    log("Authentication successful! Tokens saved.");
    log(`You can now start the MCP server without ${config.envVars.staticToken}.`);
  }

  function logout(): void {
    if (!tokenStore.exists()) {
      log("No stored tokens found.");
      return;
    }
    tokenStore.clear();
    log("Stored tokens cleared.");
  }

  function status(): void {
    if (process.env[config.envVars.staticToken]) {
      log(`Auth mode: Static access token (${config.envVars.staticToken})`);
      return;
    }

    if (process.env[config.envVars.clientId]) {
      log(`Auth mode: OAuth 2.0 (${config.envVars.clientId} set)`);
    }

    const stored = tokenStore.load();
    if (stored) {
      const expired = Date.now() > stored.expiresAt;
      log("Stored tokens: found");
      log(`  Access token: ${expired ? "expired (will auto-refresh)" : "valid"}`);
      log("  Refresh token: present");
      log(`  Client ID: ${stored.clientId.slice(0, 20)}...`);
    } else {
      log("Stored tokens: none");
      log(`\nRun \`${binName} auth login\` to authenticate.`);
    }
  }

  return async function handleCli(args: string[]): Promise<void> {
    const subcommand = args[0];
    switch (subcommand) {
      case "login":
        await login();
        break;
      case "logout":
        logout();
        break;
      case "status":
        status();
        break;
      default:
        log(
          `Usage: ${binName} auth <command>\n\n` +
            "Commands:\n" +
            `  login   Authenticate with ${config.name} via browser\n` +
            "  logout  Clear stored tokens\n" +
            "  status  Show current authentication state",
        );
        break;
    }
  };
}
