import { TokenProvider } from "@vineethnkrishnan/oauth-core";

export interface LinearConfig {
  tokenProvider: TokenProvider;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
