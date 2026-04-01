import { OAuthProviderConfig, AuthProvider, TokenProvider } from "./types";
import { createTokenStore } from "./token-store";
import { StaticTokenStrategy } from "./strategies/static-token.strategy";
import { OAuthStrategy } from "./strategies/oauth.strategy";
import { createAuthCli } from "./cli/auth-cli";

export function createAuthProvider(config: OAuthProviderConfig): AuthProvider {
  const tokenStore = createTokenStore(config.name);
  const handleCli = createAuthCli(config, tokenStore);
  const cliCommand = `${config.name}-mcp auth login`;

  let strategy: TokenProvider | null = null;

  function resolveStrategy(): TokenProvider | null {
    const staticToken = process.env[config.envVars.staticToken];
    if (staticToken) {
      return new StaticTokenStrategy(staticToken);
    }

    const clientId = process.env[config.envVars.clientId];
    const clientSecret = process.env[config.envVars.clientSecret];
    if (clientId && clientSecret) {
      return new OAuthStrategy(clientId, clientSecret, config.tokenUrl, tokenStore, cliCommand);
    }

    // Fallback: check for stored OAuth tokens from a previous login
    const stored = tokenStore.load();
    if (stored) {
      return new OAuthStrategy(
        stored.clientId,
        stored.clientSecret,
        config.tokenUrl,
        tokenStore,
        cliCommand,
      );
    }

    return null;
  }

  return {
    async getAccessToken(): Promise<string> {
      if (!strategy) {
        strategy = resolveStrategy();
      }
      if (!strategy) {
        throw new Error(
          `${config.name} authentication required.\n\n` +
            "Options:\n" +
            `  1. Set ${config.envVars.staticToken} for a static token\n` +
            `  2. Set ${config.envVars.clientId} + ${config.envVars.clientSecret}, then run:\n` +
            `     ${cliCommand}\n`,
        );
      }
      return strategy.getAccessToken();
    },
    handleCli,
  };
}
