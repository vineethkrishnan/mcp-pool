import { OAuthProviderConfig } from "@vineethnkrishnan/oauth-core";

export const AUTH_CONFIG: OAuthProviderConfig = {
  name: "hubspot",
  authUrl: "https://app.hubspot.com/oauth/authorize",
  tokenUrl: "https://api.hubapi.com/oauth/v1/token",
  scopes: ["crm.objects.contacts.read", "crm.objects.deals.read", "crm.objects.companies.read"],
  envVars: {
    staticToken: "HUBSPOT_ACCESS_TOKEN",
    clientId: "HUBSPOT_CLIENT_ID",
    clientSecret: "HUBSPOT_CLIENT_SECRET",
  },
};
