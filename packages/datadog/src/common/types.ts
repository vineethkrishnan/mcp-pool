export interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
