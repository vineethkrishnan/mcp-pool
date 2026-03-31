export interface SentryConfig {
  authToken: string;
  baseUrl: string;
  org?: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
