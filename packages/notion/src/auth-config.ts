import { OAuthProviderConfig } from "@vineethnkrishnan/oauth-core";

export const AUTH_CONFIG: OAuthProviderConfig = {
  name: "notion",
  authUrl: "https://api.notion.com/v1/oauth/authorize",
  tokenUrl: "https://api.notion.com/v1/oauth/token",
  scopes: [],
  envVars: {
    staticToken: "NOTION_API_KEY",
    clientId: "NOTION_CLIENT_ID",
    clientSecret: "NOTION_CLIENT_SECRET",
  },
  tokenRequestAuth: "basic",
};
