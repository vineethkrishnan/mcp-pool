import { OAuthProviderConfig } from "@vineethnkrishnan/oauth-core";

export const AUTH_CONFIG: OAuthProviderConfig = {
  name: "intercom",
  authUrl: "https://app.intercom.com/oauth",
  tokenUrl: "https://api.intercom.io/auth/eagle/token",
  scopes: [],
  envVars: {
    staticToken: "INTERCOM_ACCESS_TOKEN",
    clientId: "INTERCOM_CLIENT_ID",
    clientSecret: "INTERCOM_CLIENT_SECRET",
  },
};
