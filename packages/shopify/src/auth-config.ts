import { OAuthProviderConfig } from "@vineethnkrishnan/oauth-core";

export const AUTH_CONFIG: OAuthProviderConfig = {
  name: "shopify",
  authUrl: "https://accounts.shopify.com/oauth/authorize",
  tokenUrl: "https://accounts.shopify.com/oauth/token",
  scopes: ["read_orders", "read_products", "read_customers"],
  envVars: {
    staticToken: "SHOPIFY_ACCESS_TOKEN",
    clientId: "SHOPIFY_CLIENT_ID",
    clientSecret: "SHOPIFY_CLIENT_SECRET",
  },
};
