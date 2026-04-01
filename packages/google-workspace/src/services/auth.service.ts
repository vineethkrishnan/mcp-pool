import {
  TokenProvider,
  StaticTokenStrategy,
  OAuthStrategy,
  createTokenStore,
} from "@vineethnkrishnan/oauth-core";
import { GoogleWorkspaceConfig } from "../common/types";
import { ServiceAccountStrategy } from "../auth/strategies/service-account.strategy";

export class GoogleAuthService implements TokenProvider {
  private strategy: TokenProvider;

  constructor(config: GoogleWorkspaceConfig) {
    if (config.accessToken) {
      this.strategy = new StaticTokenStrategy(config.accessToken);
    } else if (config.serviceAccountKey) {
      this.strategy = new ServiceAccountStrategy(config.serviceAccountKey, config.delegatedUser);
    } else if (config.clientId && config.clientSecret) {
      const tokenStore = createTokenStore("google-workspace");
      this.strategy = new OAuthStrategy(
        config.clientId,
        config.clientSecret,
        "https://oauth2.googleapis.com/token",
        tokenStore,
        "google-workspace-mcp auth login",
      );
    } else {
      throw new Error(
        "Google Workspace authentication required. " +
          "Set GOOGLE_ACCESS_TOKEN, GOOGLE_SERVICE_ACCOUNT_KEY, or " +
          "GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET environment variables. " +
          "Get a token from https://developers.google.com/oauthplayground/",
      );
    }
  }

  async getAccessToken(): Promise<string> {
    return this.strategy.getAccessToken();
  }
}
