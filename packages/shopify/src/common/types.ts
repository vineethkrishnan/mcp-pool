export interface ShopifyConfig {
  storeUrl: string;
  accessToken: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
