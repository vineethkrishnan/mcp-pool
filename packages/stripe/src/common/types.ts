export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
