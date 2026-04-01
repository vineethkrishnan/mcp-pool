import { OAuthProviderConfig } from "@vineethnkrishnan/oauth-core";

export const AUTH_CONFIG: OAuthProviderConfig = {
  name: "linear",
  authUrl: "https://linear.app/oauth/authorize",
  tokenUrl: "https://api.linear.app/oauth/token",
  scopes: ["read"],
  envVars: {
    staticToken: "LINEAR_API_KEY",
    clientId: "LINEAR_CLIENT_ID",
    clientSecret: "LINEAR_CLIENT_SECRET",
  },
};
