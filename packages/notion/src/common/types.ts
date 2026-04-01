import { TokenProvider } from "@vineethnkrishnan/oauth-core";

export interface NotionConfig {
  tokenProvider: TokenProvider;
  notionVersion: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
