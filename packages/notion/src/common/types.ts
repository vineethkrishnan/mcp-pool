export interface NotionConfig {
  apiKey: string;
  notionVersion: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
