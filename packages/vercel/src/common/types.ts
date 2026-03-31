export interface VercelConfig {
  token: string;
  teamId?: string;
}

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}
