export interface PagerDutyConfig {
  apiKey: string;
  baseUrl: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
