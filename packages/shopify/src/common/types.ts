import { TokenProvider } from "@vineethnkrishnan/oauth-core";

export interface ShopifyConfig {
  storeUrl: string;
  tokenProvider: TokenProvider;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
